/**
 * Constantes de Dominio Sincronizadas - Frontend
 */

export const TICKET_STATUS = Object.freeze({
  ABIERTO: 'abierto',
  EN_PROGRESO: 'en progreso',
  RESUELTO: 'resuelto',
  CERRADO: 'cerrado'
});

export const TICKET_PRIORITY = Object.freeze({
  BAJA: 'baja',
  MEDIA: 'media',
  ALTA: 'alta'
});

export const SLA_HOURS = Object.freeze({
  [TICKET_PRIORITY.ALTA]: 4,
  [TICKET_PRIORITY.MEDIA]: 24,
  [TICKET_PRIORITY.BAJA]: 72
});
