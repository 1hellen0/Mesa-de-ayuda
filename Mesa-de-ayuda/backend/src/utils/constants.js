/**
 * Constantes de Dominio - Mesa de Ayuda con SLA e Historial
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

export const TICKET_AREAS = Object.freeze([
  'Soporte Técnico',
  'Facturación',
  'Infraestructura'
]);

export const SLA_HOURS = Object.freeze({
  [TICKET_PRIORITY.ALTA]: 4,
  [TICKET_PRIORITY.MEDIA]: 24,
  [TICKET_PRIORITY.BAJA]: 72
});

export const VALID_TRANSITIONS = Object.freeze({
  [TICKET_STATUS.ABIERTO]: [TICKET_STATUS.EN_PROGRESO],
  [TICKET_STATUS.EN_PROGRESO]: [TICKET_STATUS.RESUELTO],
  [TICKET_STATUS.RESUELTO]: [TICKET_STATUS.CERRADO, TICKET_STATUS.EN_PROGRESO],
  [TICKET_STATUS.CERRADO]: []
});

export const HISTORY_EVENT_TYPES = Object.freeze({
  CREACION: 'creacion',
  CAMBIO_ESTADO: 'cambio_estado',
  CAMBIO_AGENTE: 'cambio_agente',
  COMENTARIO_RESOLUCION: 'comentario_resolucion'
});
