// ============================================================================
// Inicializador y Controlador Principal SPA — Pulso
// ============================================================================

import { supabase } from './config.js';
import { getTodayLocalDateString, formatFriendlyDate } from './utils/date.js';
import { getDashboardMetrics, getUserHabitsWithStreaks } from './services/metrics.js';
import { getTodayUnifiedData, toggleTodayItemCompletion } from './pages/today.js';
import { renderPerformanceChart } from './components/chart.js';
import { openCreationModal } from './components/modals.js';

// Elementos del DOM
const authSection = document.getElementById('auth-section');
const dashboardSection = document.getElementById('dashboard-section');
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

const todayDateStr = getTodayLocalDateString();
let currentUnifiedItems = [];

// ============================================================================
// INICIALIZACIÓN Y GESTIÓN DE SESIÓN
// ============================================================================

async function initApp() {
  todayFriendlyDate.innerText = `${formatFriendlyDate(todayDateStr)} (${todayDateStr})`;

  // Handler para el botón de crear modal
  btnOpenCreateModal?.addEventListener('click', () => {
    openCreationModal('task', async () => {
      await refreshDashboard();
    });
  });

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
  dashboardSection.style.display = 'none';
  btnOpenCreateModal.style.display = 'none';
  authHeaderContainer.innerHTML = '<span style="font-size:0.85rem; color:var(--text-muted);">Sin sesión</span>';
}

async function renderAuthenticatedState(user) {
  authSection.style.display = 'none';
  dashboardSection.style.display = 'block';
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
// RENDERIZADO DEL DASHBOARD Y GRÁFICAS (3 RPCs)
// ============================================================================

async function refreshDashboard() {
  try {
    // 1. Cargar las 3 RPCs de Supabase en paralelo
    const [metrics, habitsWithStreaks, todayData] = await Promise.all([
      getDashboardMetrics(todayDateStr),
      getUserHabitsWithStreaks(todayDateStr),
      getTodayUnifiedData(todayDateStr)
    ]);

    // 2. Renderizar KPI 1 (% Diario) y KPI 3 (% Semanal)
    kpiDailyRate.innerText = `${metrics.daily_rate}%`;
    kpiWeeklyRate.innerText = `${metrics.weekly_rate}%`;

    // 3. Renderizar KPI 2 (Rachas Activas)
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

    // 4. Renderizar Gráfica de Chart.js
    renderPerformanceChart('performanceChart', metrics);

    // 5. Renderizar Lista Unificada "Hoy"
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

  // Event Listeners para los checkboxes
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

btnRefreshDashboard?.addEventListener('click', refreshDashboard);

// Iniciar aplicación al cargar la página
initApp();
