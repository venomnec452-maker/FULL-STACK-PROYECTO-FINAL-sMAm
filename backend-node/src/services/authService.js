import { User } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';
import { ConflictError, UnauthorizedError, ForbiddenError } from '../utils/appError.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/token.js';

/**
 * Servicio de Negocio: Autenticación, Registro y Auditoría de Accesos.
 */
class AuthService {
  /**
   * Registra un nuevo usuario en la base de datos.
   * Regla de Negocio: El registro público siempre asigna el rol 'operario'.
   */
  async register({ name, email, password, ipAddress = '' }) {
    // 1. Verificar unicidad de correo
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ConflictError(`El correo electrónico '${email}' ya se encuentra registrado`);
    }

    // 2. Crear usuario con rol forzado 'operario' por seguridad
    const user = await User.create({
      name,
      email,
      password,
      role: 'operario',
      status: 'active',
    });

    // 3. Registrar evento en log de auditoría
    await AuditLog.create({
      user: user._id,
      action: 'USER_REGISTER',
      resource: 'Users',
      resourceId: user._id.toString(),
      details: { email: user.email, role: user.role },
      ipAddress,
    });

    // 4. Generar tokens de sesión
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    return { user, accessToken, refreshToken };
  }

  /**
   * Autentica un usuario verificando contraseña en hash y estado activo.
   */
  async login({ email, password, ipAddress = '' }) {
    // 1. Buscar usuario incluyendo explícitamente el campo protegido de password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      throw new UnauthorizedError('Credenciales inválidas. Verifique correo y contraseña');
    }

    // 2. Verificar contraseña con bcrypt
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Credenciales inválidas. Verifique correo y contraseña');
    }

    // 3. Verificar estado de la cuenta
    if (user.status !== 'active') {
      throw new ForbiddenError('Su cuenta se encuentra inactiva o suspendida. Contacte al Administrador');
    }

    // 4. Registrar evento de acceso en auditoría
    await AuditLog.create({
      user: user._id,
      action: 'USER_LOGIN',
      resource: 'Users',
      resourceId: user._id.toString(),
      details: { email: user.email, role: user.role },
      ipAddress,
    });

    // 5. Generar tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Convertir a objeto limpio sin password
    const userJson = user.toJSON();

    return { user: userJson, accessToken, refreshToken };
  }

  /**
   * Renueva el Access Token a partir de un Refresh Token válido.
   */
  async refreshSession(refreshToken) {
    if (!refreshToken) {
      throw new UnauthorizedError('No se proporcionó el token de renovación (Refresh Token)');
    }

    // 1. Verificar firma del refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // 2. Buscar usuario
    const user = await User.findById(decoded.id);
    if (!user || user.status !== 'active') {
      throw new UnauthorizedError('Sesión expirada o usuario no disponible');
    }

    // 3. Emitir nuevo access token y refresh token rotado
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken, user };
  }

  /**
   * Obtiene la información del usuario autenticado en sesión actual.
   */
  async getProfile(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new UnauthorizedError('Usuario no encontrado');
    }
    return user;
  }
}

export const authService = new AuthService();
