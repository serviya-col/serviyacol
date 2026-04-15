-- ============================================================
-- SERVIYA — Solo ejecutar estos cambios (tablas ya existen)
-- Pega esto en: app.supabase.com → SQL Editor → Run
-- ============================================================

-- 0. CREAR BUCKET Y POLÍTICAS DE STORAGE (IMPORTANTE PARA FOTOS)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos-tecnicos', 'documentos-tecnicos', true)
ON CONFLICT (id) DO NOTHING;

-- Dar permisos para que cualquier persona logueada pueda subir archivos
CREATE POLICY "Permitir subida a autenticados" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'documentos-tecnicos'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Permitir ver a todo el mundo" ON storage.objects
  FOR SELECT
  USING ( bucket_id = 'documentos-tecnicos' );

CREATE POLICY "Permitir que cada quien actualice sus archivos" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'documentos-tecnicos'
    AND auth.role() = 'authenticated'
  );

-- 1. Agregar columna auth_user_id a tecnicos (si no existe)
ALTER TABLE tecnicos ADD COLUMN IF NOT EXISTS
  auth_user_id UUID REFERENCES auth.users(id) UNIQUE;
ALTER TABLE tecnicos ADD COLUMN IF NOT EXISTS foto_perfil_url TEXT;

CREATE TABLE IF NOT EXISTS tecnico_pagos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tecnico_id UUID UNIQUE NOT NULL REFERENCES tecnicos(id) ON DELETE CASCADE,
  banco_nombre TEXT NOT NULL,
  tipo_cuenta TEXT NOT NULL CHECK (tipo_cuenta IN ('ahorros', 'corriente')),
  numero_cuenta TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Migración de datos bancarios antiguos guardados en tecnicos (si existían)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tecnicos' AND column_name = 'banco_nombre'
  ) THEN
    INSERT INTO tecnico_pagos (tecnico_id, banco_nombre, tipo_cuenta, numero_cuenta)
    SELECT
      t.id,
      t.banco_nombre,
      COALESCE(NULLIF(t.tipo_cuenta, ''), 'ahorros'),
      t.numero_cuenta
    FROM tecnicos t
    WHERE t.banco_nombre IS NOT NULL
      AND t.numero_cuenta IS NOT NULL
    ON CONFLICT (tecnico_id) DO UPDATE SET
      banco_nombre = EXCLUDED.banco_nombre,
      tipo_cuenta = EXCLUDED.tipo_cuenta,
      numero_cuenta = EXCLUDED.numero_cuenta,
      updated_at = now();

    ALTER TABLE tecnicos DROP COLUMN IF EXISTS banco_nombre;
    ALTER TABLE tecnicos DROP COLUMN IF EXISTS tipo_cuenta;
    ALTER TABLE tecnicos DROP COLUMN IF EXISTS numero_cuenta;
  END IF;
END $$;

-- ============================================================
-- 2. CLIENTES (tabla formal + relación con solicitudes)
-- ============================================================

CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  nombre TEXT,
  telefono TEXT,
  email TEXT UNIQUE,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL;

-- Backfill desde solicitudes históricas con email
INSERT INTO clientes (nombre, telefono, email)
SELECT
  MAX(NULLIF(TRIM(s.cliente_nombre), '')) AS nombre,
  MAX(NULLIF(TRIM(s.cliente_telefono), '')) AS telefono,
  LOWER(TRIM(s.cliente_email)) AS email
FROM solicitudes s
WHERE s.cliente_email IS NOT NULL
  AND TRIM(s.cliente_email) <> ''
GROUP BY LOWER(TRIM(s.cliente_email))
ON CONFLICT (email) DO UPDATE SET
  nombre = COALESCE(EXCLUDED.nombre, clientes.nombre),
  telefono = COALESCE(EXCLUDED.telefono, clientes.telefono),
  updated_at = now();

