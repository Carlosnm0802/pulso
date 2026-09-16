-- ============================================================================
-- Script de Verificación de Aislamiento RLS (2 Cuentas) — Pulso
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PASO 1: Simular sesión del USUARIO A (Usuario Real)
-- ----------------------------------------------------------------------------
-- Configuramos la sesión a nivel de conexión (false = no sólo para la transacción)
SELECT set_config('request.jwt.claim.sub', (SELECT id::text FROM auth.users ORDER BY created_at ASC LIMIT 1), false);
SELECT set_config('role', 'authenticated', false);

-- El Usuario A DEBE ver sus propios registros
SELECT 'CATEGORÍAS USUARIO A' AS prueba, id, name FROM public.categories;
SELECT 'TAREAS USUARIO A' AS prueba, id, title FROM public.tasks;


-- ----------------------------------------------------------------------------
-- PASO 2: Simular sesión del USUARIO B (Usuario Ficticio o Segunda Cuenta)
-- ----------------------------------------------------------------------------
-- Cambiamos la sesión al Usuario B
SELECT set_config('request.jwt.claim.sub', '99999999-9999-9999-9999-999999999999', false);
SELECT set_config('role', 'authenticated', false);

-- El Usuario B DEBE ver 0 filas (aislamiento de seguridad estricto)
SELECT 'Categorías visibles para Usuario B (Esperado: 0)' AS resultado, count(*) FROM public.categories
UNION ALL
SELECT 'Hábitos visibles para Usuario B (Esperado: 0)', count(*) FROM public.habits
UNION ALL
SELECT 'Tareas visibles para Usuario B (Esperado: 0)', count(*) FROM public.tasks
UNION ALL
SELECT 'Completados visibles para Usuario B (Esperado: 0)', count(*) FROM public.habit_completions;


-- ----------------------------------------------------------------------------
-- PASO 3: Restablecer rol a postgres (Administrador)
-- ----------------------------------------------------------------------------
RESET ROLE;
