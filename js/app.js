// ============================================================================
// Inicializador y Controlador Principal SPA — Pulso
// ============================================================================

import { supabase } from './config.js';
import { getTodayLocalDateString, formatFriendlyDate } from './utils/date.js';
import { getDashboardMetrics, getUserHabitsWithStreaks } from './services/metrics.js';
import { getTodayUnifiedData, toggleTodayItemCompletion } from './pages/today.js';
import { renderPerformanceChart } from './components/chart.js';
import { openCreationModal } from './components/modals.js';
import { renderManagementView } from './pages/manage.js';
import { getHistoryDataForDate } from './pages/history.js';

// Elementos del DOM
const authSection = document.getElementById('auth-section');
const appMainContent = document.getElementById('app-main-content');
const authHeaderContainer = document.getElementById('auth-header-container');
const btnOpenCreateModal = document.getElementById('btn-open-create-modal');

const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');
const btnLoginSubmit = document.getElementById('btn-login-submit');

const kpiDailyRate = document.getElementById('kpi-daily-rate');
const kpiActiveStreaks = document.getElementById('kpi-active-streaks');
const kpiStreaksDetail = document.getElementById('kpi-streaks-detail');
const kpiWeeklyRate = document.getElementById('kpi-weekly-rate');

const todayFriendlyDate = document.getElementById('today-friendly-date');
const todayUnifiedList = document.getElementById('today-unified-list');
const btnRefreshDashboard = document.getElementById('btn-refresh-dashboard');

const manageSection = document.getElementById('manage-section');
const historySection = document.getElementById('history-section');
const dashboardSection = document.getElementById('dashboard-section');

const historyDatePicker = document.getElementById('history-date-picker');
const btnFetchHistory = document.getElementById('btn-fetch-history');
const historyTargetTitle = document.getElementById('history-target-title');
const historyTargetRate = document.getElementById('history-target-rate');
const historyUnifiedList = document.getElementById('history-unified-list');

const todayDateStr = getTodayLocalDateString();
let currentUnifiedItems = [];
let activeTab = 'dashboard-section';

// ============================================================================
// INICIALIZACIÓN Y GESTIÓN DE SESIÓN
// ============================================================================

async function initApp() {
  todayFriendlyDate.innerText = `${formatFriendlyDate(todayDateStr)} (${todayDateStr})`;
  if (historyDatePicker) historyDatePicker.value = todayDateStr;

  // Registrar Service Worker para soporte PWA
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then(reg => console.log('[PWA] Service Worker registrado:', reg.scope))
        .catch(err => console.warn('[PWA] Error al registrar Service Worker:', err));
    });
  }

  // Setup de Navegación por Pestañas (SPA Router)
  setupSpaTabRouter();

  // Handler para el botón de crear modal
  btnOpenCreateModal?.addEventListener('click', () => {
    openCreationModal('task', async () => {
      await refreshDashboard();
      if (activeTab === 'manage-section') {
        await renderManagementView(manageSection, refreshDashboard);
      }
    });
  });

  // Handler para búsqueda de Historial
  btnFetchHistory?.addEventListener('click', loadHistoryData);

  // Escuchar cambios de autenticación en Supabase
  supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
      renderAuthenticatedState(session.user);
    } else {
      renderUnauthenticatedState();
    }
  });

  // Verificar sesión inicial
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    await renderAuthenticatedState(session.user);
  } else {
    renderUnauthenticatedState();
  }
}

function renderUnauthenticatedState() {
  authSection.style.display = 'block';
  appMainContent.style.display = 'none';
  btnOpenCreateModal.style.display = 'none';
  authHeaderContainer.innerHTML = '<span style="font-size:0.85rem; color:var(--text-muted);">Sin sesión</span>';
}

async function renderAuthenticatedState(user) {
  authSection.style.display = 'none';
  appMainContent.style.display = 'block';
  btnOpenCreateModal.style.display = 'inline-flex';
  authHeaderContainer.innerHTML = `
    <span style="font-size:0.85rem; color:var(--accent-primary); margin-right:0.5rem;">${user.email}</span>
    <button id="btn-logout" class="btn btn-secondary" style="padding:0.25rem 0.625rem; font-size:0.8rem;">Cerrar Sesión</button>
  `;

  document.getElementById('btn-logout')?.addEventListener('click', async () => {
    await supabase.auth.signOut();
  });

  await refreshDashboard();
}

// Handler de inicio de sesión
btnLoginSubmit?.addEventListener('click', async () => {
  const email = loginEmailInput.value.trim();
  const password = loginPasswordInput.value;

  if (!email || !password) {
    alert('Por favor ingresa tu correo y contraseña.');
    return;
  }

  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  } catch (err) {
    alert('Error al iniciar sesión: ' + err.message);
  }
});

// ============================================================================
// ENRUTADOR DE PESTAÑAS (SPA TAB ROUTER)
// ============================================================================

function setupSpaTabRouter() {
  const tabs = document.querySelectorAll('.spa-nav-tab');
  const views = document.querySelectorAll('.spa-view');

  tabs.forEach(tab => {
    tab.addEventListener('click', async () => {
      const targetViewId = tab.getAttribute('data-target');
      activeTab = targetViewId;

      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      views.forEach(v => {
        v.style.display = v.id === targetViewId ? 'block' : 'none';
      });

      // Cargar contenido específico de la pestaña seleccionada
      if (targetViewId === 'manage-section') {
        await renderManagementView(manageSection, refreshDashboard);
      } else if (targetViewId === 'history-section') {
        await loadHistoryData();
      } else if (targetViewId === 'dashboard-section') {
        await refreshDashboard();
      }
    });
  });
}

