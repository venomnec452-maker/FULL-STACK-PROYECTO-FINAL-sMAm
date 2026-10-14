import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import { connectDB } from '../config/database.js';
import { Product, Category, Supplier, StockMovement, AuditLog, User } from '../models/index.js';
import { ENV } from '../config/env.js';

describe('Módulo de Catálogo e Inventario Transaccional (Products & Inventory Engine)', () => {
  let adminToken = '';
  let operarioToken = '';
  let createdCategoryId = '';
  let createdSupplierId = '';
  let createdProductId = '';
  const testSku = `SKU-TEST-${Date.now()}`;

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await connectDB();
    }

    // 1. Obtener token de Administrador
    const adminLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'admin@stockmaster.com',
      password: 'Admin1234!',
    });
    adminToken = adminLogin.body.data.accessToken;

    // 2. Obtener token de Operario
    const operarioLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'operario@stockmaster.com',
      password: 'Operario1234!',
    });
    operarioToken = operarioLogin.body.data.accessToken;
  });

  after(async () => {
    // Limpieza de datos de prueba
    if (createdProductId) {
      await Product.findByIdAndDelete(createdProductId);
      await StockMovement.deleteMany({ product: createdProductId });
    }
    if (createdCategoryId) {
      await Category.findByIdAndDelete(createdCategoryId);
    }
    if (createdSupplierId) {
      await Supplier.findByIdAndDelete(createdSupplierId);
    }
    await mongoose.connection.close();
  });

  // ---------------------------------------------------------------------------
  // 1. Categorías y Proveedores
  // ---------------------------------------------------------------------------
  test('POST /api/v1/categories - Admin puede crear una categoría', async () => {
    const res = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `Categoria Test ${Date.now()}`,
        description: 'Categoría para pruebas de integración',
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    createdCategoryId = res.body.data._id;
  });

  test('POST /api/v1/categories - Operario es rechazado con 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${operarioToken}`)
      .send({
        name: 'Categoria Ilegal',
      });

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.success, false);
  });

  test('POST /api/v1/suppliers - Admin puede registrar un proveedor', async () => {
    const res = await request(app)
      .post('/api/v1/suppliers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `Proveedor Test ${Date.now()}`,
        taxId: '30-99999999-1',
        phone: '12345678',
        email: 'proveedor@test.com',
        address: 'Calle Falsa 123',
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    createdSupplierId = res.body.data._id;
  });

  // ---------------------------------------------------------------------------
  // 2. Gestión de Productos y Reglas de Integridad
  // ---------------------------------------------------------------------------
  test('POST /api/v1/products - Admin crea un producto con stock inicial en 0', async () => {
    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Taladro Percutor 750W',
        description: 'Herramienta industrial para pruebas de stock',
        sku: testSku,
        category: createdCategoryId,
        unit: 'unidad',
        costPrice: 50.0,
        salePrice: 90.0,
        minStock: 10,
        location: 'Pasillo 2, Estante C',
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.currentStock, 0); // Regla: Stock nace en 0
    createdProductId = res.body.data._id;
  });

  test('POST /api/v1/products - Rechaza SKU duplicado con 409 Conflict', async () => {
    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Otro Taladro Duplicado',
        sku: testSku,
        category: createdCategoryId,
        costPrice: 50,
        salePrice: 90,
      });

    assert.strictEqual(res.status, 409);
    assert.strictEqual(res.body.success, false);
  });

  test('PATCH /api/v1/products/:id - Bloquea la edición arbitraria directa de stock (400 Bad Request)', async () => {
    const res = await request(app)
      .patch(`/api/v1/products/${createdProductId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Taladro Percutor Modificado',
        currentStock: 999, // Intento ilegal de cambiar stock sin movimiento
      });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.match(JSON.stringify(res.body.errors), /No está permitido modificar el stock directamente/);
  });

  // ---------------------------------------------------------------------------
  // 3. Motor de Inventario: Entradas, Salidas y Ajustes
  // ---------------------------------------------------------------------------
  test('POST /api/v1/inventory/entries - Registra entrada de 50 unidades e incrementa existencias', async () => {
    const res = await request(app)
      .post('/api/v1/inventory/entries')
      .set('Authorization', `Bearer ${operarioToken}`)
      .send({
        product: createdProductId,
        quantity: 50,
        supplier: createdSupplierId,
        documentReference: 'Remito R-00123',
        reason: 'Recepción de compra inicial de lote',
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.product.currentStock, 50);
    assert.strictEqual(res.body.data.movement.previousStock, 0);
    assert.strictEqual(res.body.data.movement.subsequentStock, 50);
  });

  test('POST /api/v1/inventory/entries - Soporta llamadas M2M de Laravel con internal-api-key', async () => {
    const res = await request(app)
      .post('/api/v1/inventory/entries')
      .set('x-internal-api-key', ENV.INTERNAL_API_KEY)
      .send({
        product: createdProductId,
        quantity: 20,
        supplier: createdSupplierId,
        documentReference: 'OrdenCompra-Laravel-405',
        reason: 'Recepción aprobada en servicio de Compras Laravel',
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.product.currentStock, 70); // 50 + 20 = 70
  });

  test('POST /api/v1/inventory/exits - Registra salida de 30 unidades y decrementa existencias', async () => {
    const res = await request(app)
      .post('/api/v1/inventory/exits')
      .set('Authorization', `Bearer ${operarioToken}`)
      .send({
        product: createdProductId,
        quantity: 30,
        documentReference: 'Factura F-0098',
        reason: 'Despacho para cliente corporativo',
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.product.currentStock, 40); // 70 - 30 = 40
    assert.strictEqual(res.body.data.movement.previousStock, 70);
    assert.strictEqual(res.body.data.movement.subsequentStock, 40);
  });

  test('POST /api/v1/inventory/exits - Previene stock negativo si la salida supera disponible (400 Bad Request)', async () => {
    const res = await request(app)
      .post('/api/v1/inventory/exits')
      .set('Authorization', `Bearer ${operarioToken}`)
      .send({
        product: createdProductId,
        quantity: 999, // Supera las 40 unidades disponibles
        reason: 'Intento de salida en exceso',
      });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /Stock insuficiente/);
  });

  test('POST /api/v1/inventory/adjustments - Admin realiza ajuste físico auditado', async () => {
    const res = await request(app)
      .post('/api/v1/inventory/adjustments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        product: createdProductId,
        newStock: 8, // Se ajusta a 8 unidades (por debajo del minStock de 10)
        reason: 'Inventario físico trimestral: merma por rotura de embalaje',
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.product.currentStock, 8);
    assert.strictEqual(res.body.data.movement.type, 'adjustment');
  });

  // ---------------------------------------------------------------------------
  // 4. Alertas de Stock Bajo y Reportes
  // ---------------------------------------------------------------------------
  test('GET /api/v1/inventory/low-stock - Detecta producto con stock crítico (<= minStock)', async () => {
    const res = await request(app)
      .get('/api/v1/inventory/low-stock')
      .set('Authorization', `Bearer ${operarioToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    const found = res.body.data.some((p) => p.sku === testSku);
    assert.strictEqual(found, true); // El producto tiene 8 unidades y minStock es 10
  });

  test('DELETE /api/v1/products/:id - Desactiva lógicamente producto con movimientos históricos para preservar trazabilidad', async () => {
    const res = await request(app)
      .delete(`/api/v1/products/${createdProductId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.softDeleted, true);
    assert.strictEqual(res.body.data.product.status, 'inactive');
  });

  test('GET /api/v1/reports/dashboard - Retorna KPIs, valorización y datos para gráficos', async () => {
    const res = await request(app)
      .get('/api/v1/reports/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.summary);
    assert.ok(res.body.data.recentMovements);
    assert.ok(Array.isArray(res.body.data.stockByCategory));
  });
});