-- Vincular solicitudes a cliente_id por email
UPDATE solicitudes s
SET cliente_id = c.id
FROM clientes c
WHERE s.cliente_id IS NULL
  AND s.cliente_email IS NOT NULL
  AND LOWER(TRIM(s.cliente_email)) = c.email;

-- Trigger: mantiene updated_at en clientes
CREATE OR REPLACE FUNCTION set_clientes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_clientes_updated_at ON clientes;
CREATE TRIGGER trg_clientes_updated_at
BEFORE UPDATE ON clientes
FOR EACH ROW
EXECUTE FUNCTION set_clientes_updated_at();

-- Trigger: sincroniza datos de cliente desde solicitudes
CREATE OR REPLACE FUNCTION sync_cliente_from_solicitud()
RETURNS TRIGGER AS $$
DECLARE
  v_email TEXT;
  v_cliente_id UUID;
BEGIN
  v_email := LOWER(TRIM(COALESCE(NEW.cliente_email, '')));
  IF v_email = '' THEN
    RETURN NEW;
  END IF;

  INSERT INTO clientes (nombre, telefono, email)
  VALUES (NULLIF(TRIM(NEW.cliente_nombre), ''), NULLIF(TRIM(NEW.cliente_telefono), ''), v_email)
  ON CONFLICT (email) DO UPDATE SET
    nombre = COALESCE(NULLIF(TRIM(EXCLUDED.nombre), ''), clientes.nombre),
    telefono = COALESCE(NULLIF(TRIM(EXCLUDED.telefono), ''), clientes.telefono),
    updated_at = now()
  RETURNING id INTO v_cliente_id;

  NEW.cliente_email := v_email;
  NEW.cliente_id := COALESCE(NEW.cliente_id, v_cliente_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_cliente_from_solicitud ON solicitudes;
CREATE TRIGGER trg_sync_cliente_from_solicitud
BEFORE INSERT OR UPDATE ON solicitudes
FOR EACH ROW
EXECUTE FUNCTION sync_cliente_from_solicitud();

-- Validación de negocio: el técnico asignado debe ser de la misma ciudad
CREATE OR REPLACE FUNCTION validate_tecnico_ciudad_match()
RETURNS TRIGGER AS $$
DECLARE
  v_tecnico_ciudad TEXT;
BEGIN
  IF NEW.tecnico_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT t.ciudad INTO v_tecnico_ciudad
  FROM tecnicos t
  WHERE t.id = NEW.tecnico_id;

  IF v_tecnico_ciudad IS NULL THEN
    RAISE EXCEPTION 'No existe el técnico asignado.';
  END IF;

  IF NEW.ciudad IS NULL OR TRIM(NEW.ciudad) = '' THEN
    RAISE EXCEPTION 'La solicitud debe tener ciudad para asignar un técnico.';
  END IF;

  IF LOWER(TRIM(v_tecnico_ciudad)) <> LOWER(TRIM(NEW.ciudad)) THEN
    RAISE EXCEPTION 'El técnico (%) no pertenece a la misma ciudad de la solicitud (%).', v_tecnico_ciudad, NEW.ciudad;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_tecnico_ciudad_match ON solicitudes;
CREATE TRIGGER trg_validate_tecnico_ciudad_match
BEFORE INSERT OR UPDATE OF tecnico_id, ciudad ON solicitudes
FOR EACH ROW
EXECUTE FUNCTION validate_tecnico_ciudad_match();

-- No mezclar identidades: un usuario auth no puede ser cliente y técnico a la vez
CREATE OR REPLACE FUNCTION validate_actor_profile_exclusivity()
RETURNS TRIGGER AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  IF NEW.auth_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE((u.raw_app_meta_data ->> 'role') = 'admin', FALSE)
  INTO v_is_admin
  FROM auth.users u
  WHERE u.id = NEW.auth_user_id;

  IF TG_TABLE_NAME = 'clientes' THEN
    IF v_is_admin THEN
      RAISE EXCEPTION 'El usuario admin no puede tener perfil de cliente.';
    END IF;
    IF EXISTS (SELECT 1 FROM tecnicos t WHERE t.auth_user_id = NEW.auth_user_id) THEN
      RAISE EXCEPTION 'Este usuario ya tiene perfil técnico y no puede ser cliente.';
    END IF;
  ELSIF TG_TABLE_NAME = 'tecnicos' THEN
    IF v_is_admin THEN
      RAISE EXCEPTION 'El usuario admin no puede tener perfil técnico.';
    END IF;
    IF EXISTS (SELECT 1 FROM clientes c WHERE c.auth_user_id = NEW.auth_user_id) THEN
      RAISE EXCEPTION 'Este usuario ya tiene perfil cliente y no puede ser técnico.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_cliente_exclusivity ON clientes;
CREATE TRIGGER trg_validate_cliente_exclusivity
BEFORE INSERT OR UPDATE OF auth_user_id ON clientes
FOR EACH ROW
EXECUTE FUNCTION validate_actor_profile_exclusivity();

DROP TRIGGER IF EXISTS trg_validate_tecnico_exclusivity ON tecnicos;
CREATE TRIGGER trg_validate_tecnico_exclusivity
BEFORE INSERT OR UPDATE OF auth_user_id ON tecnicos
FOR EACH ROW
EXECUTE FUNCTION validate_actor_profile_exclusivity();

-- ============================================================
-- 3. POLÍTICAS RLS — tecnicos
-- ============================================================

-- Eliminar políticas anteriores
DROP POLICY IF EXISTS "Técnicos visibles para todos" ON tecnicos;
DROP POLICY IF EXISTS "Cualquiera puede registrarse como técnico" ON tecnicos;
DROP POLICY IF EXISTS "Auth can see all tecnicos" ON tecnicos;
DROP POLICY IF EXISTS "Auth: ver todos los tecnicos" ON tecnicos;
DROP POLICY IF EXISTS "Auth: tecnico se registra" ON tecnicos;
DROP POLICY IF EXISTS "Auth: tecnico actualiza su perfil" ON tecnicos;
DROP POLICY IF EXISTS "Auth: admin actualiza tecnicos" ON tecnicos;
DROP POLICY IF EXISTS "Publico: ver tecnicos activos" ON tecnicos;

-- Asegurarse que RLS está habilitado
ALTER TABLE tecnicos ENABLE ROW LEVEL SECURITY;

-- Público puede ver técnicos activos (home page)
CREATE POLICY "Publico: ver tecnicos activos" ON tecnicos
  FOR SELECT USING (activo = TRUE);

-- Usuarios autenticados ven TODOS los técnicos (admin + panel técnico)
CREATE POLICY "Auth: ver todos los tecnicos" ON tecnicos
  FOR SELECT USING (auth.role() = 'authenticated');

-- Técnico se registra: auth_user_id debe coincidir con usuario actual
CREATE POLICY "Auth: tecnico se registra" ON tecnicos
  FOR INSERT WITH CHECK (
    auth.uid() = auth_user_id
    AND COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') <> 'admin'
    AND NOT EXISTS (
      SELECT 1
      FROM clientes c
      WHERE c.auth_user_id = auth.uid()
    )
  );

-- Técnico actualiza su propio perfil
CREATE POLICY "Auth: tecnico actualiza su perfil" ON tecnicos
  FOR UPDATE USING (auth.uid() = auth_user_id);

-- Admin puede actualizar cualquier técnico (verificar, activar)
CREATE POLICY "Auth: admin actualiza tecnicos" ON tecnicos
  FOR UPDATE USING (auth.role() = 'authenticated');

-- ============================================================
-- 4. POLÍTICAS RLS — tecnico_pagos
-- ============================================================

CREATE OR REPLACE FUNCTION set_tecnico_pagos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tecnico_pagos_updated_at ON tecnico_pagos;
CREATE TRIGGER trg_tecnico_pagos_updated_at
BEFORE UPDATE ON tecnico_pagos
FOR EACH ROW
EXECUTE FUNCTION set_tecnico_pagos_updated_at();

DROP POLICY IF EXISTS "Admin: ver pagos de tecnicos" ON tecnico_pagos;
DROP POLICY IF EXISTS "Admin: actualizar pagos de tecnicos" ON tecnico_pagos;
DROP POLICY IF EXISTS "Tecnico: ver sus datos de pago" ON tecnico_pagos;
DROP POLICY IF EXISTS "Tecnico: insertar sus datos de pago" ON tecnico_pagos;
DROP POLICY IF EXISTS "Tecnico: actualizar sus datos de pago" ON tecnico_pagos;

ALTER TABLE tecnico_pagos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin: ver pagos de tecnicos" ON tecnico_pagos
  FOR SELECT USING (
    auth.role() = 'authenticated'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admin: actualizar pagos de tecnicos" ON tecnico_pagos
  FOR UPDATE USING (
    auth.role() = 'authenticated'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Tecnico: ver sus datos de pago" ON tecnico_pagos
  FOR SELECT USING (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1
      FROM tecnicos t
      WHERE t.id = tecnico_pagos.tecnico_id
        AND t.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Tecnico: insertar sus datos de pago" ON tecnico_pagos
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1
      FROM tecnicos t
      WHERE t.id = tecnico_pagos.tecnico_id
        AND t.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Tecnico: actualizar sus datos de pago" ON tecnico_pagos
  FOR UPDATE USING (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1
      FROM tecnicos t
      WHERE t.id = tecnico_pagos.tecnico_id
        AND t.auth_user_id = auth.uid()
    )
  );

-- ============================================================
-- 5. POLÍTICAS RLS — clientes
-- ============================================================

DROP POLICY IF EXISTS "Admin: ver todos los clientes" ON clientes;
DROP POLICY IF EXISTS "Admin: actualizar clientes" ON clientes;
DROP POLICY IF EXISTS "Cliente: ver su perfil" ON clientes;
DROP POLICY IF EXISTS "Cliente: crear su perfil" ON clientes;
DROP POLICY IF EXISTS "Cliente: actualizar su perfil" ON clientes;

ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin: ver todos los clientes" ON clientes
  FOR SELECT USING (
    auth.role() = 'authenticated'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admin: actualizar clientes" ON clientes
  FOR UPDATE USING (
    auth.role() = 'authenticated'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Cliente: ver su perfil" ON clientes
  FOR SELECT USING (
    auth.role() = 'authenticated'
    AND auth.uid() = auth_user_id
  );

CREATE POLICY "Cliente: crear su perfil" ON clientes
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
    AND auth.uid() = auth_user_id
    AND COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') <> 'admin'
    AND NOT EXISTS (
      SELECT 1
      FROM tecnicos t
      WHERE t.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Cliente: actualizar su perfil" ON clientes
  FOR UPDATE USING (
    auth.role() = 'authenticated'
    AND auth.uid() = auth_user_id
    AND COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') <> 'admin'
    AND NOT EXISTS (
      SELECT 1
      FROM tecnicos t
      WHERE t.auth_user_id = auth.uid()
    )
  );

-- ============================================================
-- 6. POLÍTICAS RLS — solicitudes
-- ============================================================

DROP POLICY IF EXISTS "Cualquiera puede crear solicitud" ON solicitudes;
DROP POLICY IF EXISTS "Auth: leer solicitudes" ON solicitudes;
DROP POLICY IF EXISTS "Auth: actualizar solicitudes" ON solicitudes;
DROP POLICY IF EXISTS "Publico: crear solicitud" ON solicitudes;
DROP POLICY IF EXISTS "Cliente: leer sus solicitudes" ON solicitudes;
DROP POLICY IF EXISTS "Cliente: actualizar sus solicitudes" ON solicitudes;
DROP POLICY IF EXISTS "Tecnico: leer solicitudes relevantes" ON solicitudes;
DROP POLICY IF EXISTS "Tecnico: actualizar solicitudes asignadas" ON solicitudes;
DROP POLICY IF EXISTS "Admin: leer todas las solicitudes" ON solicitudes;
DROP POLICY IF EXISTS "Admin: actualizar todas las solicitudes" ON solicitudes;

ALTER TABLE solicitudes ENABLE ROW LEVEL SECURITY;

-- Clientes (sin cuenta) pueden crear solicitudes
CREATE POLICY "Publico: crear solicitud" ON solicitudes
  FOR INSERT WITH CHECK (TRUE);

-- Cliente autenticado: solo ve sus solicitudes (por correo del JWT)
CREATE POLICY "Cliente: leer sus solicitudes" ON solicitudes
  FOR SELECT USING (
    auth.role() = 'authenticated'
    AND (
      (
        cliente_email IS NOT NULL
        AND lower(cliente_email) = lower(auth.jwt() ->> 'email')
      )
      OR EXISTS (
        SELECT 1
        FROM clientes c
        WHERE c.id = solicitudes.cliente_id
          AND c.auth_user_id = auth.uid()
      )
    )
  );

-- Cliente autenticado: solo puede actualizar sus solicitudes
-- (por ejemplo, cancelar antes de que se inicie el trabajo)
CREATE POLICY "Cliente: actualizar sus solicitudes" ON solicitudes
  FOR UPDATE USING (
    auth.role() = 'authenticated'
    AND (
      (
        cliente_email IS NOT NULL
        AND lower(cliente_email) = lower(auth.jwt() ->> 'email')
      )
      OR EXISTS (
        SELECT 1
        FROM clientes c
        WHERE c.id = solicitudes.cliente_id
          AND c.auth_user_id = auth.uid()
      )
    )
  );

-- Técnico autenticado:
-- 1) puede ver solicitudes ya asignadas a él
-- 2) puede ver pendientes de su ciudad para poder aceptarlas
CREATE POLICY "Tecnico: leer solicitudes relevantes" ON solicitudes
  FOR SELECT USING (
    auth.role() = 'authenticated'
    AND (
      EXISTS (
        SELECT 1
        FROM tecnicos t
        WHERE t.auth_user_id = auth.uid()
          AND t.id = solicitudes.tecnico_id
      )
      OR EXISTS (
        SELECT 1
        FROM tecnicos t
        WHERE t.auth_user_id = auth.uid()
          AND solicitudes.tecnico_id IS NULL
          AND solicitudes.estado = 'pendiente'
          AND t.ciudad = solicitudes.ciudad
      )
    )
  );

-- Técnico autenticado: solo actualiza solicitudes asignadas a él
CREATE POLICY "Tecnico: actualizar solicitudes asignadas" ON solicitudes
  FOR UPDATE USING (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1
      FROM tecnicos t
      WHERE t.auth_user_id = auth.uid()
        AND t.id = solicitudes.tecnico_id
    )
  );

-- Admin por claim de rol en JWT (recomendado: app_metadata.role = 'admin')
CREATE POLICY "Admin: leer todas las solicitudes" ON solicitudes
  FOR SELECT USING (
    auth.role() = 'authenticated'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admin: actualizar todas las solicitudes" ON solicitudes
  FOR UPDATE USING (
    auth.role() = 'authenticated'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- ============================================================
-- 7. POLÍTICAS RLS — resenas (si existe)
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'resenas') THEN
    ALTER TABLE resenas ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Reseñas visibles para todos" ON resenas;
    DROP POLICY IF EXISTS "Publico: ver resenas" ON resenas;
    DROP POLICY IF EXISTS "Publico: crear resena" ON resenas;

    CREATE POLICY "Publico: ver resenas" ON resenas
      FOR SELECT USING (TRUE);

    CREATE POLICY "Publico: crear resena" ON resenas
      FOR INSERT WITH CHECK (TRUE);
  END IF;
END $$;
