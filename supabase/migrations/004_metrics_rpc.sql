-- ============================================================================
-- Migración RPC de Métricas — Pulso
-- Ticket 7: Funciones RPC para Porcentaje Diario y Semanal de Cumplimiento
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. FUNCIÓN: get_daily_completion_rate
-- Calcula el % combinado de cumplimiento (Tareas + Hábitos) para una fecha dada
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_daily_completion_rate(
    p_ref_date DATE DEFAULT CURRENT_DATE
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_total_habits INT := 0;
    v_completed_habits INT := 0;
    v_total_tasks INT := 0;
    v_completed_tasks INT := 0;
    v_total_items INT := 0;
    v_completed_items INT := 0;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN 0.0;
    END IF;

    -- 1. Total hábitos activos del usuario
    SELECT count(*)
    INTO v_total_habits
    FROM public.habits
    WHERE user_id = v_user_id
      AND archived_at IS NULL;

    -- 2. Hábitos completados en la fecha de referencia
    SELECT count(*)
    INTO v_completed_habits
    FROM public.habit_completions hc
    JOIN public.habits h ON hc.habit_id = h.id
    WHERE h.user_id = v_user_id
      AND h.archived_at IS NULL
      AND hc.completed_date = p_ref_date
      AND hc.completed = true;

    -- 3. Total tareas pertenecientes a la fecha (due_date = p_ref_date O sin fecha fija pendientes)
    SELECT count(*)
    INTO v_total_tasks
    FROM public.tasks
    WHERE user_id = v_user_id
      AND (due_date = p_ref_date OR (due_date IS NULL AND is_completed = false));

    -- 4. Tareas completadas pertenecientes a la fecha
    SELECT count(*)
    INTO v_completed_tasks
    FROM public.tasks
    WHERE user_id = v_user_id
      AND (due_date = p_ref_date OR (due_date IS NULL AND is_completed = true))
      AND is_completed = true;

    -- 5. Calcular porcentaje combinado
    v_total_items := v_total_habits + v_total_tasks;
    v_completed_items := v_completed_habits + v_completed_tasks;

    IF v_total_items = 0 THEN
        RETURN 0.0;
    END IF;

    RETURN round((v_completed_items::NUMERIC / v_total_items::NUMERIC) * 100.0, 2);
END;
$$;


-- ----------------------------------------------------------------------------
-- 2. FUNCIÓN: get_weekly_completion_rate
-- Calcula el % combinado para la semana calendario (Lunes a Domingo) de la fecha dada
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_weekly_completion_rate(
    p_ref_date DATE DEFAULT CURRENT_DATE
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_week_start DATE;
    v_week_end DATE;
    v_active_habits_count INT := 0;
    v_total_habit_expectations INT := 0;
    v_completed_habits_count INT := 0;
    v_total_tasks_count INT := 0;
    v_completed_tasks_count INT := 0;
    v_total_denom INT := 0;
    v_total_num INT := 0;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN 0.0;
    END IF;

    -- Determinar Lunes y Domingo de la semana calendario dada
    v_week_start := date_trunc('week', p_ref_date)::DATE;
    v_week_end := (v_week_start + INTERVAL '6 days')::DATE;

    -- 1. Hábitos activos del usuario
    SELECT count(*)
    INTO v_active_habits_count
    FROM public.habits
    WHERE user_id = v_user_id
      AND archived_at IS NULL;

    -- Expectativa semanal de hábitos: Hábitos * 7 días
    v_total_habit_expectations := v_active_habits_count * 7;

    -- 2. Hábitos completados en el rango Lunes-Domingo
    SELECT count(*)
    INTO v_completed_habits_count
    FROM public.habit_completions hc
    JOIN public.habits h ON hc.habit_id = h.id
    WHERE h.user_id = v_user_id
      AND h.archived_at IS NULL
      AND hc.completed_date >= v_week_start
      AND hc.completed_date <= v_week_end
      AND hc.completed = true;

    -- 3. Tareas con due_date en el rango Lunes-Domingo
    SELECT count(*)
    INTO v_total_tasks_count
    FROM public.tasks
    WHERE user_id = v_user_id
      AND due_date >= v_week_start
      AND due_date <= v_week_end;

    -- 4. Tareas completadas en el rango Lunes-Domingo
    SELECT count(*)
    INTO v_completed_tasks_count
    FROM public.tasks
    WHERE user_id = v_user_id
      AND due_date >= v_week_start
      AND due_date <= v_week_end
      AND is_completed = true;

    -- 5. Calcular porcentaje semanal combinado
    v_total_denom := v_total_habit_expectations + v_total_tasks_count;
    v_total_num := v_completed_habits_count + v_completed_tasks_count;

    IF v_total_denom = 0 THEN
        RETURN 0.0;
    END IF;

    RETURN round((v_total_num::NUMERIC / v_total_denom::NUMERIC) * 100.0, 2);
END;
$$;


-- ----------------------------------------------------------------------------
-- 3. FUNCIÓN: get_user_dashboard_metrics
-- Devuelve los 3 KPIs del Dashboard en una sola llamada SQL
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_dashboard_metrics(
    p_ref_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    daily_rate NUMERIC,
    weekly_rate NUMERIC,
    active_habits_count INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        public.get_daily_completion_rate(p_ref_date) AS daily_rate,
        public.get_weekly_completion_rate(p_ref_date) AS weekly_rate,
        (
            SELECT count(*)::INT 
            FROM public.habits 
            WHERE user_id = auth.uid() 
              AND archived_at IS NULL
        ) AS active_habits_count;
END;
$$;
