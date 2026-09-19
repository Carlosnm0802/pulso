-- ============================================================================
-- Script de Verificación de RPC de Racha (Streak) — Pulso
-- Ejecutar en Supabase SQL Editor para verificar el Ticket 6.
-- ============================================================================

DO $$
DECLARE
    v_user_id UUID;
    v_habit_active UUID;
    v_habit_yesterday UUID;
    v_habit_broken UUID;
    v_today DATE := CURRENT_DATE;
BEGIN
    SELECT id INTO v_user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;
    
    IF v_user_id IS NULL THEN
        RAISE NOTICE '⚠️ Se requiere al menos un usuario en auth.users para realizar la prueba.';
        RETURN;
    END IF;

    -- 1. Crear 3 hábitos de prueba
    INSERT INTO public.habits (user_id, title, description)
    VALUES (v_user_id, 'Hábito Activo (Hoy + Ayer)', 'Prueba racha 2')
    RETURNING id INTO v_habit_active;

    INSERT INTO public.habits (user_id, title, description)
    VALUES (v_user_id, 'Hábito Aún Vivo (Ayer)', 'Prueba racha 1')
    RETURNING id INTO v_habit_yesterday;

    INSERT INTO public.habits (user_id, title, description)
    VALUES (v_user_id, 'Hábito Rota (Hace 3 días)', 'Prueba racha 0')
    RETURNING id INTO v_habit_broken;

    -- 2. Insertar completados para Hábito 1 (Hoy + Ayer -> Racha esperada: 2)
    INSERT INTO public.habit_completions (user_id, habit_id, completed_date, completed)
    VALUES 
        (v_user_id, v_habit_active, v_today, true),
        (v_user_id, v_habit_active, (v_today - INTERVAL '1 day')::DATE, true);

    -- 3. Insertar completado para Hábito 2 (Ayer -> Racha esperada: 1)
    INSERT INTO public.habit_completions (user_id, habit_id, completed_date, completed)
    VALUES 
        (v_user_id, v_habit_yesterday, (v_today - INTERVAL '1 day')::DATE, true);

    -- 4. Insertar completado para Hábito 3 (Hace 3 días -> Racha esperada: 0)
    INSERT INTO public.habit_completions (user_id, habit_id, completed_date, completed)
    VALUES 
        (v_user_id, v_habit_broken, (v_today - INTERVAL '3 days')::DATE, true);

    RAISE NOTICE '✅ Datos de prueba de racha creados exitosamente.';
END $$;

-- ----------------------------------------------------------------------------
-- CONSULTAS DE VERIFICACIÓN
-- ----------------------------------------------------------------------------
SELECT 
    h.title,
    public.get_habit_streak(h.id, CURRENT_DATE) AS racha_calculada
FROM public.habits h
ORDER BY h.created_at DESC
LIMIT 3;
