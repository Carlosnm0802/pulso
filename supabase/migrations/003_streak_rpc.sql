-- ============================================================================
-- Migración RPC de Rachas — Pulso
-- Ticket 6: Función RPC para calcular la racha (streak) de hábitos
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. FUNCIÓN: get_habit_streak
-- Calcula la racha consecutiva de un hábito a partir de una fecha de referencia
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_habit_streak(
    p_habit_id UUID,
    p_ref_date DATE DEFAULT CURRENT_DATE
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_streak INT := 0;
    v_check_date DATE;
    v_has_completion BOOLEAN;
BEGIN
    -- Determinar la fecha de inicio del conteo:
    -- 1. Si se completó HOY (p_ref_date), empezamos el conteo desde HOY.
    -- 2. Si NO se completó HOY pero SÍ AYER (p_ref_date - 1), la racha sigue viva y empezamos desde AYER.
    -- 3. Si no se completó ni hoy ni ayer, la racha está rota y devolvemos 0.

    SELECT EXISTS (
        SELECT 1 
        FROM public.habit_completions 
        WHERE habit_id = p_habit_id 
          AND completed_date = p_ref_date 
          AND completed = true
    ) INTO v_has_completion;

    IF v_has_completion THEN
        v_check_date := p_ref_date;
    ELSE
        -- Comprobar si se completó AYER
        SELECT EXISTS (
            SELECT 1 
            FROM public.habit_completions 
            WHERE habit_id = p_habit_id 
              AND completed_date = (p_ref_date - INTERVAL '1 day')::DATE 
              AND completed = true
        ) INTO v_has_completion;

        IF v_has_completion THEN
            v_check_date := (p_ref_date - INTERVAL '1 day')::DATE;
        ELSE
            -- No se completó ni hoy ni ayer: Racha rota
            RETURN 0;
        END IF;
    END IF;

    -- Bucle para contar días consecutivos hacia atrás
    LOOP
        SELECT EXISTS (
            SELECT 1 
            FROM public.habit_completions 
            WHERE habit_id = p_habit_id 
              AND completed_date = v_check_date 
              AND completed = true
        ) INTO v_has_completion;

        IF v_has_completion THEN
            v_streak := v_streak + 1;
            v_check_date := (v_check_date - INTERVAL '1 day')::DATE;
        ELSE
            EXIT; -- Fin de la secuencia consecutiva
        END IF;
    END LOOP;

    RETURN v_streak;
END;
$$;

-- ----------------------------------------------------------------------------
-- 2. FUNCIÓN: get_user_habits_streaks
-- Retorna todos los hábitos activos del usuario autenticado con su racha calculada
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_habits_streaks(
    p_ref_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    habit_id UUID,
    title TEXT,
    category_id UUID,
    category_name TEXT,
    category_color TEXT,
    streak INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        h.id AS habit_id,
        h.title,
        h.category_id,
        c.name AS category_name,
        c.color AS category_color,
        public.get_habit_streak(h.id, p_ref_date) AS streak
    FROM public.habits h
    LEFT JOIN public.categories c ON h.category_id = c.id
    WHERE h.user_id = auth.uid()
      AND h.archived_at IS NULL
    ORDER BY h.created_at DESC;
END;
$$;
