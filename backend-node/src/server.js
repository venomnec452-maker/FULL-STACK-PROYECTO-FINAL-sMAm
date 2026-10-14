import app from './app.js';
import { connectDB } from './config/database.js';
import { ENV } from './config/env.js';

/**
 * Punto de entrada del servidor Backend Node.js.
 * Conecta primero a la base de datos y luego inicia la escucha de peticiones HTTP.
 */
const startServer = async () => {
  try {
    // 1. Inicializar conexión a la base de datos MongoDB
    await connectDB();

    // 2. Iniciar servidor Express
    const server = app.listen(ENV.PORT, () => {
      console.log('====================================================');
      console.log(`🚀 StockMaster API iniciada en el puerto: ${ENV.PORT}`);
      console.log(`🌐 Modo: [${ENV.NODE_ENV}]`);
      console.log(`🔗 Healthcheck: http://localhost:${ENV.PORT}/api/health`);
      console.log(`📦 Base API:    http://localhost:${ENV.PORT}/api/v1`);
      console.log('====================================================');
    });

    // 3. Manejo de señales de terminación para apagado controlado (Graceful Shutdown)
    const gracefulShutdown = (signal) => {
      console.log(`\n[Server] Señal ${signal} recibida. Cerrando conexiones de forma segura...`);
      server.close(async () => {
        console.log('[Server] Servidor HTTP cerrado.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error(`[Server] Error al iniciar el servidor: ${error.message}`);
    process.exit(1);
  }
};

startServer();
