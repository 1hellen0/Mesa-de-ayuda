/**
 * Middleware Centralizado de Manejo de Errores REST
 * Asegura el formato requerido: { "error": "mensaje" }
 * Cumple con los códigos HTTP 400, 404, 409 y 500.
 */

export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Error interno del servidor';

  // Si es error de parseo de JSON en body
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Cuerpo de la petición contiene JSON mal formado' });
  }

  // Registrar errores no controlados en consola
  if (statusCode === 500) {
    console.error('[500 Internal Server Error]:', err);
  }

  return res.status(statusCode).json({
    error: message
  });
}
