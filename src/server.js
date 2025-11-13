import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import { env } from './config/env.js';
import { sequelize } from './config/db.js';
import { initModels } from './models/index.js';

import { authRouter } from './routes/authRoutes.js';
import { syncRouter } from './routes/syncRoutes.js';
import { metaRouter } from './routes/metaRoutes.js';
import { statsRouter } from './routes/statsRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middlewares base
app.use(cors());
app.use(express.json());

// Archivos estáticos (login, dashboard, scripts, etc.)
app.use(express.static(path.join(__dirname, '..', 'public')));

// Rutas API
app.use('/auth', authRouter);
app.use('/sync', syncRouter);
app.use('/meta', metaRouter);
app.use('/stats', statsRouter);

// Que la raíz sea el login
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
});

const PORT = env.port || 3000;

async function start() {
  try {
    console.log('Inicializando modelos...');
    initModels();

    console.log('Conectando a la base de datos...');
    await sequelize.authenticate();
    await sequelize.sync(); // en desarrollo

    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Error iniciando servidor:', err);
    process.exit(1);
  }
}

start();
