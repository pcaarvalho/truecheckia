import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { setupDatabase } from './config/database';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';

// Rotas essenciais
import { authRoutes } from './routes/auth';
import { analysisRoutes } from './routes/analysis';
import { userRoutes } from './routes/user';
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

// Headers de segurança básica
app.use((req, res, next) => {
  res.header('X-Powered-By', 'TrueCheckIA');
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  next();
});

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    message: 'TrueCheckIA MVP - Funcionando!',
    version: '1.0.0',
    status: 'ready',
    features: ['auth', 'text-analysis', 'history'],
    health: '/health',
  });
});

// Rotas essenciais
app.use('/', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/user', userRoutes);

// Middleware de erro
app.use(errorHandler);

// 404
app.use('*', (req, res) => {
  logger.warn(`Rota não encontrada: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Endpoint não encontrado',
    path: req.originalUrl,
    suggestion: 'Verifique a documentação da API',
  });
});

// Inicialização
async function startServer() {
  try {
    logger.info('🚀 Iniciando TrueCheckIA MVP...');

    // Configurar banco
    await setupDatabase();
    logger.info('✅ Banco de dados conectado');

    app.listen(PORT, () => {
      logger.info(`🌟 TrueCheckIA MVP rodando na porta ${PORT}`);
      logger.info(`🏥 Health check: http://localhost:${PORT}/health`);
      logger.info(`🎯 Frontend deve apontar para: http://localhost:${PORT}`);
      logger.info(`📱 Funcionalidades ativas: Login, Análise de Texto, Histórico`);
      console.log('\n=== TRUECHECKIA MVP READY ===');
      console.log(`✅ Backend: http://localhost:${PORT}`);
      console.log(`✅ Health: http://localhost:${PORT}/health`);
      console.log(`✅ Status: FUNCIONANDO`);
      console.log('===============================\n');
    });
  } catch (error) {
    logger.error('❌ Erro ao iniciar servidor MVP:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('Recebido SIGTERM, encerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('Recebido SIGINT, encerrando servidor...');
  process.exit(0);
});

startServer();

export default app;
