-- ============================================================
-- MIGRACIÓN: Vinculación cobros ↔ solicitudes + fecha_pago
-- Ejecutar en: app.supabase.com → SQL Editor → Run
-- ============================================================

-- 1. Agregar columna solicitud_id a cobros (FK nullable)
ALTER TABLE cobros
  ADD COLUMN IF NOT EXISTS solicitud_id UUID REFERENCES solicitudes(id) ON DELETE SET NULL;

-- 2. Agregar columna fecha_pago (para registrar cuándo se aprobó el pago)
ALTER TABLE cobros
  ADD COLUMN IF NOT EXISTS fecha_pago TIMESTAMPTZ;

-- 3. Agregar cliente_email a cobros (ya existe en el código, puede que falte en la BD)
ALTER TABLE cobros
  ADD COLUMN IF NOT EXISTS cliente_email TEXT;

-- 4. Índice para búsquedas por solicitud y referencia
CREATE INDEX IF NOT EXISTS idx_cobros_solicitud_id ON cobros(solicitud_id);
CREATE INDEX IF NOT EXISTS idx_cobros_referencia   ON cobros(referencia);
CREATE INDEX IF NOT EXISTS idx_cobros_tecnico_id   ON cobros(tecnico_id);

-- ============================================================
-- NOTAS:
-- • Cuando el técnico genera un cobro desde /tecnico/cobrar,
--   se puede pasar solicitud_id para vincularlo directamente.
-- • El webhook bold-webhook/route.js usa solicitud_id primero,
--   luego busca por tecnico_id + cliente_telefono como fallback.
-- ============================================================
