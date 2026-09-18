// ============================================================================
// Servicio de Cumplimiento de Hábitos (habit_completions) — Pulso
// ============================================================================

import { supabase } from '../config.js';
import { getTodayLocalDateString } from '../utils/date.js';

/**
 * Obtiene los registros de hábitos completados para una fecha específica (YYYY-MM-DD).
 * @param {string} [dateString] - Fecha en formato 'YYYY-MM-DD'. Por defecto la fecha local de hoy.
 * @returns {Promise<Array>} Lista de registros completados.
 */
export async function getHabitCompletionsForDate(dateString = getTodayLocalDateString()) {
  const { data, error } = await supabase
    .from('habit_completions')
    .select('habit_id, completed_date, completed')
    .eq('completed_date', dateString)
    .eq('completed', true);

  if (error) {
    console.error('Error al obtener completados de hábitos:', error.message);
    throw error;
  }

  return data;
}

/**
 * Registra o elimina la marca de completado de un hábito para una fecha específica (YYYY-MM-DD).
 * @param {string} habitId - ID del hábito.
 * @param {boolean} isCompleted - Estado deseado (true = completado, false = no completado).
 * @param {string} [dateString] - Fecha en formato 'YYYY-MM-DD'. Por defecto la fecha local de hoy.
 * @returns {Promise<boolean>} Estado final guardado.
 */
export async function toggleHabitCompletion(habitId, isCompleted, dateString = getTodayLocalDateString()) {
  if (!habitId) throw new Error('ID de hábito no proporcionado');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Debes estar autenticado para registrar cumplimiento de hábitos');
  }

  if (isCompleted) {
    // Insertar o actualizar registro de completado
    const { error } = await supabase
      .from('habit_completions')
      .upsert({
        user_id: user.id,
        habit_id: habitId,
        completed_date: dateString,
        completed: true
      }, {
        onConflict: 'habit_id,completed_date'
      });

    if (error) {
      console.error('Error al marcar hábito como completado:', error.message);
      throw error;
    }
  } else {
    // Eliminar el registro de completado para esa fecha
    const { error } = await supabase
      .from('habit_completions')
      .delete()
      .eq('habit_id', habitId)
      .eq('completed_date', dateString);

    if (error) {
      console.error('Error al desmarcar hábito completado:', error.message);
      throw error;
    }
  }

  return isCompleted;
}
