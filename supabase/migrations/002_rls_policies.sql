-- ============================================================================
-- Migración de Seguridad — Pulso
-- Ticket 2: Políticas RLS (Row Level Security) para aislamiento de usuarios
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TABLA: categories
-- ----------------------------------------------------------------------------
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own categories" ON public.categories;

CREATE POLICY "Users can manage their own categories"
ON public.categories
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 2. TABLA: habits
-- ----------------------------------------------------------------------------
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own habits" ON public.habits;

CREATE POLICY "Users can manage their own habits"
ON public.habits
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 3. TABLA: tasks
-- ----------------------------------------------------------------------------
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own tasks" ON public.tasks;

CREATE POLICY "Users can manage their own tasks"
ON public.tasks
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 4. TABLA: habit_completions
-- ----------------------------------------------------------------------------
ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own habit completions" ON public.habit_completions;

CREATE POLICY "Users can manage their own habit completions"
ON public.habit_completions
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
