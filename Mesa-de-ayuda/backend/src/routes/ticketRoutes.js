import { Router } from 'express';
import { ticketController } from '../controllers/ticketController.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import {
  ticketIdParamSchema,
  createTicketSchema,
  updateTicketSchema,
  changeStatusSchema,
  queryTicketSchema
} from '../validators/ticketValidator.js';
import { createCommentSchema } from '../validators/commentValidator.js';

const router = Router();

// Listado con filtros, búsqueda y ordenamiento
router.get('/', validateRequest({ query: queryTicketSchema }), ticketController.getTickets);

// Creación de ticket con SLA y auto-asignación
router.post('/', validateRequest({ body: createTicketSchema }), ticketController.createTicket);

// Detalle completo del ticket (con cliente, agente, comentarios e historial)
router.get('/:id', validateRequest({ params: ticketIdParamSchema }), ticketController.getTicketDetail);

// Actualización general del ticket
router.put('/:id', validateRequest({ params: ticketIdParamSchema, body: updateTicketSchema }), ticketController.updateTicket);
router.patch('/:id', validateRequest({ params: ticketIdParamSchema, body: updateTicketSchema }), ticketController.updateTicket);

// Transición de estado (con comentario obligatorio para resuelto)
router.patch('/:id/estado', validateRequest({ params: ticketIdParamSchema, body: changeStatusSchema }), ticketController.changeStatus);

// Comentarios del ticket
router.get('/:id/comentarios', validateRequest({ params: ticketIdParamSchema }), ticketController.getComments);
router.post('/:id/comentarios', validateRequest({ params: ticketIdParamSchema, body: createCommentSchema }), ticketController.addComment);

// Historial del ticket
router.get('/:id/historial', validateRequest({ params: ticketIdParamSchema }), ticketController.getHistory);

export default router;
