import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar .env desde la raíz de backend
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = Object.freeze({
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databasePath: process.env.DATABASE_PATH || path.resolve(__dirname, '../../database/mesa.db'),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173'
});
