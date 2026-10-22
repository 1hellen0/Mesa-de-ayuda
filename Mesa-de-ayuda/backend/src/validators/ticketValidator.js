import { z } from 'zod';
import { TICKET_STATUS, TICKET_PRIORITY } from '../utils/constants.js';

export const ticketIdParamSchema = z.object({
  id: z.coerce.number().int().positive({ message: 'El ID de ticket debe ser un número entero positivo' })
});

export const createTicketSchema = z.object({
  titulo: z.string().trim().min(3, { message: 'El título debe tener al menos 3 caracteres' }),
  descripcion: z.string().trim().min(5, { message: 'La descripción debe tener al menos 5 caracteres' }),
  cliente_id: z.coerce.number().int().positive({ message: 'cliente_id debe ser un entero positivo' }),
  area: z.string().trim().min(2, { message: 'El área es requerida' }),
  prioridad: z.enum([TICKET_PRIORITY.BAJA, TICKET_PRIORITY.MEDIA, TICKET_PRIORITY.ALTA], {
    errorMap: () => ({ message: "La prioridad debe ser 'baja', 'media' o 'alta'" })
  })
});

export const updateTicketSchema = z.object({
  titulo: z.string().trim().min(3).optional(),
  descripcion: z.string().trim().min(5).optional(),
  area: z.string().trim().min(2).optional(),
  prioridad: z.enum([TICKET_PRIORITY.BAJA, TICKET_PRIORITY.MEDIA, TICKET_PRIORITY.ALTA]).optional(),
  agente_id: z.coerce.number().int().positive().optional().nullable()
}).refine((data) => Object.keys(data).length > 0, {
  message: 'Debe proporcionar al menos un campo para actualizar'
});

export const changeStatusSchema = z.object({
  estado: z.enum([
    TICKET_STATUS.ABIERTO,
    TICKET_STATUS.EN_PROGRESO,
    TICKET_STATUS.RESUELTO,
    TICKET_STATUS.CERRADO
  ], {
    errorMap: () => ({ message: "El estado debe ser 'abierto', 'en progreso', 'resuelto' o 'cerrado'" })
  }),
  comentario: z.string().trim().optional(),
  autor_id: z.coerce.number().int().positive().optional()
});

export const queryTicketSchema = z.object({
  estado: z.string().trim().optional(),
  prioridad: z.string().trim().optional(),
  area: z.string().trim().optional(),
  agente_id: z.coerce.number().int().positive().optional(),
  cliente_id: z.coerce.number().int().positive().optional(),
  q: z.string().trim().optional(),
  sortBy: z.enum(['fecha_creacion', 'created_at', 'fecha_limite', 'prioridad', 'estado', 'id']).optional().default('fecha_creacion'),
  order: z.enum(['asc', 'desc']).optional().default('desc')
});
