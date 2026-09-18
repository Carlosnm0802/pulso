// ============================================================================
// Servicio CRUD de Tareas — Pulso
// ============================================================================

import { supabase } from '../config.js';

/**
 * Obtiene todas las tareas del usuario autenticado.
 * @returns {Promise<Array>} Lista de tareas.
 */
export async function getTasks() {
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      categories (
        id,
        name,
        color
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error al obtener tareas:', error.message);
    throw error;
  }

  return data;
}

/**
 * Crea una nueva tarea puntual.
 * @param {Object} taskData - { title, description, category_id, due_date }
 * @returns {Promise<Object>} Tarea creada.
 */
export async function createTask({ title, description = '', category_id = null, due_date = null }) {
  if (!title || title.trim() === '') {
    throw new Error('El título de la tarea es obligatorio');
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Debes estar autenticado para crear una tarea');
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert([{
      user_id: user.id,
      title: title.trim(),
      description: description ? description.trim() : null,
      category_id: category_id || null,
      due_date: due_date || null,
      is_completed: false
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
    console.error('Error al crear tarea:', error.message);
    throw error;
  }

  return data;
}

/**
 * Actualiza los datos o el estado de una tarea existente.
 * @param {string} id - ID de la tarea.
 * @param {Object} updates - Campos a actualizar { title, description, category_id, due_date, is_completed }
 * @returns {Promise<Object>} Tarea actualizada.
 */
export async function updateTask(id, updates) {
  if (!id) throw new Error('ID de tarea no proporcionado');

  const payload = {};
  if (updates.title !== undefined) payload.title = updates.title.trim();
  if (updates.description !== undefined) payload.description = updates.description ? updates.description.trim() : null;
  if (updates.category_id !== undefined) payload.category_id = updates.category_id || null;
  if (updates.due_date !== undefined) payload.due_date = updates.due_date || null;

  if (updates.is_completed !== undefined) {
    payload.is_completed = updates.is_completed;
    payload.completed_at = updates.is_completed ? new Date().toISOString() : null;
  }

  const { data, error } = await supabase
    .from('tasks')
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
    console.error('Error al actualizar tarea:', error.message);
    throw error;
  }

  return data;
}

/**
 * Elimina físicamente una tarea (Hard delete).
 * @param {string} id - ID de la tarea.
 * @returns {Promise<boolean>} Retorna true si se eliminó con éxito.
 */
export async function deleteTask(id) {
  if (!id) throw new Error('ID de tarea no proporcionado');

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error al eliminar tarea:', error.message);
    throw error;
  }

  return true;
}
