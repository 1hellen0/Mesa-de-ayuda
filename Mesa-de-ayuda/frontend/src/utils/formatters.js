/**
 * Utilidades de formateo de fechas, cálculo de SLA y presentación
 * Configurado con la zona horaria oficial del sistema: America/Costa_Rica
 */

import { TICKET_STATUS, TICKET_PRIORITY } from './constants.js';

export const TIMEZONE_CR = 'America/Costa_Rica';

/**
 * Convierte de forma robusta cualquier string de fecha (SQLite UTC o ISO) a un objeto Date.
 * SQLite almacena timestamps con datetime('now') en UTC: 'YYYY-MM-DD HH:MM:SS'.
 * Si el string no incluye designador de zona horaria, se normaliza con 'Z' para
 * garantizar que no se aplique un desplazamiento erróneo de zona horaria local.
 */
export function parseDate(dateString) {
  if (!dateString) return null;
  if (dateString instanceof Date) return isNaN(dateString.getTime()) ? null : dateString;

  const str = String(dateString).trim();
  // Formato SQLite datetime: 'YYYY-MM-DD HH:MM:SS' -> se añade 'Z' para indicar UTC
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(str)) {
    return new Date(str.replace(' ', 'T') + 'Z');
  }
  // Formato ISO sin zona horaria: 'YYYY-MM-DDTHH:MM:SS' -> se añade 'Z'
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(str)) {
    return new Date(str + 'Z');
  }

  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Formatea una fecha a formato legible en español en la zona horaria America/Costa_Rica
 */
export function formatDate(dateString, options = {}) {
  const d = parseDate(dateString);
  if (!d) return '—';
  try {
    return new Intl.DateTimeFormat('es-CR', {
      timeZone: TIMEZONE_CR,
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      ...options
    }).format(d);
  } catch {
    return String(dateString);
  }
}

/**
 * Formatea solo la hora y minuto en formato de 24 horas para la zona horaria America/Costa_Rica (ej: "22:21")
 */
