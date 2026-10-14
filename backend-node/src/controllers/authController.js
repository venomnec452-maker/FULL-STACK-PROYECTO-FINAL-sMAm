import { authService } from '../services/authService.js';
import { successResponse } from '../utils/apiResponse.js';
import { setRefreshTokenCookie, clearRefreshTokenCookie } from '../utils/token.js';

/**
 * Controlador de Autenticación HTTP.
 * Conecta los endpoints de la API con la lógica de negocio del AuthService.
 */
class AuthController {
  async register(req, res, next) {
    try {
      const { name, email, password } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;

      const { user, accessToken, refreshToken } = await authService.register({
        name,
        email,
        password,
        ipAddress,
      });

      // Guardar refresh token en cookie segura HttpOnly
      setRefreshTokenCookie(res, refreshToken);

      return successResponse(res, {
        statusCode: 201,
        message: 'Usuario registrado exitosamente',
        data: {
          user,
          accessToken,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;

      const { user, accessToken, refreshToken } = await authService.login({
        email,
        password,
        ipAddress,
      });

      // Guardar refresh token en cookie segura HttpOnly
      setRefreshTokenCookie(res, refreshToken);

      return successResponse(res, {
        statusCode: 200,
        message: 'Inicio de sesión exitoso',
        data: {
          user,
          accessToken,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async refresh(req, res, next) {
    try {
      // Intentar obtener el token de la cookie HttpOnly o del cuerpo de la petición
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

      const { accessToken, refreshToken: newRefreshToken, user } =
        await authService.refreshSession(refreshToken);

      setRefreshTokenCookie(res, newRefreshToken);

      return successResponse(res, {
        statusCode: 200,
        message: 'Token de acceso renovado exitosamente',
        data: {
          user,
          accessToken,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async logout(req, res, next) {
    try {
      clearRefreshTokenCookie(res);

      return successResponse(res, {
        statusCode: 200,
        message: 'Sesión finalizada exitosamente',
      });
    } catch (err) {
      next(err);
    }
  }

  async getMe(req, res, next) {
    try {
      // req.user ya fue adjuntado por el middleware authenticate
      return successResponse(res, {
        statusCode: 200,
        message: 'Perfil de usuario obtenido exitosamente',
        data: {
          user: req.user,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
