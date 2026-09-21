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
    <div class="dashboard-sections">
      <div class="skeleton-kpi-card" style="min-height:280px; display:flex; flex-direction:column; gap:1rem; padding:1.5rem;">
        <div class="skeleton skeleton-kpi-label" style="width:40%;"></div>
        <div class="skeleton skeleton-line-lg"></div>
        <div class="skeleton skeleton-line-md"></div>
        <div class="skeleton skeleton-line-lg"></div>
        <div class="skeleton skeleton-line-md"></div>
        <div class="skeleton skeleton-line-sm" style="width:55%;"></div>
      </div>
      <div style="display:flex; flex-direction:column; gap:1.5rem;">
        <div class="skeleton-kpi-card" style="display:flex; flex-direction:column; gap:1rem; padding:1.5rem;">
          <div class="skeleton skeleton-kpi-label" style="width:40%;"></div>
          <div class="skeleton skeleton-line-lg"></div>
          <div class="skeleton skeleton-line-md"></div>
        </div>
        <div class="skeleton-kpi-card" style="display:flex; flex-direction:column; gap:1rem; padding:1.5rem;">
          <div class="skeleton skeleton-kpi-label" style="width:35%;"></div>
          <div class="skeleton skeleton-line-md"></div>
          <div class="skeleton skeleton-line-sm" style="width:60%;"></div>
        </div>
      </div>
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
          <div class="manage-section-header">
            <h3 style="font-size:1.1rem; color:var(--accent-warning);">🔥 Hábitos Activos</h3>
            <span style="font-size:0.8rem; color:var(--text-muted);">${habits.length} registro${habits.length !== 1 ? 's' : ''}</span>
          </div>
          <ul id="manage-habits-list" style="list-style:none; padding:0;">
            ${habits.length === 0 ? `
              <div class="empty-state">
                <div class="empty-state-icon">🔥</div>
                <div class="empty-state-title">Sin hábitos activos</div>
                <div class="empty-state-desc">Crea tu primer hábito diario usando el botón + Crear en la parte superior.</div>
              </div>
            ` : habits.map(h => `
              <li class="unified-item" style="flex-wrap:wrap;">
                <div style="flex:1; min-width:0;">
                  <div style="font-weight:600; color:var(--text-primary); margin-bottom:0.2rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${h.title}</div>
                  ${h.categories ? `<span class="type-tag category-pill">${h.categories.name}</span>` : ''}
                </div>
                <div class="item-actions">
                  <button class="btn btn-secondary" style="padding:0.3rem 0.65rem; font-size:0.78rem;" onclick="window.editHabitPrompt('${h.id}', '${h.title.replace(/'/g, "\\'")}')">✏️ Editar</button>
                  <button class="btn btn-danger" style="padding:0.3rem 0.65rem; font-size:0.78rem;" onclick="window.archiveHabitPrompt('${h.id}')">📦 Archivar</button>
                </div>
              </li>
            `).join('')}
          </ul>
        </div>

        <!-- COLUMNA 2: GESTIÓN DE TAREAS Y CATEGORÍAS -->
        <div>
          <!-- TARJETA TAREAS -->
          <div class="card" style="margin-bottom:1.5rem;">
            <div class="manage-section-header">
              <h3 style="font-size:1.1rem; color:var(--accent-primary);">📝 Tareas Registradas</h3>
              <span style="font-size:0.8rem; color:var(--text-muted);">${tasks.length} registro${tasks.length !== 1 ? 's' : ''}</span>
            </div>
            <ul id="manage-tasks-list" style="list-style:none; padding:0;">
              ${tasks.length === 0 ? `
                <div class="empty-state">
                  <div class="empty-state-icon">📝</div>
                  <div class="empty-state-title">Sin tareas registradas</div>
                  <div class="empty-state-desc">Agrega tareas puntuales usando el botón + Crear.</div>
                </div>
              ` : tasks.map(t => `
                <li class="unified-item ${t.is_completed ? 'completed' : ''}" style="flex-wrap:wrap;">
                  <div style="flex:1; min-width:0;">
                    <div class="item-title" style="font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${t.title}</div>
                    ${t.categories ? `<span class="type-tag category-pill">${t.categories.name}</span>` : ''}
                    ${t.due_date ? `<span style="font-size:0.75rem; color:var(--text-muted); margin-left:0.25rem;">📅 ${t.due_date}</span>` : ''}
                  </div>
                  <div class="item-actions">
                    <button class="btn btn-secondary" style="padding:0.3rem 0.65rem; font-size:0.78rem;" onclick="window.editTaskPrompt('${t.id}', '${t.title.replace(/'/g, "\\'")}')">✏️ Editar</button>
                    <button class="btn btn-danger" style="padding:0.3rem 0.65rem; font-size:0.78rem;" onclick="window.deleteTaskPrompt('${t.id}')">🗑️ Eliminar</button>
                  </div>
                </li>
              `).join('')}
            </ul>
          </div>

          <!-- TARJETA CATEGORÍAS -->
          <div class="card">
            <div class="manage-section-header">
              <h3 style="font-size:1.1rem; color:var(--accent-success);">🏷️ Categorías</h3>
              <span style="font-size:0.8rem; color:var(--text-muted);">${categories.length} registradas</span>
            </div>
            
            <form id="form-create-category" style="display:flex; gap:0.5rem; margin-bottom:1rem; flex-wrap:wrap;">
              <input type="text" id="manage-cat-name" class="form-control" placeholder="Nueva categoría..." required style="flex:1; min-width:120px;" />
              <input type="color" id="manage-cat-color" value="#6366f1" style="width:45px; height:44px; cursor:pointer; padding:0; border:1px solid var(--border-color); border-radius:var(--radius-md); background:transparent;" />
              <button type="submit" class="btn btn-primary" style="padding:0.5rem 0.875rem;">+ Crear</button>
            </form>

            <ul id="manage-categories-list" style="list-style:none; padding:0;">
              ${categories.length === 0 ? `
                <div class="empty-state">
                  <div class="empty-state-icon">🏷️</div>
                  <div class="empty-state-title">Sin categorías</div>
                  <div class="empty-state-desc">Crea categorías para organizar tus tareas y hábitos.</div>
                </div>
              ` : categories.map(c => `
                <li class="unified-item" style="padding:0.65rem 0.875rem; flex-wrap:wrap; gap:0.5rem;">
                  <div style="display:flex; align-items:center; gap:0.5rem; flex:1; min-width:0;">
                    <span style="width:12px; height:12px; border-radius:50%; background:${c.color}; flex-shrink:0; display:inline-block;"></span>
                    <span style="font-weight:600; color:var(--text-primary); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${c.name}</span>
                  </div>
                  <div class="item-actions">
                    <button class="btn btn-secondary" style="padding:0.25rem 0.55rem; font-size:0.75rem;" onclick="window.editCategoryPrompt('${c.id}', '${c.name.replace(/'/g, "\\'")}', '${c.color}')">✏️</button>
                    <button class="btn btn-danger" style="padding:0.25rem 0.55rem; font-size:0.75rem;" onclick="window.archiveCategoryPrompt('${c.id}')">🗑️</button>
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
