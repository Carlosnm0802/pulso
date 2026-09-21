// ============================================================================
// Componente de Modales de Creación — Pulso
// ============================================================================

import { getCategories } from '../services/categories.js';
import { createTask } from '../services/tasks.js';
import { createHabit } from '../services/habits.js';
import { getTodayLocalDateString } from '../utils/date.js';

let modalContainerElement = null;

/**
 * Abre el modal interactivo de creación de Tarea vs Hábito.
 * @param {string} [defaultType='task'] - Tipo inicial ('task' o 'habit').
 * @param {Function} onSuccessCallback - Callback que se ejecuta tras crear exitosamente.
 */
export async function openCreationModal(defaultType = 'task', onSuccessCallback) {
  let activeType = defaultType;
  let categories = [];

  try {
    categories = await getCategories();
  } catch (err) {
    console.warn('No se pudieron cargar las categorías para el modal:', err.message);
  }

  // Si no existe el contenedor de modal, lo creamos
  if (!modalContainerElement) {
    modalContainerElement = document.createElement('div');
    modalContainerElement.id = 'modal-container';
    document.body.appendChild(modalContainerElement);
  }

  // Renderizar contenido del modal
  modalContainerElement.innerHTML = `
    <div class="modal-backdrop" id="modal-backdrop">
      <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title-heading">
        <div class="modal-header">
          <h2 id="modal-title-heading" style="font-size: 1.25rem; font-weight: 700;">✨ Crear Nuevo Registro</h2>
          <button class="modal-close-btn" id="modal-close-btn" aria-label="Cerrar modal">&times;</button>
        </div>

        <!-- SWITCHER TAREA VS HÁBITO -->
        <div class="type-switcher">
          <div class="type-tab ${activeType === 'task' ? 'active' : ''}" id="tab-type-task">📝 Tarea Puntual</div>
          <div class="type-tab ${activeType === 'habit' ? 'active' : ''}" id="tab-type-habit">🔥 Hábito Diario</div>
        </div>

        <form id="modal-creation-form">
          <div class="form-group">
            <label class="form-label" for="modal-title">Título *</label>
            <input type="text" id="modal-title" class="form-control" placeholder="${activeType === 'task' ? 'ej. Entregar reporte de estudio' : 'ej. Estudiar 1 hora de JS'}" required />
          </div>

          <div class="form-group">
            <label class="form-label" for="modal-desc">Descripción (opcional)</label>
            <input type="text" id="modal-desc" class="form-control" placeholder="Detalles adicionales..." />
          </div>

          <div class="form-group">
            <label class="form-label" for="modal-category">Categoría</label>
            <select id="modal-category" class="form-control">
              <option value="">-- Sin categoría --</option>
              ${categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
            </select>
          </div>

          <!-- FECHA LÍMITE (SOLO PARA TAREAS) -->
          <div class="form-group" id="group-due-date" style="${activeType === 'task' ? 'display:block;' : 'display:none;'}">
            <label class="form-label" for="modal-duedate">Fecha Límite (due_date)</label>
            <input type="date" id="modal-duedate" class="form-control" value="${getTodayLocalDateString()}" />
          </div>

          <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:1.5rem;">
            <button type="button" class="btn btn-secondary" id="btn-modal-cancel">Cancelar</button>
            <button type="submit" class="btn btn-primary" id="btn-modal-submit">Guardar ${activeType === 'task' ? 'Tarea' : 'Hábito'}</button>
          </div>
        </form>
      </div>
    </div>
  `;

  // Referencias internas del DOM
  const backdrop = document.getElementById('modal-backdrop');
  const closeBtn = document.getElementById('modal-close-btn');
  const cancelBtn = document.getElementById('btn-modal-cancel');
  const form = document.getElementById('modal-creation-form');
  const tabTask = document.getElementById('tab-type-task');
  const tabHabit = document.getElementById('tab-type-habit');
  const groupDueDate = document.getElementById('group-due-date');
  const submitBtn = document.getElementById('btn-modal-submit');
  const titleInput = document.getElementById('modal-title');

  // Función para cerrar modal
  const closeModal = () => {
    modalContainerElement.innerHTML = '';
    document.removeEventListener('keydown', escHandler);
  };

  // Cerrar con tecla ESC
  const escHandler = (e) => {
    if (e.key === 'Escape') closeModal();
  };
  document.addEventListener('keydown', escHandler);

  // Alternar entre tipo Tarea y Hábito
  const setType = (type) => {
    activeType = type;
    if (type === 'task') {
      tabTask.classList.add('active');
      tabHabit.classList.remove('active');
      groupDueDate.style.display = 'block';
      submitBtn.innerText = 'Guardar Tarea';
      titleInput.placeholder = 'ej. Entregar reporte de estudio';
    } else {
      tabHabit.classList.add('active');
      tabTask.classList.remove('active');
      groupDueDate.style.display = 'none';
      submitBtn.innerText = 'Guardar Hábito';
      titleInput.placeholder = 'ej. Estudiar 1 hora de JS';
    }
  };

  tabTask.addEventListener('click', () => setType('task'));
  tabHabit.addEventListener('click', () => setType('habit'));

  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeModal();
  });

  // Submit Handler
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = titleInput.value.trim();
    const description = document.getElementById('modal-desc').value.trim();
    const category_id = document.getElementById('modal-category').value || null;
    const due_date = document.getElementById('modal-duedate').value || null;

    if (!title) return;

    submitBtn.disabled = true;
    submitBtn.innerText = '⏳ Guardando...';

    try {
      if (activeType === 'task') {
        await createTask({ title, description, category_id, due_date });
      } else {
        await createHabit({ title, description, category_id });
      }

      closeModal();
      if (onSuccessCallback) {
        await onSuccessCallback();
      }
    } catch (err) {
      alert('Error al guardar: ' + err.message);
      submitBtn.disabled = false;
      submitBtn.innerText = activeType === 'task' ? 'Guardar Tarea' : 'Guardar Hábito';
    }
  });

  // Dar foco al input de título automáticamente
  setTimeout(() => titleInput.focus(), 100);
}

