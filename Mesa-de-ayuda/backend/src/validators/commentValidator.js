import { z } from 'zod';

export const createCommentSchema = z.object({
  autor_tipo: z.enum(['agente', 'cliente'], {
    errorMap: () => ({ message: "El autor_tipo debe ser 'agente' o 'cliente'" })
  }),
  autor_id: z.coerce.number().int().positive({ message: 'autor_id debe ser un entero positivo' }),
  contenido: z.string().trim().min(1, { message: 'El contenido del comentario no puede estar vacío' })
});
