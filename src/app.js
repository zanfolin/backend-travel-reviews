import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import apiRoutes from './routes/index.js';
import { notFoundHandler, errorHandler } from './middlewares/error.middleware.js';
import { UPLOADS_FOLDER } from './config/upload.js';

dotenv.config();

const app = express();

// Middlewares globais
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(cors());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Arquivos estáticos (Uploads de imagens)
app.use('/uploads', express.static(UPLOADS_FOLDER));

// Rotas da API
app.use('/api', apiRoutes);

// Raiz da API
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'AccessTrip Backend API',
    version: '1.0.0',
    description: 'Plataforma de turismo acessível para viajantes e estabelecimentos',
    documentation: '/api/health'
  });
});

// Middleware 404 e Tratamento Global de Erros
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
