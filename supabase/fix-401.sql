-- ============================================================================
-- SOLUCIÓN AL ERROR 401 AL SOLICITAR SERVICIO (SECURITY DEFINER TRIGGER)
-- Pega esto en: app.supabase.com → SQL Editor → New Query → Run
-- ============================================================================

-- Modificamos la función para que se ejecute con máximos privilegios 
-- (SECURITY DEFINER) y pueda crear la cuenta del cliente sin ser bloqueada
-- por las reglas de seguridad (RLS).

CREATE OR REPLACE FUNCTION sync_cliente_from_solicitud()
RETURNS TRIGGER 
SECURITY DEFINER -- ¡ESTA ES LA LÍNEA MÁGICA QUE SOLUCIONA EL ERROR!
AS $$
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
