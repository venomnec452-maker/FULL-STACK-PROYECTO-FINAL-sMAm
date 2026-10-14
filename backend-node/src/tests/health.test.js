import { test, describe } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../app.js';

describe('API Smoke & Healthcheck Tests', () => {
  test('GET /api/health debe responder 200 OK y estado saludable', async () => {
    const res = await request(app).get('/api/health');

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.message, 'StockMaster Backend API operativa y saludable');
    assert.ok(res.body.data.timestamp);
    assert.strictEqual(res.body.data.version, '1.0.0');
  });

  test('GET /api/v1 debe responder 200 con la lista de módulos disponibles', async () => {
    const res = await request(app).get('/api/v1');

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data.modules));
  });

  test('GET /ruta-inexistente debe responder 404 Not Found con mensaje estructurado', async () => {
    const res = await request(app).get('/api/ruta-que-no-existe');

    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /Ruta no encontrada/);
  });
});
