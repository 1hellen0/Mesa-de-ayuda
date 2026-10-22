import { z } from 'zod';

export const agentIdParamSchema = z.object({
  id: z.coerce.number().int().positive({ message: 'El ID debe ser un número entero positivo' })
});

export const createAgentSchema = z.object({
  nombre: z.string().trim().min(2, { message: 'El nombre debe tener al menos 2 caracteres' }),
  email: z.string().trim().email({ message: 'El correo electrónico no es válido' }),
  area: z.string().trim().min(2, { message: 'El área debe tener al menos 2 caracteres' }),
  activo: z.coerce.number().int().refine((val) => val === 0 || val === 1, {
    message: 'El campo activo debe ser 0 (inactivo) o 1 (activo)'
  }).default(1)
});

export const updateAgentSchema = z.object({
  nombre: z.string().trim().min(2).optional(),
  email: z.string().trim().email().optional(),
  area: z.string().trim().min(2).optional(),
  activo: z.coerce.number().int().refine((val) => val === 0 || val === 1, {
    message: 'El campo activo debe ser 0 o 1'
  }).optional()
}).refine((data) => Object.keys(data).length > 0, {
  message: 'Debe proporcionar al menos un campo para actualizar'
});
