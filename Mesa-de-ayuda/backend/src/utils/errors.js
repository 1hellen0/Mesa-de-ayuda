/**
 * Clases de Error Personalizadas para la API REST
 * Mapean a los códigos HTTP 400, 404 y 409.
 */

export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Solicitud o datos inválidos') {
    super(message, 400);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Recurso no encontrado') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflicto con regla de negocio o integridad') {
    super(message, 409);
  }
}
