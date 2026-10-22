/**
 * Utilidades de formateo de fechas, cálculo de SLA y presentación
 */

import { TICKET_STATUS, TICKET_PRIORITY } from './constants';

/**
 * Formatea una fecha ISO o string de SQLite a formato legible local
 */
export function formatDate(dateString) {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return String(dateString);
    return new Intl.DateTimeFormat('es-CR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  } catch {
    return String(dateString);
  }
}

/**
 * Calcula el estado del SLA y el tiempo restante/vencido
 */
export function getSlaInfo(ticket) {
  if (!ticket || !ticket.fecha_limite) {
    return { isOverdue: false, text: 'Sin SLA', badgeClass: 'bg-slate-100 text-slate-700' };
  }

  // Si está resuelto o cerrado, comparamos contra la fecha de resolución
  const isFinalState = ticket.estado === TICKET_STATUS.RESUELTO || ticket.estado === TICKET_STATUS.CERRADO;
  const limitDate = new Date(ticket.fecha_limite).getTime();
  const now = Date.now();

  if (isFinalState) {
    const resolveDate = ticket.fecha_resolucion ? new Date(ticket.fecha_resolucion).getTime() : now;
    const fulfilled = resolveDate <= limitDate;
    return {
      isOverdue: !fulfilled,
      text: fulfilled ? 'Cumplido a tiempo' : 'Resuelto fuera de plazo',
      badgeClass: fulfilled
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
        : 'bg-rose-50 text-rose-700 border-rose-200'
    };
  }

  // Si está activo (abierto o en progreso)
  const diffMs = limitDate - now;
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
    const minutesLeft = Math.round(diffMs / (1000 * 60));
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
 * Estilos y etiquetas para los estados de ticket
 */
export function getStatusConfig(status) {
  switch (status) {
    case TICKET_STATUS.ABIERTO:
      return {
        label: 'Abierto',
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        dot: 'bg-amber-400'
      };
    case TICKET_STATUS.EN_PROGRESO:
      return {
        label: 'En Progreso',
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        dot: 'bg-blue-500'
      };
    case TICKET_STATUS.RESUELTO:
      return {
        label: 'Resuelto',
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        dot: 'bg-emerald-500'
      };
    case TICKET_STATUS.CERRADO:
      return {
        label: 'Cerrado',
        bg: 'bg-slate-100',
        text: 'text-slate-600',
        border: 'border-slate-200',
        dot: 'bg-slate-400'
      };
    default:
      return {
        label: status || 'Desconocido',
        bg: 'bg-slate-100',
        text: 'text-slate-700',
        border: 'border-slate-200',
        dot: 'bg-slate-400'
      };
  }
}

/**
 * Estilos y etiquetas para las prioridades de ticket
 */
export function getPriorityConfig(priority) {
  switch (priority) {
    case TICKET_PRIORITY.ALTA:
      return {
        label: 'Alta (4h)',
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
        iconColor: 'text-rose-500'
      };
    case TICKET_PRIORITY.MEDIA:
      return {
        label: 'Media (24h)',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        iconColor: 'text-amber-500'
      };
    case TICKET_PRIORITY.BAJA:
      return {
        label: 'Baja (72h)',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        iconColor: 'text-emerald-500'
      };
    default:
      return {
        label: priority || 'Normal',
        badgeClass: 'bg-slate-50 text-slate-700 border-slate-200',
        iconColor: 'text-slate-500'
      };
  }
}
