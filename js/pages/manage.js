// ============================================================================
// Controlador de la Vista de Gestión / Administración — Pulso
// ============================================================================

import { getHabits, updateHabit, archiveHabit } from '../services/habits.js';
import { getTasks, updateTask, deleteTask } from '../services/tasks.js';
import { getCategories, createCategory, updateCategory, archiveCategory } from '../services/categories.js';

/**
 * Renderiza la sección de Gestión (Hábitos, Tareas y Categorías) en el contenedor provisto.
 * @param {HTMLElement} containerElement - Elemento del DOM donde se dibujará la vista de gestión.
 * @param {Function} onDataChangedCallback - Callback para refrescar el resto del Dashboard cuando haya cambios.
 */
export async function renderManagementView(containerElement, onDataChangedCallback) {
  if (!containerElement) return;

  containerElement.innerHTML = `
    <div style="text-align:center; padding:2rem; color:var(--text-muted);">
      Cargando panel de administración...
    </div>
  `;

  try {
    const [habits, tasks, categories] = await Promise.all([
      getHabits(),
      getTasks(),
      getCategories()
    ]);

    containerElement.innerHTML = `
      <div class="dashboard-sections">
        
        <!-- COLUMNA 1: GESTIÓN DE HÁBITOS -->
        <div class="card">
          <h3 style="font-size:1.1rem; margin-bottom:1rem; color:var(--accent-warning);">🔥 Administración de Hábitos</h3>
          <ul id="manage-habits-list" style="list-style:none; padding:0;">
            ${habits.length === 0 ? '<li style="color:var(--text-muted);">No hay hábitos activos.</li>' : ''}
            ${habits.map(h => `
              <li class="unified-item" style="padding:0.75rem;">
                <div>
                  <strong style="color:var(--text-primary);">${h.title}</strong>
                  ${h.categories ? `<span class="badge" style="background:${h.categories.color}">${h.categories.name}</span>` : ''}
                </div>
                <div>
                  <button class="btn btn-secondary" style="padding:0.25rem 0.5rem; font-size:0.75rem;" onclick="window.editHabitPrompt('${h.id}', '${h.title}')">Editar</button>
                  <button class="btn btn-secondary" style="padding:0.25rem 0.5rem; font-size:0.75rem; background:#78350f; color:#fef3c7;" onclick="window.archiveHabitPrompt('${h.id}')">Archivar</button>
                </div>
              </li>
            `).join('')}
          </ul>
        </div>

        <!-- COLUMNA 2: GESTIÓN DE TAREAS Y CATEGORÍAS -->
        <div>
          <!-- TARJETA TAREAS -->
          <div class="card" style="margin-bottom:1.5rem;">
            <h3 style="font-size:1.1rem; margin-bottom:1rem; color:var(--accent-primary);">📝 Administración de Tareas</h3>
            <ul id="manage-tasks-list" style="list-style:none; padding:0;">
              ${tasks.length === 0 ? '<li style="color:var(--text-muted);">No hay tareas registradas.</li>' : ''}
              ${tasks.map(t => `
                <li class="unified-item" style="padding:0.75rem;">
                  <div>
                    <strong style="${t.is_completed ? 'text-decoration:line-through; color:var(--text-muted)' : 'color:var(--text-primary)'}">${t.title}</strong>
                    ${t.categories ? `<span class="badge" style="background:${t.categories.color}">${t.categories.name}</span>` : ''}
                  </div>
                  <div>
                    <button class="btn btn-secondary" style="padding:0.25rem 0.5rem; font-size:0.75rem;" onclick="window.editTaskPrompt('${t.id}', '${t.title}')">Editar</button>
                    <button class="btn btn-secondary" style="padding:0.25rem 0.5rem; font-size:0.75rem; background:#7f1d1d; color:#fecaca;" onclick="window.deleteTaskPrompt('${t.id}')">Eliminar</button>
                  </div>
                </li>
              `).join('')}
            </ul>
          </div>

          <!-- TARJETA CATEGORÍAS -->
          <div class="card">
            <h3 style="font-size:1.1rem; margin-bottom:1rem; color:var(--accent-success);">🏷️ Categorías (${categories.length})</h3>
            
            <form id="form-create-category" style="display:flex; gap:0.5rem; margin-bottom:1rem;">
              <input type="text" id="manage-cat-name" class="form-control" placeholder="Nueva categoría" required style="flex:1;" />
              <input type="color" id="manage-cat-color" value="#6366f1" style="width:45px; height:40px; cursor:pointer; padding:0;" />
              <button type="submit" class="btn btn-primary" style="padding:0.5rem 0.75rem;">+ Crear</button>
            </form>

            <ul id="manage-categories-list" style="list-style:none; padding:0;">
              ${categories.length === 0 ? '<li style="color:var(--text-muted);">No hay categorías creadas.</li>' : ''}
              ${categories.map(c => `
                <li class="unified-item" style="padding:0.5rem 0.75rem;">
                  <span class="badge" style="background:${c.color}">${c.name}</span>
                  <div>
                    <button class="btn btn-secondary" style="padding:0.2rem 0.4rem; font-size:0.75rem;" onclick="window.editCategoryPrompt('${c.id}', '${c.name}', '${c.color}')">Editar</button>
                    <button class="btn btn-secondary" style="padding:0.2rem 0.4rem; font-size:0.75rem; background:#7f1d1d; color:#fecaca;" onclick="window.archiveCategoryPrompt('${c.id}')">Archivar</button>
                  </div>
                </li>
              `).join('')}
            </ul>
          </div>
        </div>

      </div>
    `;

    // Adjuntar Handlers Globales de Gestión
    window.editHabitPrompt = async (id, currentTitle) => {
      const newTitle = prompt('Nuevo título para el hábito:', currentTitle);
      if (newTitle && newTitle.trim() !== '') {
        try {
          await updateHabit(id, { title: newTitle.trim() });
          await renderManagementView(containerElement, onDataChangedCallback);
          if (onDataChangedCallback) onDataChangedCallback();
        } catch (err) { alert(err.message); }
      }
    };

    window.archiveHabitPrompt = async (id) => {
      if (confirm('¿Archivar este hábito? Permanecerá guardado para tu historial de racha.')) {
        try {
          await archiveHabit(id);
          await renderManagementView(containerElement, onDataChangedCallback);
          if (onDataChangedCallback) onDataChangedCallback();
        } catch (err) { alert(err.message); }
      }
    };

    window.editTaskPrompt = async (id, currentTitle) => {
      const newTitle = prompt('Nuevo título para la tarea:', currentTitle);
      if (newTitle && newTitle.trim() !== '') {
        try {
          await updateTask(id, { title: newTitle.trim() });
          await renderManagementView(containerElement, onDataChangedCallback);
          if (onDataChangedCallback) onDataChangedCallback();
        } catch (err) { alert(err.message); }
      }
    };

    window.deleteTaskPrompt = async (id) => {
      if (confirm('¿Eliminar esta tarea permanentemente?')) {
        try {
          await deleteTask(id);
          await renderManagementView(containerElement, onDataChangedCallback);
          if (onDataChangedCallback) onDataChangedCallback();
        } catch (err) { alert(err.message); }
      }
    };

    window.editCategoryPrompt = async (id, currentName, currentColor) => {
      const newName = prompt('Nuevo nombre de categoría:', currentName);
      if (newName && newName.trim() !== '') {
        try {
          await updateCategory(id, { name: newName.trim(), color: currentColor });
          await renderManagementView(containerElement, onDataChangedCallback);
          if (onDataChangedCallback) onDataChangedCallback();
        } catch (err) { alert(err.message); }
      }
    };

    window.archiveCategoryPrompt = async (id) => {
      if (confirm('¿Archivar esta categoría?')) {
        try {
          await archiveCategory(id);
          await renderManagementView(containerElement, onDataChangedCallback);
          if (onDataChangedCallback) onDataChangedCallback();
        } catch (err) { alert(err.message); }
      }
    };

    // Formulario de creación rápida de categorías
    const catForm = document.getElementById('form-create-category');
    catForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('manage-cat-name').value;
      const color = document.getElementById('manage-cat-color').value;

      try {
        await createCategory({ name, color });
        await renderManagementView(containerElement, onDataChangedCallback);
        if (onDataChangedCallback) onDataChangedCallback();
      } catch (err) { alert('Error al crear categoría: ' + err.message); }
    });

  } catch (err) {
    containerElement.innerHTML = `<div style="color:var(--accent-danger); padding:2rem;">Error al cargar la vista de gestión: ${err.message}</div>`;
  }
}
