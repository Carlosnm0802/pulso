// ============================================================================
// Servicio de Métricas e Indicadores (RPC) — Pulso
// ============================================================================

import { supabase } from '../config.js';
import { getTodayLocalDateString } from '../utils/date.js';

/**
 * Obtiene los 3 KPIs consolidados del Dashboard (daily_rate, weekly_rate, active_habits_count).
 * @param {string} [dateString] - Fecha local de referencia YYYY-MM-DD.
 * @returns {Promise<Object>} Métricas consolidadas.
 */
export async function getDashboardMetrics(dateString = getTodayLocalDateString()) {
  const { data, error } = await supabase
    .rpc('get_user_dashboard_metrics', { p_ref_date: dateString });

  if (error) {
    console.error('Error al obtener métricas del dashboard:', error.message);
    throw error;
  }

  // Devolver el primer registro retornado por el RPC
  return data && data.length > 0 ? data[0] : { daily_rate: 0, weekly_rate: 0, active_habits_count: 0 };
}

/**
 * Obtiene la lista de hábitos activos con su racha calculada al instante.
 * @param {string} [dateString] - Fecha local de referencia YYYY-MM-DD.
 * @returns {Promise<Array>} Lista de hábitos con el campo `streak`.
 */
export async function getUserHabitsWithStreaks(dateString = getTodayLocalDateString()) {
  const { data, error } = await supabase
    .rpc('get_user_habits_streaks', { p_ref_date: dateString });

  if (error) {
    console.error('Error al obtener rachas de hábitos:', error.message);
    throw error;
  }

  return data || [];
}
