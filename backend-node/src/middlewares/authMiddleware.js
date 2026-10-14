import { UnauthorizedError, ForbiddenError } from '../utils/appError.js';
import { verifyAccessToken } from '../utils/token.js';
import { User } from '../models/User.js';
import { ENV } from '../config/env.js';

/**
 * Middleware para autenticar usuarios mediante JWT (Access Token).
 * Espera el token en la cabecera 'Authorization: Bearer <token>'
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Acceso no autorizado. Debe proporcionar un Bearer token');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    // Buscar el usuario en la base de datos para verificar que aún existe y está activo
    const user = await User.findById(decoded.id);

    if (!user) {
      throw new UnauthorizedError('El usuario asociado a este token ya no existe');
    }

    if (user.status !== 'active') {
      throw new ForbiddenError('Su cuenta de usuario se encuentra inactiva o suspendida');
    }

    // Adjuntar usuario autenticado a la petición
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Middleware de autorización basado en roles (Role-Based Access Control - RBAC).
 *
 * @param  {...string} roles - Roles permitidos para acceder a la ruta (ej. 'admin', 'operario')
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('Usuario no autenticado'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Acceso denegado: se requiere uno de los siguientes roles [${roles.join(', ')}]. Su rol actual es '${req.user.role}'`
        )
      );
    }

    next();
  };
};

/**
 * Middleware de seguridad para la comunicación Máquina-a-Máquina (M2M)
 * entre el servicio de Laravel y Node.js.
 */
export const verifyInternalApiKey = (req, res, next) => {
  const apiKey = req.headers['x-internal-api-key'];

  if (!apiKey || apiKey !== ENV.INTERNAL_API_KEY) {
    return next(new UnauthorizedError('Acceso denegado: API Key interna inválida o ausente'));
  }

  next();
};

/**
 * Middleware híbrido: Permite autenticación de usuario (JWT) O autenticación
 * Máquina-a-Máquina mediante API Key interna (usado por el servicio Laravel).
 */
export const authenticateOrM2M = async (req, res, next) => {
  const internalApiKey = req.headers['x-internal-api-key'];

  if (internalApiKey && internalApiKey === ENV.INTERNAL_API_KEY) {
    // Si viene autenticado por API Key interna, asignamos el usuario Administrador del sistema
    const systemAdmin = await User.findOne({ role: 'admin' });
    if (systemAdmin) {
      req.user = systemAdmin;
    }
    return next();
  }

  // De lo contrario, procede con la autenticación estándar de usuario JWT
  return authenticate(req, res, next);
};
