-- Arreglar tabla cobros: agregar columna cliente_email que faltaba
-- y hacer tecnico_telefono nullable para casos donde no está disponible
-- Ejecutar en: supabase.com/dashboard → SQL Editor → Run

-- Agregar cliente_email si no existe
ALTER TABLE cobros 
  ADD COLUMN IF NOT EXISTS cliente_email TEXT;

-- Hacer tecnico_telefono nullable (por si el técnico no tiene teléfono registrado)
ALTER TABLE cobros 
  ALTER COLUMN tecnico_telefono DROP NOT NULL;

-- Hacer cliente_telefono nullable por seguridad
ALTER TABLE cobros 
  ALTER COLUMN cliente_telefono DROP NOT NULL;

-- Confirmar cambios
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'cobros' 
ORDER BY ordinal_position;
