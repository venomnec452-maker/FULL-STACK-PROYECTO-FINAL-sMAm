import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { registerSchema, loginSchema } from '../validators/authValidator.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Registro público de usuarios (rol 'operario' obligatorio por defecto)
 * @access  Público
 */
router.post('/register', validateRequest(registerSchema), authController.register);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Iniciar sesión con correo y contraseña
 * @access  Público
 */
router.post('/login', validateRequest(loginSchema), authController.login);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Renovar el Access Token mediante cookie HttpOnly de Refresh Token
 * @access  Público (con cookie válida)
 */
router.post('/refresh', authController.refresh);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Cerrar sesión y limpiar cookies de sesión
 * @access  Público
 */
router.post('/logout', authController.logout);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Obtener el perfil del usuario autenticado actual
 * @access  Privado (requiere Bearer token)
 */
router.get('/me', authenticate, authController.getMe);

export default router;
