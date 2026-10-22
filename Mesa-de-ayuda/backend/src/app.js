import express from 'express';
import cors from 'cors';
import { config } from './config/environment.js';
import { errorHandler } from './middlewares/errorHandler.js';

import agentRoutes from './routes/agentRoutes.js';
import clientRoutes from './routes/clientRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import summaryRoutes from './routes/summaryRoutes.js';

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

// Enrutadores principales de la API REST
app.use('/api/agentes', agentRoutes);
app.use('/api/clientes', clientRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api', summaryRoutes);

// Manejador de rutas no encontradas (404)
app.use((req, res) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
});

// Middleware global de errores
app.use(errorHandler);

export default app;
