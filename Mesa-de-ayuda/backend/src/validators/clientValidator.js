import { z } from 'zod';

export const clientIdParamSchema = z.object({
  id: z.coerce.number().int().positive({ message: 'El ID debe ser un número entero positivo' })
});

export const createClientSchema = z.object({
  nombre: z.string().trim().min(2, { message: 'El nombre debe tener al menos 2 caracteres' }),
  email: z.string().trim().email({ message: 'El correo electrónico no es válido' }),
  telefono: z.string().trim().optional().nullable(),
  empresa: z.string().trim().optional().nullable()
});

export const updateClientSchema = z.object({
  nombre: z.string().trim().min(2).optional(),
  email: z.string().trim().email().optional(),
  telefono: z.string().trim().optional().nullable(),
  empresa: z.string().trim().optional().nullable()
}).refine((data) => Object.keys(data).length > 0, {
  message: 'Debe proporcionar al menos un campo para actualizar'
});
