// ============================================================================
// Controlador de la Vista Historial / Calendario — Pulso
// ============================================================================

import { getHabitCompletionsForDate } from '../services/completions.js';
import { getTasks } from '../services/tasks.js';
import { getHabits } from '../services/habits.js';

/**
 * Obtiene los registros históricos y el resumen de cumplimiento para una fecha pasada dada (YYYY-MM-DD).
 * @param {string} dateString - Fecha en formato 'YYYY-MM-DD'.
 * @returns {Promise<Object>} Objeto con { dateString, items: [...], stats: { total, completed, percentage } }
 */
export async function getHistoryDataForDate(dateString) {
  if (!dateString) throw new Error('Fecha no proporcionada para consultar historial');

  // Ejecutar consultas en paralelo
  const [allTasks, activeHabits, completionsData] = await Promise.all([
    getTasks(),
    getHabits(),
    getHabitCompletionsForDate(dateString)
  ]);

  const completedHabitIds = new Set(completionsData.map(c => c.habit_id));

  // 1. Hábitos para la fecha histórica
  const habitItems = activeHabits.map(h => ({
    itemType: 'habit',
    id: h.id,
    title: h.title,
    category: h.categories,
    isCompleted: completedHabitIds.has(h.id)
  }));

  // 2. Tareas asignadas o completadas en la fecha histórica
  const taskItems = allTasks.filter(t => t.due_date === dateString).map(t => ({
    itemType: 'task',
    id: t.id,
    title: t.title,
    category: t.categories,
    isCompleted: t.is_completed
  }));

  const items = [...habitItems, ...taskItems];
  const total = items.length;
  const completed = items.filter(i => i.isCompleted).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    dateString,
    items,
    stats: {
      total,
      completed,
      percentage
    }
  };
}
