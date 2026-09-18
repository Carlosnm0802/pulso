// ============================================================================
// Controlador de la Vista Unificada "Hoy" — Pulso
// ============================================================================

import { getTasks } from '../services/tasks.js';
import { getHabits } from '../services/habits.js';
import { getHabitCompletionsForDate, toggleHabitCompletion } from '../services/completions.js';
import { getTodayLocalDateString } from '../utils/date.js';

/**
 * Obtiene la lista unificada de Tareas y Hábitos para el día actual.
 * @param {string} [targetDateString] - Fecha en formato 'YYYY-MM-DD'. Por defecto la fecha local de hoy.
 * @returns {Promise<Object>} Objeto con { dateString, items: [...], stats: { total, completed, percentage } }
 */
export async function getTodayUnifiedData(targetDateString = getTodayLocalDateString()) {
  // Ejecutar consultas en paralelo para máxima eficiencia
  const [allTasks, activeHabits, completionsData] = await Promise.all([
    getTasks(),
    getHabits(),
    getHabitCompletionsForDate(targetDateString)
  ]);

  // Conjunto (Set) de IDs de hábitos completados en la fecha objetivo
  const completedHabitIds = new Set(completionsData.map(c => c.habit_id));

  // 1. Filtrar Tareas pertenecientes a la vista "Hoy":
  // Tareas cuya due_date sea hoy, O tareas sin due_date que aún estén pendientes
  const todayTasks = allTasks.filter(task => {
    if (!task.due_date) return true; // Tareas sin fecha fija se muestran en Hoy
    return task.due_date === targetDateString;
  }).map(task => ({
    itemType: 'task',
    id: task.id,
    title: task.title,
    description: task.description,
    category: task.categories,
    due_date: task.due_date,
    isCompleted: task.is_completed,
    completed_at: task.completed_at,
    raw: task
  }));

  // 2. Mapear Hábitos diarios activos:
  const todayHabits = activeHabits.map(habit => ({
    itemType: 'habit',
    id: habit.id,
    title: habit.title,
    description: habit.description,
    category: habit.categories,
    isCompleted: completedHabitIds.has(habit.id),
    raw: habit
  }));

  // 3. Unificar lista combinada (Hábitos primero, luego Tareas)
  const items = [...todayHabits, ...todayTasks];

  // 4. Calcular métricas básicas del frontend
  const total = items.length;
  const completed = items.filter(item => item.isCompleted).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    dateString: targetDateString,
    items,
    stats: {
      total,
      completed,
      percentage
    }
  };
}

/**
 * Alterna el estado de cumplimiento de un ítem de la vista "Hoy" (sea Tarea o Hábito).
 * @param {Object} item - Objeto del ítem { itemType: 'task'|'habit', id }
 * @param {boolean} newCompletedState - Nuevo estado deseado.
 * @param {string} [dateString] - Fecha local objetivo 'YYYY-MM-DD'.
 */
export async function toggleTodayItemCompletion(item, newCompletedState, dateString = getTodayLocalDateString()) {
  if (item.itemType === 'habit') {
    return await toggleHabitCompletion(item.id, newCompletedState, dateString);
  } else if (item.itemType === 'task') {
    const { updateTask } = await import('../services/tasks.js');
    return await updateTask(item.id, { is_completed: newCompletedState });
  } else {
    throw new Error('Tipo de ítem no reconocido');
  }
}
