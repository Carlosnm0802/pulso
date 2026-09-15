-- ============================================================================
-- Datos Iniciales de Prueba — Pulso (seed.sql)
-- Nota: Requiere que al menos exista un usuario en la tabla auth.users.
-- ============================================================================

DO $$
DECLARE
    v_user_id UUID;
    v_cat_dev UUID;
    v_cat_salud UUID;
    v_habit_js UUID;
    v_habit_ejercicio UUID;
BEGIN
    -- 1. Obtener el ID del primer usuario existente en Supabase Auth
    SELECT id INTO v_user_id FROM auth.users LIMIT 1;

    -- Si no existe ningún usuario en auth.users, se muestra un mensaje informativo
    IF v_user_id IS NULL THEN
        RAISE NOTICE '⚠️ No se encontró ningún usuario en auth.users. Registra primero un usuario desde Supabase Auth (Authentication -> Users -> Add User).';
        RETURN;
    END IF;

    RAISE NOTICE 'Insertando datos de prueba para el usuario: %', v_user_id;

    -- 2. Insertar Categorías de prueba
    INSERT INTO public.categories (user_id, name, color)
    VALUES (v_user_id, 'Desarrollo Web', '#6366f1')
    RETURNING id INTO v_cat_dev;

    INSERT INTO public.categories (user_id, name, color)
    VALUES (v_user_id, 'Salud y Bienestar', '#10b981')
    RETURNING id INTO v_cat_salud;

    -- 3. Insertar Hábitos de prueba
    INSERT INTO public.habits (user_id, category_id, title, description)
    VALUES (v_user_id, v_cat_dev, 'Estudiar JavaScript 1h', 'Repasar ES Modules y arquitectura de Pulso')
    RETURNING id INTO v_habit_js;

    INSERT INTO public.habits (user_id, category_id, title, description)
    VALUES (v_user_id, v_cat_salud, 'Hacer ejercicio', '30 minutos de ejercicio diario')
    RETURNING id INTO v_habit_ejercicio;

    -- 4. Insertar Tareas de prueba
    INSERT INTO public.tasks (user_id, category_id, title, description, due_date, is_completed, completed_at)
    VALUES 
        (v_user_id, v_cat_dev, 'Configurar RLS en Supabase', 'Ticket 2 del checklist de Pulso', CURRENT_DATE, false, NULL),
        (v_user_id, v_cat_dev, 'Crear migración inicial SQL', 'Ticket 1 de Pulso', CURRENT_DATE - INTERVAL '1 day', true, now() - INTERVAL '1 day');

    -- 5. Insertar Registros de Hábitos (Ayer y Hoy)
    INSERT INTO public.habit_completions (user_id, habit_id, completed_date, completed)
    VALUES 
        (v_user_id, v_habit_js, CURRENT_DATE - INTERVAL '1 day', true),
        (v_user_id, v_habit_js, CURRENT_DATE, true),
        (v_user_id, v_habit_ejercicio, CURRENT_DATE - INTERVAL '1 day', true);

    RAISE NOTICE '✅ Datos de prueba insertados exitosamente.';
END $$;

-- ----------------------------------------------------------------------------
-- CONSULTAS DE VERIFICACIÓN
-- ----------------------------------------------------------------------------
SELECT 'categories' AS tabla, count(*) FROM public.categories
UNION ALL
SELECT 'habits', count(*) FROM public.habits
UNION ALL
SELECT 'tasks', count(*) FROM public.tasks
UNION ALL
SELECT 'habit_completions', count(*) FROM public.habit_completions;
