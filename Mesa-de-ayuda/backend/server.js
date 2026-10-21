import app from './src/app.js';
import { config } from './src/config/environment.js';

const server = app.listen(config.port, () => {
  console.log(`[Servidor Backend] Activo y escuchando en http://localhost:${config.port}`);
  console.log(`[Entorno] ${config.nodeEnv}`);
});

export default server;
