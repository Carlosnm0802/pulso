// ============================================================================
// Utilerías de Fechas Locales — Pulso
// ============================================================================

/**
 * Obtiene la representación en formato YYYY-MM-DD de una fecha en la ZONA HORARIA LOCAL del cliente.
 * Evita desajustes por conversión a UTC.
 * @param {Date} [dateObj=new Date()] - Objeto Date a formatear.
 * @returns {string} Fecha en formato 'YYYY-MM-DD'.
 */
export function getLocalDateString(dateObj = new Date()) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Obtiene la fecha LOCAL de HOY en formato YYYY-MM-DD.
 * @returns {string} Fecha de hoy en formato 'YYYY-MM-DD'.
 */
export function getTodayLocalDateString() {
  return getLocalDateString(new Date());
}

/**
 * Formatea una cadena YYYY-MM-DD a un formato legible en español (ej. "Viernes, 18 de Septiembre").
 * @param {string} dateString - Cadena 'YYYY-MM-DD'.
 * @returns {string} Fecha legible.
 */
export function formatFriendlyDate(dateString) {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-').map(Number);
  const localDate = new Date(year, month - 1, day);
  
  return localDate.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
}
