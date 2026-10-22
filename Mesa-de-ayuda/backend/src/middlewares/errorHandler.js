/**
 * Middleware Centralizado de Manejo de Errores REST
 * Asegura el formato requerido: { "error": "mensaje comprensible" }
 * Cumple con los códigos HTTP 400, 404, 409 y 500.
 */

import { AppError } from '../utils/errors.js';

export function errorHandler(err, req, res, next) {
  // 1. Error de parseo de JSON en el cuerpo de la solicitud (400)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Cuerpo de la petición contiene JSON mal formado' });
  }

  // 2. Errores controlados de dominio y negocio (AppError: 400, 404, 409)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // 3. Errores nativos de restricciones de SQLite
  if (err && typeof err.message === 'string') {
    // Violación de unicidad (UNIQUE constraint failed: agentes.email) -> 409 Conflict
    if (err.message.includes('UNIQUE constraint failed')) {
      const match = err.message.match(/UNIQUE constraint failed: \w+\.(\w+)/);
      const field = match ? match[1] : 'campo';
      return res.status(409).json({ error: `Conflicto: El valor del campo '${field}' ya se encuentra registrado` });
    }

    // Violación de clave foránea (FOREIGN KEY constraint failed)
    if (err.message.includes('FOREIGN KEY constraint failed')) {
      if (req.method === 'DELETE') {
        return res.status(409).json({
          error: 'No se puede eliminar el registro porque tiene datos históricos asociados que preservan la trazabilidad'
        });
      }
      return res.status(409).json({
        error: 'El recurso relacionado especificado no existe o no es válido'
      });
    }

    // Violación de restricción CHECK (CHECK constraint failed) -> 400 Bad Request
    if (err.message.includes('CHECK constraint failed')) {
      return res.status(400).json({
        error: 'Los datos enviados violan una restricción de validación del sistema'
      });
    }
  }

  // 4. Errores no controlados (500)
  console.error('[500 Internal Server Error]:', err);
  return res.status(500).json({
    error: 'Error interno del servidor'
  });
}
