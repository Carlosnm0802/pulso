// ============================================================================
// Servicio CRUD de Categorías — Pulso
// ============================================================================

import { supabase } from '../config.js';

/**
 * Obtiene todas las categorías activas (no archivadas) del usuario autenticado.
 * @returns {Promise<Array>} Lista de categorías.
 */
export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .is('archived_at', null)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error al obtener categorías:', error.message);
    throw error;
  }

  return data;
}

/**
 * Crea una nueva categoría para el usuario actual.
 * @param {Object} categoryData - Objeto con { name, color }
 * @returns {Promise<Object>} Categoría creada.
 */
export async function createCategory({ name, color = '#6366f1' }) {
  if (!name || name.trim() === '') {
    throw new Error('El nombre de la categoría es obligatorio');
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Debes estar autenticado para crear una categoría');
  }

  const { data, error } = await supabase
    .from('categories')
    .insert([{
      user_id: user.id,
      name: name.trim(),
      color: color || '#6366f1'
    }])
    .select()
    .single();

  if (error) {
    console.error('Error al crear categoría:', error.message);
    throw error;
  }

  return data;
}

/**
 * Actualiza el nombre o color de una categoría existente.
 * @param {string} id - ID de la categoría
 * @param {Object} updates - Objeto con los campos a actualizar { name, color }
 * @returns {Promise<Object>} Categoría actualizada.
 */
export async function updateCategory(id, updates) {
  if (!id) throw new Error('ID de categoría no proporcionado');

  const payload = {};
  if (updates.name !== undefined) payload.name = updates.name.trim();
  if (updates.color !== undefined) payload.color = updates.color;

  const { data, error } = await supabase
    .from('categories')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error al actualizar categoría:', error.message);
    throw error;
  }

  return data;
}

/**
 * Archiva una categoría (Soft-delete asignando archived_at).
 * @param {string} id - ID de la categoría
 * @returns {Promise<Object>} Categoría archivada.
 */
export async function archiveCategory(id) {
  if (!id) throw new Error('ID de categoría no proporcionado');

  const { data, error } = await supabase
    .from('categories')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error al archivar categoría:', error.message);
    throw error;
  }

  return data;
}
