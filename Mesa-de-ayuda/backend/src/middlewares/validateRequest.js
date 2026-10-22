/**
 * Middleware para Validación de Peticiones con Zod
 * Valida body, query o params y devuelve { "error": "mensaje comprensible" } con status 400.
 */

export function validateRequest({ body, query, params }) {
  return (req, res, next) => {
    try {
      if (body) {
        req.body = body.parse(req.body);
      }
      if (query) {
        req.query = query.parse(req.query);
      }
      if (params) {
        req.params = params.parse(req.params);
      }
      next();
    } catch (err) {
      if (err.errors && Array.isArray(err.errors)) {
        const firstError = err.errors[0];
        const field = firstError.path.join('.') || 'campo';
        const message = `Validación fallida en '${field}': ${firstError.message}`;
        return res.status(400).json({ error: message });
      }
      return res.status(400).json({ error: 'Parámetros o datos de entrada inválidos' });
    }
  };
}
