// ============================================================================
// Servicio CRUD de Hábitos — Pulso
// ============================================================================

import { supabase } from '../config.js';

/**
 * Obtiene todos los hábitos activos (no archivados) del usuario autenticado.
 * @returns {Promise<Array>} Lista de hábitos.
 */
export async function getHabits() {
  const { data, error } = await supabase
    .from('habits')
    .select(`
      *,
      categories (
        id,
        name,
        color
      )
    `)
    .is('archived_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error al obtener hábitos:', error.message);
    throw error;
  }

  return data;
}

/**
 * Crea un nuevo hábito diario.
 * @param {Object} habitData - { title, description, category_id }
 * @returns {Promise<Object>} Hábito creado.
 */
export async function createHabit({ title, description = '', category_id = null }) {
  if (!title || title.trim() === '') {
    throw new Error('El título del hábito es obligatorio');
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Debes estar autenticado para crear un hábito');
  }

  const { data, error } = await supabase
    .from('habits')
    .insert([{
      user_id: user.id,
      title: title.trim(),
      description: description ? description.trim() : null,
      category_id: category_id || null
    }])
    .select(`
      *,
      categories (
        id,
        name,
        color
      )
    `)
    .single();

  if (error) {
    console.error('Error al crear hábito:', error.message);
    throw error;
  }

  return data;
}

/**
 * Actualiza los datos de un hábito existente.
 * @param {string} id - ID del hábito.
 * @param {Object} updates - Campos a actualizar { title, description, category_id }
 * @returns {Promise<Object>} Hábito actualizado.
 */
export async function updateHabit(id, updates) {
  if (!id) throw new Error('ID de hábito no proporcionado');

  const payload = {};
  if (updates.title !== undefined) payload.title = updates.title.trim();
  if (updates.description !== undefined) payload.description = updates.description ? updates.description.trim() : null;
  if (updates.category_id !== undefined) payload.category_id = updates.category_id || null;

  const { data, error } = await supabase
    .from('habits')
    .update(payload)
    .eq('id', id)
    .select(`
      *,
      categories (
        id,
        name,
        color
      )
    `)
    .single();

  if (error) {
    console.error('Error al actualizar hábito:', error.message);
    throw error;
  }

  return data;
}

/**
 * Archiva un hábito (Soft-delete asignando archived_at).
 * Conserva el historial de cumplimiento y rachas.
 * @param {string} id - ID del hábito.
 * @returns {Promise<Object>} Hábito archivado.
 */
export async function archiveHabit(id) {
  if (!id) throw new Error('ID de hábito no proporcionado');

  const { data, error } = await supabase
    .from('habits')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id)
    .select(`
      *,
      categories (
        id,
        name,
        color
      )
    `)
    .single();

  if (error) {
    console.error('Error al archivar hábito:', error.message);
    throw error;
  }

  return data;
}
