-- ============================================================================
-- FIX COMPLETO: Registro de Técnico y Cliente — ServiYa
-- Pega esto en: app.supabase.com → SQL Editor → New Query → Run
-- ============================================================================
--
-- BUGS CORREGIDOS:
--
-- BUG 1 (crítico, técnico Y cliente):
--   validate_actor_profile_exclusivity() consulta auth.users sin SECURITY
--   DEFINER → "permission denied for table users" al hacer INSERT en tecnicos
--   o clientes con auth_user_id.
--
-- BUG 2 (cliente que ya tenía solicitud previa sin cuenta):
--   El SELECT de clientes por email falla porque el registro existente tiene
--   auth_user_id NULL → la política "Cliente: ver su perfil" no lo retorna.
--
-- BUG 3 (cliente que ya tenía solicitud previa sin cuenta):
--   El UPDATE para vincular auth_user_id a un cliente existente falla porque
--   la política "Cliente: actualizar su perfil" exige auth.uid() = auth_user_id,
--   pero auth_user_id es NULL en ese momento.
-- ============================================================================

-- ── FIX 1: SECURITY DEFINER en el trigger de exclusividad de roles ──────────
CREATE OR REPLACE FUNCTION validate_actor_profile_exclusivity()
RETURNS TRIGGER AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  IF NEW.auth_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Con SECURITY DEFINER podemos leer auth.users sin restricción de RLS
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- ← SECURITY DEFINER: el trigger corre con permisos del owner (postgres)

-- ── FIX 2: Permitir que un cliente vea su registro por email ────────────────
-- (Necesario cuando el cliente ya tenía una solicitud y su registro existe
--  con auth_user_id NULL — sin esta política no puede verlo para vincularlo)
DROP POLICY IF EXISTS "Cliente: ver por correo" ON clientes;
CREATE POLICY "Cliente: ver por correo" ON clientes
  FOR SELECT USING (
    auth.role() = 'authenticated'
    AND lower(email) = lower(auth.jwt() ->> 'email')
  );

-- ── FIX 3: Permitir que un cliente vincule su cuenta a un registro existente ─
-- (Necesario cuando el registro tiene auth_user_id NULL y el email coincide)
DROP POLICY IF EXISTS "Cliente: vincular cuenta" ON clientes;
CREATE POLICY "Cliente: vincular cuenta" ON clientes
  FOR UPDATE USING (
    auth.role() = 'authenticated'
    AND auth_user_id IS NULL
    AND lower(email) = lower(auth.jwt() ->> 'email')
    AND COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '') <> 'admin'
  );

-- ── Verificación final ──────────────────────────────────────────────────────
-- Debe mostrar prosecdef = true para la función corregida:
SELECT proname, prosecdef
FROM pg_proc
WHERE proname = 'validate_actor_profile_exclusivity';

-- Debe listar las nuevas políticas de clientes:
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'clientes'
ORDER BY policyname;
