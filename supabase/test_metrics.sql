-- ============================================================================
-- Script de Verificación de RPC de Métricas (% Diario y Semanal) — Pulso
-- Ejecutar en Supabase SQL Editor para verificar el Ticket 7.
-- ============================================================================

-- Configurar sesión del primer usuario autenticado
SELECT set_config('request.jwt.claim.sub', (SELECT id::text FROM auth.users ORDER BY created_at ASC LIMIT 1), false);
SELECT set_config('role', 'authenticated', false);

-- ----------------------------------------------------------------------------
-- CONSULTAS DE VERIFICACIÓN DE MÉTRICAS
-- ----------------------------------------------------------------------------

-- 1. Porcentaje Diario de Hoy (% Tareas + Hábitos)
SELECT 
    'Porcentaje Diario de Hoy (% Hoy)' AS indicador,
    public.get_daily_completion_rate(CURRENT_DATE) AS valor_porcentaje;

-- 2. Porcentaje Semanal (% Lunes a Domingo)
SELECT 
    'Porcentaje Semanal (% Lunes a Domingo)' AS indicador,
    public.get_weekly_completion_rate(CURRENT_DATE) AS valor_porcentaje;

-- 3. Todos los KPIs juntos (Dashboard)
SELECT 
    daily_rate AS porcentaje_diario,
    weekly_rate AS porcentaje_semanal,
    active_habits_count AS habitos_activos
FROM public.get_user_dashboard_metrics(CURRENT_DATE);

-- Restablecer rol
RESET ROLE;
