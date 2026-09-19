// ============================================================================
// Componente de Gráficas con Chart.js — Pulso
// ============================================================================

let performanceChartInstance = null;

/**
 * Renderiza o actualiza la gráfica de rendimiento (Doughnut Chart) en el canvas indicado.
 * @param {string} canvasId - ID del elemento HTML <canvas>.
 * @param {Object} metrics - Objeto { daily_rate, weekly_rate }.
 */
export function renderPerformanceChart(canvasId, metrics = { daily_rate: 0, weekly_rate: 0 }) {
  const canvasElement = document.getElementById(canvasId);
  if (!canvasElement) return;

  const ctx = canvasElement.getContext('2d');
  const daily = Number(metrics.daily_rate) || 0;
  const weekly = Number(metrics.weekly_rate) || 0;
  const remaining = Math.max(0, 100 - daily);

  // Si ya existe una instancia previa de Chart.js en este canvas, se destruye antes de volver a dibujar
  if (performanceChartInstance) {
    performanceChartInstance.destroy();
  }

  // Verificar si la librería global de Chart está cargada
  if (typeof Chart === 'undefined') {
    console.warn('Chart.js no está disponible globalmente en la página.');
    return;
  }

  performanceChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Cumplimiento Hoy', 'Pendiente Hoy', '% Semanal'],
      datasets: [{
        label: '% Avance',
        data: [daily, remaining, weekly],
        backgroundColor: [
          '#6366f1', // Indigo - Avance Hoy
          '#1e293b', // Dark Slate - Pendiente Hoy
          '#10b981'  // Emerald - % Semanal
        ],
        borderColor: '#151c2c',
        borderWidth: 2,
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#94a3b8',
            font: {
              size: 12,
              family: 'system-ui'
            },
            padding: 15
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return ` ${context.label}: ${context.raw}%`;
            }
          }
        }
      },
      cutout: '70%'
    }
  });
}
