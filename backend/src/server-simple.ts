import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { setupDatabase } from './config/database';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';

// Rotas
import { authRoutes } from './routes/auth';
import { analysisRoutes } from './routes/analysis';
import { userRoutes } from './routes/user';
import { reportRoutes } from './routes/reports';
import { adminRoutes } from './routes/admin';
import healthRoutes from './routes/health';

// Configurações
dotenv.config();

const app = express();
const PORT = process.env['PORT'] || 3001;

// Middlewares básicos
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    message: 'TrueCheckIA API - Versão Simplificada',
    version: '1.0.0',
    health: '/health',
  });
});

// Rotas
app.use('/', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);

// Middleware de erro
app.use(errorHandler);

// 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint não encontrado',
    path: req.originalUrl,
  });
});

// Inicialização
async function startServer() {
  try {
    logger.info('🚀 Iniciando TrueCheckIA Server (Versão Simplificada)...');

    // Configurar banco
    await setupDatabase();
    logger.info('✅ Banco de dados conectado');

    app.listen(PORT, () => {
      logger.info(`🌟 Servidor rodando na porta ${PORT}`);
      logger.info(`🏥 Health check: http://localhost:${PORT}/health`);
      logger.info(`📱 Frontend deve apontar para: http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

startServer();

export default app;
