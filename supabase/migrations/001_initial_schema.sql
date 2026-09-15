-- ============================================================================
-- Migración Inicial de Base de Datos — Pulso
-- Ticket 1: Esquema de BD (categories, habits, tasks, habit_completions)
-- ============================================================================

-- Habilitar extensión pgcrypto para gen_random_uuid() si no estuviese disponible
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. TABLA: categories
-- Categorías/materias/proyectos asignables a tareas y hábitos.
-- Incluye archived_at para soft-delete.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#6366f1',
    archived_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 2. TABLA: habits
-- Hábitos diarios asignados a un usuario y opcionalmente a una categoría.
-- Utiliza soft-delete (archived_at) para no romper el historial de rachas.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.habits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    archived_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 3. TABLA: tasks
-- Tareas puntuales con fecha límite (due_date) y fecha de cumplimiento.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 4. TABLA: habit_completions
-- Registros diarios de cumplimiento de hábitos.
-- Usa completed_date tipo DATE (YYYY-MM-DD) para evitar desfase de zona horaria.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.habit_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
    completed_date DATE NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT habit_completions_habit_date_unique UNIQUE (habit_id, completed_date)
);

-- ----------------------------------------------------------------------------
-- ÍNDICES DE RENDIMIENTO
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_archived_at ON public.categories(archived_at);

CREATE INDEX IF NOT EXISTS idx_habits_user_id ON public.habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_category_id ON public.habits(category_id);
CREATE INDEX IF NOT EXISTS idx_habits_archived_at ON public.habits(archived_at);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_category_id ON public.tasks(category_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_is_completed ON public.tasks(is_completed);

CREATE INDEX IF NOT EXISTS idx_habit_completions_user_id ON public.habit_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_completions_habit_date ON public.habit_completions(habit_id, completed_date);
g