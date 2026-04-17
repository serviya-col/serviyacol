-- ══════════════════════════════════════════════════════════════════
-- SERVIYA — LIMPIEZA TOTAL DE DATOS DE PRUEBA
-- Ejecutar en: Supabase → SQL Editor
-- Conserva: el usuario admin (salcristhi5411@gmail.com)
-- Borra: cobros, solicitudes, clientes, tecnicos, auth.users de prueba
-- ══════════════════════════════════════════════════════════════════

-- 1. Cobros primero (depende de solicitudes y tecnicos)
DELETE FROM cobros;

-- 2. Tabla de datos de pago bancario de tecnicos
DELETE FROM tecnico_pagos;

-- 3. Solicitudes
DELETE FROM solicitudes;

-- 4. Clientes (tabla del app, no auth)
DELETE FROM clientes;

-- 5. Tecnicos
DELETE FROM tecnicos;

-- 6. Usuarios de Supabase Auth — todos EXCEPTO el admin
DELETE FROM auth.users
WHERE email IS DISTINCT FROM 'salcristhi5411@gmail.com';

-- ── Verificación final (debe mostrar 0 en todo excepto auth admin) ──
SELECT 'cobros'      AS tabla, COUNT(*) AS quedan FROM cobros
UNION ALL
SELECT 'solicitudes' AS tabla, COUNT(*) AS quedan FROM solicitudes
UNION ALL
SELECT 'clientes'    AS tabla, COUNT(*) AS quedan FROM clientes
UNION ALL
SELECT 'tecnicos'    AS tabla, COUNT(*) AS quedan FROM tecnicos
UNION ALL
SELECT 'auth.users'  AS tabla, COUNT(*) AS quedan FROM auth.users;

-- ══════════════════════════════════════════════════════════════════
-- RESULTADO ESPERADO:
--   cobros      | 0
--   solicitudes | 0
--   clientes    | 0
--   tecnicos    | 0
--   auth.users  | 1  ← solo el admin
-- ══════════════════════════════════════════════════════════════════
