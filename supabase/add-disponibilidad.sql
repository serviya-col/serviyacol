-- ============================================================
-- ServiYa — Disponibilidad de técnicos + técnico preferido
-- Ejecutar en: Supabase → SQL Editor
-- ============================================================

-- 1. Columna disponibilidad en tecnicos
ALTER TABLE tecnicos
  ADD COLUMN IF NOT EXISTS disponibilidad TEXT NOT NULL DEFAULT 'disponible'
  CHECK (disponibilidad IN ('disponible', 'ocupado', 'fuera_de_servicio'));

-- 2. Índice para búsquedas por ciudad + categoría + disponibilidad
CREATE INDEX IF NOT EXISTS idx_tecnicos_busqueda
  ON tecnicos (ciudad, categoria, disponibilidad, verificado, activo);

-- 3. Columna tecnico_preferido_id en solicitudes
--    (cliente puede haber pedido ese técnico al crear la solicitud)
ALTER TABLE solicitudes
  ADD COLUMN IF NOT EXISTS tecnico_preferido_id UUID REFERENCES tecnicos(id) ON DELETE SET NULL;

-- 4. Verificación
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name IN ('tecnicos', 'solicitudes')
  AND column_name IN ('disponibilidad', 'tecnico_preferido_id')
ORDER BY table_name, column_name;
-- Debe mostrar:
--   solicitudes | tecnico_preferido_id | uuid
--   tecnicos    | disponibilidad       | text → default 'disponible'
