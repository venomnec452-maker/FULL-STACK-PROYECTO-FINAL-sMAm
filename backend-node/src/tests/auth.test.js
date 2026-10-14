import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import { connectDB } from '../config/database.js';
import { User } from '../models/User.js';

describe('Módulo de Autenticación y Control de Acceso (Auth & RBAC)', () => {
  const testUser = {
    name: 'Juan Perez',
    email: `test_juan_${Date.now()}@stockmaster.com`,
    password: 'Password123!',
  };

  let operarioToken = '';
  let refreshTokenCookie = '';

  before(async () => {
    // Asegurar conexión a base de datos para pruebas
    if (mongoose.connection.readyState === 0) {
      await connectDB();
    }
  });

  after(async () => {
    // Limpieza de datos de prueba creados
    await User.deleteOne({ email: testUser.email });
    await mongoose.connection.close();
  });

  // ---------------------------------------------------------------------------
  // 1. Registro de Usuarios
  // ---------------------------------------------------------------------------
  test('POST /api/v1/auth/register - Registra nuevo usuario con rol operario por defecto', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser);

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.user.email, testUser.email.toLowerCase());
    assert.strictEqual(res.body.data.user.role, 'operario');
    assert.ok(res.body.data.accessToken);
    assert.strictEqual(res.body.data.user.password, undefined); // La contraseña NUNCA debe exponerse
  });

  test('POST /api/v1/auth/register - Rechaza registrar usuario con email duplicado (409 Conflict)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser);

    assert.strictEqual(res.status, 409);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /ya se encuentra registrado/);
  });

  test('POST /api/v1/auth/register - Impide que el registro público se autoasigne rol de admin (400 Bad Request)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Hacker Intent',
        email: `hacker_${Date.now()}@test.com`,
        password: 'Password123!',
        role: 'admin',
      });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
  });

  // ---------------------------------------------------------------------------
  // 2. Inicio de Sesión (Login)
  // ---------------------------------------------------------------------------
  test('POST /api/v1/auth/login - Inicia sesión exitosamente y emite Access Token y Cookie Refresh', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.accessToken);
    operarioToken = res.body.data.accessToken;

    // Verificar presencia de la cabecera Set-Cookie con HttpOnly
    const cookies = res.headers['set-cookie'];
    assert.ok(cookies);
    const hasRefreshToken = cookies.some((c) => c.includes('refreshToken=') && c.includes('HttpOnly'));
    assert.strictEqual(hasRefreshToken, true);

    refreshTokenCookie = cookies.find((c) => c.startsWith('refreshToken='));
  });

  test('POST /api/v1/auth/login - Rechaza login con contraseña equivocada (401 Unauthorized)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: 'PasswordIncorrecta999!',
      });

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /Credenciales inválidas/);
  });

  // ---------------------------------------------------------------------------
  // 3. Perfil Protegido (/auth/me)
  // ---------------------------------------------------------------------------
  test('GET /api/v1/auth/me - Accede al perfil con Bearer token válido', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${operarioToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.user.email, testUser.email.toLowerCase());
  });

  test('GET /api/v1/auth/me - Rechaza acceso sin token (401 Unauthorized)', async () => {
    const res = await request(app).get('/api/v1/auth/me');

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
  });

  test('GET /api/v1/auth/me - Rechaza acceso con token manipulado (401 Unauthorized)', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer token_invalido_falso_123');

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
  });

  // ---------------------------------------------------------------------------
  // 4. Renovación de Token (Refresh Token) y Cierre de Sesión (Logout)
  // ---------------------------------------------------------------------------
  test('POST /api/v1/auth/refresh - Renueva access token con cookie HttpOnly válida', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', [refreshTokenCookie]);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.accessToken);
  });

  test('POST /api/v1/auth/logout - Limpia cookie de sesión y responde 200 OK', async () => {
    const res = await request(app).post('/api/v1/auth/logout');

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
  });
});
