import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';

/**
 * Genera un Access Token JWT de corta duración (ej. 1 hora).
 * Contiene únicamente información pública no sensible del usuario.
 */
export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
    },
    ENV.JWT_SECRET,
    { expiresIn: ENV.JWT_EXPIRES_IN }
  );
};

/**
 * Genera un Refresh Token JWT de larga duración (ej. 7 días).
 */
export const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
    },
    ENV.JWT_REFRESH_SECRET,
    { expiresIn: ENV.JWT_REFRESH_EXPIRES_IN }
  );
};

/**
 * Verifica y decodifica un Access Token.
 */
export const verifyAccessToken = (token) => {
  return jwt.verify(token, ENV.JWT_SECRET);
};

/**
 * Verifica y decodifica un Refresh Token.
 */
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, ENV.JWT_REFRESH_SECRET);
};

/**
 * Configura la cookie HttpOnly para el Refresh Token en la respuesta HTTP.
 * Impide acceso por JavaScript (protección contra ataques XSS).
 */
export const setRefreshTokenCookie = (res, refreshToken) => {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: ENV.NODE_ENV === 'production', // true solo en HTTPS en producción
    sameSite: 'lax', // Protección adecuada contra CSRF
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días en milisegundos
    path: '/api/v1/auth', // Limita la cookie únicamente a los endpoints de auth
  });
};

/**
 * Limpia la cookie del Refresh Token al cerrar sesión.
 */
export const clearRefreshTokenCookie = (res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: ENV.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/v1/auth',
  });
};