// ============================================================================
// RENDERIZADO DEL DASHBOARD Y GRÁFICAS (3 RPCs)
// ============================================================================

async function refreshDashboard() {
  try {
    const [metrics, habitsWithStreaks, todayData] = await Promise.all([
      getDashboardMetrics(todayDateStr),
      getUserHabitsWithStreaks(todayDateStr),
      getTodayUnifiedData(todayDateStr)
    ]);

    // KPI 1 (% Diario) y KPI 3 (% Semanal)
    kpiDailyRate.innerText = `${metrics.daily_rate}%`;
    kpiWeeklyRate.innerText = `${metrics.weekly_rate}%`;

    // KPI 2 (Rachas Activas)
    const activeStreaksCount = habitsWithStreaks.filter(h => h.streak > 0).length;
    kpiActiveStreaks.innerText = activeStreaksCount;

    if (habitsWithStreaks.length > 0) {
      const topStreakHabit = habitsWithStreaks.reduce((prev, curr) => (curr.streak > prev.streak ? curr : prev), habitsWithStreaks[0]);
      kpiStreaksDetail.innerText = topStreakHabit.streak > 0 
        ? `Mejor racha: "${topStreakHabit.title}" (${topStreakHabit.streak} días)`
        : '¡Completa un hábito hoy para iniciar tu racha!';
    } else {
      kpiStreaksDetail.innerText = 'No hay hábitos activos registrados';
    }

    // Renderizar Gráfica Chart.js
    renderPerformanceChart('performanceChart', metrics);

    // Renderizar Lista Unificada "Hoy"
    currentUnifiedItems = todayData.items;
    renderTodayUnifiedList(todayData.items);

  } catch (err) {
    console.error('Error al refrescar el dashboard:', err);
  }
}

function renderTodayUnifiedList(items) {
  if (!items || items.length === 0) {
    todayUnifiedList.innerHTML = '<p style="color:var(--text-muted); font-size:0.9rem;">No hay tareas ni hábitos agendados para hoy.</p>';
    return;
  }

  todayUnifiedList.innerHTML = items.map((item, index) => `
    <div class="unified-item ${item.isCompleted ? 'completed' : ''}">
      <div style="display:flex; align-items:center; gap:0.75rem;">
        <input type="checkbox" ${item.isCompleted ? 'checked' : ''} data-index="${index}" class="item-checkbox" style="width:18px; height:18px; cursor:pointer;" />
        <div>
          <div style="display:flex; align-items:center; gap:0.375rem; margin-bottom:0.15rem;">
            <span class="type-tag ${item.itemType === 'habit' ? 'type-habit' : 'type-task'}">
              ${item.itemType === 'habit' ? '🔥 Hábito' : '📝 Tarea'}
            </span>
            ${item.category ? `<span class="badge" style="background:${item.category.color}">${item.category.name}</span>` : ''}
          </div>
          <span class="item-title" style="font-weight:600; color:var(--text-primary);">${item.title}</span>
        </div>
      </div>
    </div>
  `).join('');

  document.querySelectorAll('.item-checkbox').forEach(cb => {
    cb.addEventListener('change', async (e) => {
      const idx = e.target.getAttribute('data-index');
      const item = currentUnifiedItems[idx];
      if (!item) return;

      try {
        await toggleTodayItemCompletion(item, e.target.checked, todayDateStr);
        await refreshDashboard();
      } catch (err) {
        alert('Error al actualizar estado: ' + err.message);
        await refreshDashboard();
      }
    });
  });
}

// ============================================================================
// CARGA Y RENDERIZADO DE HISTORIAL / CALENDARIO
// ============================================================================

async function loadHistoryData() {
  const selectedDate = historyDatePicker.value;
  if (!selectedDate) return;

  historyUnifiedList.innerHTML = '<li style="color:var(--text-muted);">Consultando historial...</li>';

  try {
    const historyData = await getHistoryDataForDate(selectedDate);
    historyTargetTitle.innerText = `Resumen del ${formatFriendlyDate(selectedDate)} (${selectedDate})`;
    historyTargetRate.innerText = `${historyData.stats.percentage}%`;

    if (historyData.items.length === 0) {
      historyUnifiedList.innerHTML = '<li style="color:var(--text-muted);">No existen registros guardados para esta fecha.</li>';
      return;
    }

    historyUnifiedList.innerHTML = historyData.items.map(item => `
      <li class="unified-item ${item.isCompleted ? 'completed' : ''}">
        <div style="display:flex; align-items:center; gap:0.75rem;">
          <span style="font-size:1.2rem;">${item.isCompleted ? '✅' : '❌'}</span>
          <div>
            <div style="display:flex; align-items:center; gap:0.375rem; margin-bottom:0.15rem;">
              <span class="type-tag ${item.itemType === 'habit' ? 'type-habit' : 'type-task'}">
                ${item.itemType === 'habit' ? '🔥 Hábito' : '📝 Tarea'}
              </span>
              ${item.category ? `<span class="badge" style="background:${item.category.color}">${item.category.name}</span>` : ''}
            </div>
            <span class="item-title" style="font-weight:600; color:var(--text-primary);">${item.title}</span>
          </div>
        </div>
      </li>
    `).join('');

  } catch (err) {
    historyUnifiedList.innerHTML = `<li style="color:var(--accent-danger);">Error al consultar historial: ${err.message}</li>`;
  }
}

btnRefreshDashboard?.addEventListener('click', refreshDashboard);

// Iniciar aplicación al cargar la página
initApp();
