import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { ENV } from './config/env.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFoundHandler } from './middlewares/notFoundHandler.js';
import { successResponse } from './utils/apiResponse.js';

import authRoutes from './routes/authRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import supplierRoutes from './routes/supplierRoutes.js';
import productRoutes from './routes/productRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import reportRoutes from './routes/reportRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 1. Seguridad: Cabeceras HTTP con Helmet
app.use(helmet());

// 2. Seguridad: CORS permisivo para desarrollo y controlado para producción
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:5173',
  ENV.CORS_ORIGIN,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir peticiones sin origen (Postman, curl) o de cualquier puerto local en desarrollo
      if (!origin || allowedOrigins.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Bloqueado por política CORS: origen '${origin}' no autorizado`));
    },
    credentials: true, // Permite intercambio de cookies HttpOnly con React
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Idempotency-Key', 'x-internal-api-key'],
  })
);

// 3. Rate Limiter: Protección contra ataques de fuerza bruta y saturación
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 300, // Máximo 300 peticiones por IP en la ventana
  message: {
    success: false,
    message: 'Demasiadas solicitudes desde esta dirección IP. Por favor intente más tarde.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// 4. Parseo de cuerpo de solicitudes y cookies
app.use(express.json({ limit: '10kb' })); // Previene ataques de denegación de servicio por payloads gigantes
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// 5. Registro de solicitudes HTTP en consola (solo en desarrollo)
if (ENV.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// 6. Endpoint de verificación de estado (Healthcheck)
app.get('/api/health', (req, res) => {
  return successResponse(res, {
    message: 'StockMaster Backend API operativa y saludable',
    data: {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: ENV.NODE_ENV,
      version: '1.0.0',
    },
  });
});

// 7. Montaje de rutas base /api/v1
app.get('/api/v1', (req, res) => {
  return successResponse(res, {
    message: 'StockMaster Core API RESTful v1',
    data: {
      documentation: '/api/v1/docs',
      specification: '/api/v1/docs/spec',
      modules: ['auth', 'products', 'categories', 'suppliers', 'inventory', 'reports'],
    },
  });
});

// Endpoint para entregar el archivo OpenAPI YAML
app.get('/api/v1/docs/spec', (req, res) => {
  const specPath = path.resolve(__dirname, '../../docs/api-spec.yaml');
  if (fs.existsSync(specPath)) {
    res.setHeader('Content-Type', 'text/yaml; charset=utf-8');
    return res.sendFile(specPath);
  }
  return res.status(404).json({ success: false, message: 'Especificación no encontrada en el servidor' });
});

// Interfaz interactiva de Swagger UI
app.get('/api/v1/docs', (req, res) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self' 'unsafe-inline' https://unpkg.com https://cdn.jsdelivr.net data:; img-src 'self' data: https:;"
  );
  res.send(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>StockMaster API - Documentación Swagger UI</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%234F46E5'><path d='M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'/></svg>" />
</head>
<body style="margin: 0; background: #fafafa;">
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.onload = function() {
      SwaggerUIBundle({
        url: '/api/v1/docs/spec',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout"
      });
    };
  </script>
</body>
</html>`);
});

// Rutas de la API v1
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/suppliers', supplierRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/reports', reportRoutes);

// 8. Manejadores de rutas no encontradas y errores
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
