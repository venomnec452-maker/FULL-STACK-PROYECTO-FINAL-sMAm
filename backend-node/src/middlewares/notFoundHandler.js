import { NotFoundError } from '../utils/appError.js';

/**
 * Middleware para rutas no encontradas (404).
 * Captura cualquier solicitud a endpoints inexistentes y la redirige al errorHandler.
 */
export const notFoundHandler = (req, res, next) => {
  next(new NotFoundError(`Ruta no encontrada: [${req.method}] ${req.originalUrl}`));
};
