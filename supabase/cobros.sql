-- ============================================================
-- COBROS — Tabla para el sistema de pagos con Bold
-- Ejecutar en: app.supabase.com → SQL Editor → Run
-- ============================================================

CREATE TABLE IF NOT EXISTS cobros (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referencia           TEXT UNIQUE NOT NULL,

  -- Datos del técnico
  tecnico_id           UUID REFERENCES tecnicos(id) ON DELETE SET NULL,
  tecnico_nombre       TEXT NOT NULL,
  tecnico_telefono     TEXT NOT NULL,

  -- Datos del cliente
  cliente_nombre       TEXT NOT NULL,
  cliente_telefono     TEXT NOT NULL,
  ciudad               TEXT,

  -- Descripción y montos
  descripcion          TEXT NOT NULL,
  valor_total          INTEGER NOT NULL,            -- Monto en COP que paga el cliente
  porcentaje_comision  INTEGER NOT NULL DEFAULT 15, -- % que retiene ServiYa
  valor_comision       INTEGER NOT NULL,            -- Comisión calculada
  valor_tecnico        INTEGER NOT NULL,            -- Lo que recibe el técnico

  -- Estado del cobro
  estado               TEXT NOT NULL DEFAULT 'pendiente'
                         CHECK (estado IN ('pendiente','pagado','fallido','reembolsado')),

  -- Datos de Bold
  bold_payment_link_id TEXT,           -- LNK_XXXXXXX
  bold_payment_id      TEXT,           -- ID de la transacción aprobada
  bold_link            TEXT,           -- URL del checkout Bold

  -- Pago al técnico
  pagado_tecnico       BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_pago_tecnico   TIMESTAMPTZ,

  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger: updated_at automático
CREATE OR REPLACE FUNCTION set_cobros_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cobros_updated_at ON cobros;
CREATE TRIGGER trg_cobros_updated_at
  BEFORE UPDATE ON cobros
  FOR EACH ROW
  EXECUTE FUNCTION set_cobros_updated_at();

-- ============================================================
-- RLS — cobros
-- ============================================================

ALTER TABLE cobros ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin: ver todos los cobros" ON cobros;
DROP POLICY IF EXISTS "Admin: actualizar cobros" ON cobros;
DROP POLICY IF EXISTS "Tecnico: ver sus cobros" ON cobros;
DROP POLICY IF EXISTS "Tecnico: crear cobros" ON cobros;
DROP POLICY IF EXISTS "Service role: gestionar cobros" ON cobros;

-- Admin puede ver y actualizar todo
CREATE POLICY "Admin: ver todos los cobros" ON cobros
  FOR SELECT USING (
    auth.role() = 'authenticated'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admin: actualizar cobros" ON cobros
  FOR UPDATE USING (
    auth.role() = 'authenticated'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Técnico solo ve sus propios cobros
CREATE POLICY "Tecnico: ver sus cobros" ON cobros
  FOR SELECT USING (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM tecnicos t
      WHERE t.id = cobros.tecnico_id
        AND t.auth_user_id = auth.uid()
    )
  );

-- Técnico puede crear cobros propios
CREATE POLICY "Tecnico: crear cobros" ON cobros
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM tecnicos t
      WHERE t.id = cobros.tecnico_id
        AND t.auth_user_id = auth.uid()
    )
  );