export function formatTime(dateString) {
  const d = parseDate(dateString);
  if (!d) return '—';
  try {
    return new Intl.DateTimeFormat('es-CR', {
      timeZone: TIMEZONE_CR,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(d);
  } catch {
    return String(dateString);
  }
}

/**
 * Formatea una fecha a tiempo relativo legible (ej: "hace 15 min", "hace 2h")
 */
export function formatRelativeTime(dateString) {
  const d = parseDate(dateString);
  if (!d) return '—';
  try {
    const now = Date.now();
    const diffSec = Math.floor((now - d.getTime()) / 1000);
    if (diffSec < 60) return 'hace un momento';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `hace ${diffMin} min`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `hace ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `hace ${diffDays}d`;
    return formatDate(dateString);
  } catch {
    return String(dateString);
  }
}

/**
 * Calcula el estado del SLA y el tiempo restante/vencido respetando la fecha límite individual
 * del ticket calculada por el backend según su prioridad (Alta: 4h, Media: 24h, Baja: 72h).
 */
export function getSlaInfo(ticket) {
  if (!ticket || !ticket.fecha_limite) {
    return { isOverdue: false, text: 'Sin SLA', badgeClass: 'bg-[#F3F0E9] text-[#252A30]/60' };
  }

  const limitDate = parseDate(ticket.fecha_limite);
  if (!limitDate) {
    return { isOverdue: false, text: 'Sin SLA', badgeClass: 'bg-[#F3F0E9] text-[#252A30]/60' };
  }

  const limitTime = limitDate.getTime();
  const now = Date.now();

  // Si está resuelto o cerrado, comparamos contra la fecha de resolución
  const isFinalState = ticket.estado === TICKET_STATUS.RESUELTO || ticket.estado === TICKET_STATUS.CERRADO;

  if (isFinalState) {
    const resolveDate = ticket.fecha_resolucion ? parseDate(ticket.fecha_resolucion) : null;
    const resolveTime = resolveDate ? resolveDate.getTime() : now;
    const fulfilled = resolveTime <= limitTime;
    return {
      isOverdue: !fulfilled,
      text: fulfilled ? 'Cumplido a tiempo' : 'Resuelto fuera de plazo',
      badgeClass: fulfilled
        ? 'bg-[#E6EBE4] text-[#202C2A] border-[#A9B8A5]'
        : 'bg-rose-50 text-rose-700 border-rose-200'
    };
  }

  // Si está activo (abierto o en progreso)
  const diffMs = limitTime - now;
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 0) {
    const hoursOver = Math.abs(Math.round(diffHours));
    return {
      isOverdue: true,
      text: `VENCIDO hace ${hoursOver}h`,
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 font-semibold animate-pulse'
    };
  }

  if (diffHours < 2) {
    const minutesLeft = Math.max(1, Math.round(diffMs / (1000 * 60)));
    return {
      isOverdue: false,
      isUrgent: true,
      text: `Vence en ${minutesLeft} min`,
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 font-medium'
    };
  }

  const hoursLeft = Math.round(diffHours);
  return {
    isOverdue: false,
    text: `Quedan ${hoursLeft}h`,
    badgeClass: 'bg-sky-50 text-sky-800 border-sky-200'
  };
}

/**
 * Estilos y etiquetas para los estados de ticket (Paleta Nexora)
 */
export function getStatusConfig(status) {
  switch (status) {
    case TICKET_STATUS.ABIERTO:
      return {
        label: 'Abierto',
        bg: 'bg-amber-50',
        text: 'text-amber-900',
        border: 'border-amber-300',
        dot: 'bg-amber-500'
      };
    case TICKET_STATUS.EN_PROGRESO:
      return {
        label: 'En Progreso',
        bg: 'bg-sky-50',
        text: 'text-sky-900',
        border: 'border-sky-300',
        dot: 'bg-sky-500'
      };
    case TICKET_STATUS.RESUELTO:
      return {
        label: 'Resuelto',
        bg: 'bg-[#E6EBE4]',
        text: 'text-[#202C2A]',
        border: 'border-[#A9B8A5]',
        dot: 'bg-emerald-600'
      };
    case TICKET_STATUS.CERRADO:
      return {
        label: 'Cerrado',
        bg: 'bg-[#202C2A]',
        text: 'text-white',
        border: 'border-[#C49A6C]/40',
        dot: 'bg-[#C49A6C]'
      };
    default:
      return {
        label: status || 'Desconocido',
        bg: 'bg-[#F3F0E9]',
        text: 'text-[#252A30]',
        border: 'border-[#DFD9CD]',
        dot: 'bg-slate-400'
      };
  }
}

/**
 * Estilos y etiquetas para las prioridades de ticket (Paleta Nexora)
 * Catálogo Oficial Estricto: Alta (4h), Media (24h), Baja (72h)
 */
export function getPriorityConfig(priority) {
  switch (priority) {
    case TICKET_PRIORITY.ALTA:
      return {
        label: 'Alta',
        badgeClass: 'bg-rose-50 text-rose-900 border-rose-300 font-semibold',
        iconColor: 'text-rose-600',
        hours: 4
      };
    case TICKET_PRIORITY.MEDIA:
      return {
        label: 'Media',
        badgeClass: 'bg-[#FAF8F4] text-[#9A744B] border-[#C49A6C]/60 font-semibold',
        iconColor: 'text-[#C49A6C]',
        hours: 24
      };
    case TICKET_PRIORITY.BAJA:
      return {
        label: 'Baja',
        badgeClass: 'bg-[#E6EBE4] text-[#202C2A] border-[#A9B8A5] font-semibold',
        iconColor: 'text-[#7A8C76]',
        hours: 72
      };
    default:
      return {
        label: priority || 'Media',
        badgeClass: 'bg-[#F3F0E9] text-[#252A30] border-[#DFD9CD]',
        iconColor: 'text-[#7A8C76]',
        hours: 24
      };
  }
}
