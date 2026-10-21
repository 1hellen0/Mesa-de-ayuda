import { SLA_HOURS, TICKET_PRIORITY } from './constants.js';

/**
 * Calcula la fecha_limite a partir de la fecha de creación y la prioridad del ticket.
 * @param {string|Date} createdAt Fecha base de creación
 * @param {string} priority 'baja' | 'media' | 'alta'
 * @returns {string} Fecha ISO-8601 en formato UTC (YYYY-MM-DD HH:MM:SS)
 */
export function calculateSlaDueDate(createdAt = new Date(), priority = TICKET_PRIORITY.MEDIA) {
  const baseDate = new Date(createdAt);
  const hoursToAdd = SLA_HOURS[priority] ?? SLA_HOURS[TICKET_PRIORITY.MEDIA];
  const dueDate = new Date(baseDate.getTime() + hoursToAdd * 60 * 60 * 1000);
  
  // Formato SQLite datetime: YYYY-MM-DD HH:MM:SS
  return dueDate.toISOString().replace('T', ' ').substring(0, 19);
}

/**
 * Determina si un ticket incumplió su SLA
 * @param {string} fechaLimite
 * @param {string|null} fechaResolucion
 * @returns {boolean}
 */
export function isSlaBreached(fechaLimite, fechaResolucion = null) {
  const limit = new Date(fechaLimite).getTime();
  const comparisonDate = fechaResolucion ? new Date(fechaResolucion).getTime() : Date.now();
  return comparisonDate > limit;
}
