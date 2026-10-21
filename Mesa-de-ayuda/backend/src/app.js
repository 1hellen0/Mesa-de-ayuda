import express from 'express';
import cors from 'cors';
import { config } from './config/environment.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();

// Middlewares base
app.use(cors({
  origin: config.corsOrigin,
  credentials: true
}));
app.use(express.json());

// Endpoint de verificación básica de servicio
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'mesa-de-ayuda-backend' });
});

// Los enrutadores de agentes, clientes, tickets, comentarios y resumen
// se conectarán en la siguiente etapa de implementación.

// Manejador de rutas no encontradas (404)
app.use((req, res) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
});

// Middleware global de errores
app.use(errorHandler);

export default app;
