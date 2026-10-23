import { SLA_HOURS, TICKET_PRIORITY } from './constants.js';

export const TIMEZONE_CR = 'America/Costa_Rica';

/**
 * Parsea un timestamp de SQLite ('YYYY-MM-DD HH:MM:SS' en UTC) a un objeto Date.
 * Garantiza que Node no aplique desplazamientos locales arbitrarios a timestamps UTC.
 */
export function parseDateUtc(dateInput) {
  if (!dateInput) return null;
  if (dateInput instanceof Date) return isNaN(dateInput.getTime()) ? null : dateInput;
  const str = String(dateInput).trim();
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(str)) {
    return new Date(str.replace(' ', 'T') + 'Z');
  }
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(str)) {
    return new Date(str + 'Z');
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Calcula la fecha_limite a partir de la fecha de creación y la prioridad del ticket.
 * Regla de negocio oficial estricta:
 * - Alta: +4 horas
 * - Media: +24 horas
 * - Baja: +72 horas
 * @param {string|Date} createdAt Fecha base de creación
 * @param {string} priority 'alta' | 'media' | 'baja'
 * @returns {string} Fecha en formato SQLite UTC (YYYY-MM-DD HH:MM:SS)
 */
export function calculateSlaDueDate(createdAt = new Date(), priority = TICKET_PRIORITY.MEDIA) {
  const baseDate = parseDateUtc(createdAt) || new Date();
  const hoursToAdd = SLA_HOURS[priority] ?? SLA_HOURS[TICKET_PRIORITY.MEDIA];
  const dueDate = new Date(baseDate.getTime() + hoursToAdd * 60 * 60 * 1000);

  // Formato SQLite datetime: YYYY-MM-DD HH:MM:SS en UTC
  return dueDate.toISOString().replace('T', ' ').substring(0, 19);
}

/**
 * Determina si un ticket incumplió su SLA comparando en UTC
 * @param {string} fechaLimite
 * @param {string|null} fechaResolucion
 * @returns {boolean}
 */
export function isSlaBreached(fechaLimite, fechaResolucion = null) {
  const limitDate = parseDateUtc(fechaLimite);
  if (!limitDate) return false;
  const limit = limitDate.getTime();
  const resolveDate = fechaResolucion ? parseDateUtc(fechaResolucion) : null;
  const comparisonDate = resolveDate ? resolveDate.getTime() : Date.now();
  return comparisonDate > limit;
}
