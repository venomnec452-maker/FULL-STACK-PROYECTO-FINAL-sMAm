import mongoose from 'mongoose';
import { ENV } from './env.js';

/**
 * Conecta a la base de datos MongoDB utilizando Mongoose.
 * Aplica buenas prácticas de configuración para entornos de producción y desarrollo.
 */
export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(ENV.MONGO_URI, {
      autoIndex: true, // Crea índices automáticamente en desarrollo
    });

    console.log(`[MongoDB] Conectado exitosamente: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB] Error crítico de conexión: ${error.message}`);
    process.exit(1); // Finaliza el proceso si la base de datos no está disponible
  }
};

// Eventos del ciclo de vida de la conexión Mongoose
mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB] Conexión perdida. Intentando reconectar...');
});

mongoose.connection.on('error', (err) => {
  console.error(`[MongoDB] Error en el bus de eventos: ${err.message}`);
});
