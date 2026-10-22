import db from '../config/database.js';
import { ticketRepository } from '../repositories/ticketRepository.js';
import { agentRepository } from '../repositories/agentRepository.js';
import { clientRepository } from '../repositories/clientRepository.js';
import { commentRepository } from '../repositories/commentRepository.js';
import { historyRepository } from '../repositories/historyRepository.js';
import { calculateSlaDueDate } from '../utils/dateUtils.js';
import { TICKET_STATUS, VALID_TRANSITIONS, HISTORY_EVENT_TYPES } from '../utils/constants.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';

export const ticketService = {
  getAllTickets(filters) {
    return ticketRepository.findAll(filters);
  },

  getTicketDetail(id) {
    const ticket = ticketRepository.findById(id);
    if (!ticket) {
      throw new NotFoundError(`Ticket no encontrado con ID ${id}`);
    }

    const comentarios = commentRepository.findByTicketId(id);
    const historial = historyRepository.findByTicketId(id);

    return {
      ...ticket,
      comentarios,
      historial
    };
  },

  /**
   * Creación de Ticket con SLA y Asignación Automática:
   * 1. Valida existencia del cliente.
   * 2. Calcula fecha_limite (4h, 24h, 72h).
   * 3. Busca agente activo del área con menor carga. Si no hay, arroja 409 y revierte.
   * 4. En transacción: Crea ticket en 'en progreso', inserta historial de creación, asignación y estado.
   */
  createTicket(data) {
    const client = clientRepository.findById(data.cliente_id);
    if (!client) {
      throw new NotFoundError(`No existe el cliente con ID ${data.cliente_id}`);
    }

    // Buscar agente elegible por área y menor carga
    const eligibleAgent = agentRepository.findAvailableWithLeastLoad(data.area);
    if (!eligibleAgent) {
      throw new ConflictError(`No hay agentes activos disponibles en el área '${data.area}' para la asignación automática`);
    }

    // Calcular SLA según prioridad
    const fechaLimite = calculateSlaDueDate(new Date(), data.prioridad);

    // Ejecutar creación y auditoría de forma atómica
    const createTx = db.transaction(() => {
      // Al asignar automáticamente, su estado avanza a 'en progreso'
      const ticket = ticketRepository.create({
        titulo: data.titulo,
        descripcion: data.descripcion,
        cliente_id: data.cliente_id,
        agente_id: eligibleAgent.id,
        area: data.area,
        estado: TICKET_STATUS.EN_PROGRESO,
        prioridad: data.prioridad,
        fecha_limite: fechaLimite
      });

      // Historial de creación base
      historyRepository.create({
        ticket_id: ticket.id,
        tipo_evento: HISTORY_EVENT_TYPES.CREACION,
        campo: 'ticket',
        valor_anterior: null,
        valor_nuevo: TICKET_STATUS.ABIERTO,
        autor_id: data.cliente_id,
        detalles: `Ticket reportado por cliente ${client.nombre} (${data.area})`
      });

      // Historial de asignación automática
      historyRepository.create({
        ticket_id: ticket.id,
        tipo_evento: HISTORY_EVENT_TYPES.CAMBIO_AGENTE,
        campo: 'agente_id',
        valor_anterior: null,
        valor_nuevo: String(eligibleAgent.id),
        autor_id: eligibleAgent.id,
        detalles: `Asignado automáticamente a ${eligibleAgent.nombre} por menor carga (${eligibleAgent.tickets_en_curso} tickets previos)`
      });

      // Historial de avance a 'en progreso'
      historyRepository.create({
        ticket_id: ticket.id,
        tipo_evento: HISTORY_EVENT_TYPES.CAMBIO_ESTADO,
        campo: 'estado',
        valor_anterior: TICKET_STATUS.ABIERTO,
        valor_nuevo: TICKET_STATUS.EN_PROGRESO,
        autor_id: eligibleAgent.id,
        detalles: 'Estado avanzado a en progreso tras asignación de agente'
      });

      return ticket;
    });

    return createTx();
  },

  /**
   * Actualización de datos generales del ticket.
   */
  updateTicket(id, data) {
    const currentTicket = ticketRepository.findById(id);
    if (!currentTicket) {
      throw new NotFoundError(`Ticket no encontrado con ID ${id}`);
    }

    if (data.agente_id && data.agente_id !== currentTicket.agente_id) {
      const agent = agentRepository.findById(data.agente_id);
      if (!agent) {
        throw new NotFoundError(`Agente no encontrado con ID ${data.agente_id}`);
      }
      if (agent.activo !== 1) {
        throw new ConflictError(`El agente '${agent.nombre}' se encuentra inactivo`);
      }

      const updateTx = db.transaction(() => {
        const updated = ticketRepository.update(id, data);
        historyRepository.create({
          ticket_id: id,
          tipo_evento: HISTORY_EVENT_TYPES.CAMBIO_AGENTE,
          campo: 'agente_id',
          valor_anterior: String(currentTicket.agente_id || 'Sin asignar'),
          valor_nuevo: String(data.agente_id),
          autor_id: data.agente_id,
          detalles: `Reasignado manualmente al agente ${agent.nombre}`
        });
        return updated;
      });

      return updateTx();
    }

    return ticketRepository.update(id, data);
  },

  /**
   * Transición de Estado y Resolución:
   * Valida máquina de estados y exige comentario para resolución.
   * Ejecuta cambio de estado, comentario e historial en una misma transacción.
   */
  changeStatus(id, { estado: nuevoEstado, comentario, autor_id }) {
    const currentTicket = ticketRepository.findById(id);
    if (!currentTicket) {
      throw new NotFoundError(`Ticket no encontrado con ID ${id}`);
    }

    const estadoActual = currentTicket.estado;

    // Si el estado es el mismo, no requiere operación
    if (estadoActual === nuevoEstado) {
      return currentTicket;
    }

    // Validar transición permitida en la máquina de estados
    const transicionesValidas = VALID_TRANSITIONS[estadoActual] || [];
    if (!transicionesValidas.includes(nuevoEstado)) {
      throw new ConflictError(`Transición no permitida: no se puede pasar de '${estadoActual}' a '${nuevoEstado}'`);
    }

    // Regla obligatoria: Comentario requerido para resolver
    if (nuevoEstado === TICKET_STATUS.RESUELTO) {
      if (!comentario || typeof comentario !== 'string' || comentario.trim().length === 0) {
        throw new ConflictError('Es obligatorio proporcionar un comentario de resolución para marcar el ticket como resuelto');
      }
    }

    // Ejecutar cambio de estado, comentario e historial dentro de una transacción atómica
    const changeStatusTx = db.transaction(() => {
      let fechaResolucion = currentTicket.fecha_resolucion;

      if (nuevoEstado === TICKET_STATUS.RESUELTO) {
        // Formato SQLite datetime local UTC
        fechaResolucion = new Date().toISOString().replace('T', ' ').substring(0, 19);

        // Inserción del comentario obligatorio de resolución
        commentRepository.create({
          ticket_id: id,
          autor_tipo: 'agente',
          autor_id: autor_id || currentTicket.agente_id || 1,
          contenido: comentario.trim(),
          es_resolucion: 1
        });
      } else if (nuevoEstado === TICKET_STATUS.EN_PROGRESO && estadoActual === TICKET_STATUS.RESUELTO) {
        // Si se reabre el ticket desde resuelto, se limpia la fecha de resolución
        fechaResolucion = null;
      }

      // Actualizar estado del ticket
      const updatedTicket = ticketRepository.updateStatus(id, nuevoEstado, fechaResolucion);

      // Registrar evento en historial
      historyRepository.create({
        ticket_id: id,
        tipo_evento: nuevoEstado === TICKET_STATUS.RESUELTO
          ? HISTORY_EVENT_TYPES.COMENTARIO_RESOLUCION
          : HISTORY_EVENT_TYPES.CAMBIO_ESTADO,
        campo: 'estado',
        valor_anterior: estadoActual,
        valor_nuevo: nuevoEstado,
        autor_id: autor_id || currentTicket.agente_id || null,
        detalles: comentario ? comentario.trim() : `Cambio de estado a ${nuevoEstado}`
      });

      return updatedTicket;
    });

    return changeStatusTx();
  },

  addComment(ticketId, data) {
    const ticket = ticketRepository.findById(ticketId);
    if (!ticket) {
      throw new NotFoundError(`Ticket no encontrado con ID ${ticketId}`);
    }

    if (data.autor_tipo === 'agente') {
      const agent = agentRepository.findById(data.autor_id);
      if (!agent) throw new NotFoundError(`Agente no encontrado con ID ${data.autor_id}`);
    } else if (data.autor_tipo === 'cliente') {
      const client = clientRepository.findById(data.autor_id);
      if (!client) throw new NotFoundError(`Cliente no encontrado con ID ${data.autor_id}`);
    }

    return commentRepository.create({
      ticket_id: ticketId,
      autor_tipo: data.autor_tipo,
      autor_id: data.autor_id,
      contenido: data.contenido,
      es_resolucion: 0
    });
  },

  getTicketComments(ticketId) {
    const ticket = ticketRepository.findById(ticketId);
    if (!ticket) {
      throw new NotFoundError(`Ticket no encontrado con ID ${ticketId}`);
    }
    return commentRepository.findByTicketId(ticketId);
  },

  getTicketHistory(ticketId) {
    const ticket = ticketRepository.findById(ticketId);
    if (!ticket) {
      throw new NotFoundError(`Ticket no encontrado con ID ${ticketId}`);
    }
    return historyRepository.findByTicketId(ticketId);
  }
};
