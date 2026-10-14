import { errorResponse } from '../utils/apiResponse.js';
import { AppError } from '../utils/appError.js';
import { ENV } from '../config/env.js';

/**
 * Middleware centralizado para el manejo de excepciones y errores de la API.
 * Intercepta cualquier error pasado con next(err) y formatea una respuesta HTTP limpia.
 */
export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;

  // 1. Error de clave duplicada en MongoDB (código 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'campo';
    const value = err.keyValue ? err.keyValue[field] : '';
    error = new AppError(`El valor '${value}' para el campo '${field}' ya está registrado`, 409);
  }

  // 2. Error de ID de MongoDB inválido (CastError)
  if (err.name === 'CastError') {
    error = new AppError(`Identificador con formato inválido para el campo: ${err.path}`, 400);
  }

  // 3. Error de validación interna de Mongoose
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    error = new AppError(`Error de validación: ${messages.join('. ')}`, 400, messages);
  }

  // 4. Errores de JWT
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Token de autenticación inválido', 401);
  }
  if (err.name === 'TokenExpiredError') {
    error = new AppError('La sesión o token ha expirado. Por favor inicie sesión nuevamente', 401);
  }

  // Registro del error en consola (en desarrollo muestra el stack trace)
  if (ENV.NODE_ENV === 'development') {
    console.error('[Error Details]:', {
      message: err.message,
      stack: err.stack,
      error,
    });
  }

  return errorResponse(res, {
    message: error.message || 'Error interno del servidor',
    statusCode: error.statusCode || 500,
    errors: error.errors || null,
  });
};
