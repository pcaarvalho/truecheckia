import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';
import { Request, Response, NextFunction } from 'express';

// Configurações
dotenv.config();

// Middlewares e utilitários
import { errorHandler } from './middleware/errorHandler';
import { smartAuthLimiter as authLimiter, smartApiLimiter as apiLimiter } from './middleware/rateLimiter';
import { logger } from './utils/logger';
import { env } from './config/env';
import { 
  helmetConfig, 
  apiRateLimit, 
  sanitizeInput, 
  securityHeaders, 
  securityLogger,
  detectAttacks 
} from './middleware/security';

// Configurações de banco e serviços
import { setupDatabase } from './config/database';
import { setupRedis } from './config/redis';
import { setupMinIO } from './config/minio';
import { setupSwagger } from './config/swagger';

// Rotas
import { authRoutes } from './routes/auth';
import { analysisRoutes } from './routes/analysis';
import { userRoutes } from './routes/user';
import { reportRoutes } from './routes/reports';
import { adminRoutes } from './routes/admin';
import healthRoutes from './routes/health';
import plansRoutes from './routes/plans';

// Configuração Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TrueCheckIA API',
      version: '1.0.0',
      description: 'API para detecção de conteúdo gerado por IA',
      contact: {
        name: 'TrueCheckIA Team',
        email: 'support@truecheckia.com'
      }
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}`,
        description: 'Servidor de desenvolvimento'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./src/routes/*.ts', './src/middleware/*.ts']
};

const specs = swaggerJsdoc(swaggerOptions);

class Server {
  private app: express.Application;
  private server: http.Server;
  private io: SocketIOServer;

  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = new SocketIOServer(this.server, {
  cors: {
        origin: process.env['FRONTEND_URL'] || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });
  }

  async initialize(): Promise<void> {
    try {
      logger.info('🚀 Iniciando TrueCheckIA Server...');

      // Inicializa serviços externos
      await this.initializeServices();

      // Configura middleware
      this.setupMiddleware();

      // Configura rotas
      this.setupRoutes();

      // Configura WebSocket
      this.setupWebSocket();

      // Configura tratamento de erros
      this.setupErrorHandling();

      // Configura graceful shutdown
      this.setupGracefulShutdown();

      logger.info('✅ Servidor configurado com sucesso');
    } catch (error) {
      logger.error('❌ Erro ao inicializar servidor:', error);
      throw error;
    }
  }

  private async initializeServices(): Promise<void> {
    try {
      // Inicializa Redis (se disponível)
      try {
        await setupRedis();
        logger.info('✅ Redis conectado');
      } catch (error) {
        logger.warn('⚠️ Redis não disponível, usando cache em memória:', error);
      }

      // Inicializa MinIO
      await setupMinIO();
      logger.info('✅ MinIO conectado');

    } catch (error) {
      logger.error('❌ Erro ao inicializar serviços:', error);
      // Continua mesmo com falha nos serviços externos
    }
  }

  private setupMiddleware(): void {
    // Trust proxy (importante para rate limiting e logs)
    this.app.set('trust proxy', 1);

    // Segurança
    this.app.use(helmetConfig);
    this.app.use(securityHeaders);
    this.app.use(detectAttacks);
    this.app.use(securityLogger);

    // CORS
    this.app.use(cors({
      origin: (origin, callback) => {
        const allowedOrigins = [
          'http://localhost:3000',
          'http://localhost:5173',
          process.env['FRONTEND_URL']
        ].filter(Boolean);

        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          logger.warn(`CORS bloqueado para origem: ${origin}`);
          callback(new Error('Não permitido pelo CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // Compressão
    this.app.use(compression({
      level: 6,
      threshold: 1024,
      filter: (req, res) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return compression.filter(req, res);
      }
}));

// Rate limiting
    this.app.use('/api/', apiRateLimit);

    // Body parsing
    this.app.use(express.json({ 
      limit: '10mb',
      verify: (req, res, buf) => {
        // Verifica tamanho do payload
        if (buf.length > 10 * 1024 * 1024) {
          throw new Error('Payload muito grande');
        }
      }
    }));
    
    this.app.use(express.urlencoded({ 
      extended: true, 
      limit: '10mb' 
    }));

    // Sanitização
    this.app.use(sanitizeInput);

    // Documentação Swagger
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'TrueCheckIA API Documentation'
    }));
  }

  private setupRoutes(): void {
    // Rota raiz
    this.app.get('/', (req, res) => {
  res.json({
    message: 'TrueCheckIA API',
    version: '1.0.0',
        docs: '/api-docs',
        health: '/health'
  });
});

    // Rotas da API
    this.app.use('/health', healthRoutes);
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/analysis', analysisRoutes);
    this.app.use('/api/user', userRoutes);
    this.app.use('/api/admin', adminRoutes);
    this.app.use('/api/reports', reportRoutes);
    this.app.use('/api/plans', plansRoutes);

    // Rota 404
    this.app.use('*', (req, res) => {
      logger.warn(`Rota não encontrada: ${req.method} ${req.originalUrl}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      res.status(404).json({
        error: 'Endpoint não encontrado',
        path: req.originalUrl,
        method: req.method
      });
    });
  }

  private setupWebSocket(): void {
    this.io.on('connection', (socket) => {
      logger.info(`WebSocket conectado: ${socket.id}`, {
        userAgent: socket.handshake.headers['user-agent'],
        ip: socket.handshake.address
      });

      // Autenticação WebSocket
      socket.on('authenticate', (token) => {
        try {
          // TODO: Validar JWT token
          logger.info(`WebSocket autenticado: ${socket.id}`);
          socket.emit('authenticated', { success: true });
    } catch (error) {
          logger.warn(`Falha na autenticação WebSocket: ${socket.id}`, error);
          socket.emit('authentication-error', { error: 'Token inválido' });
        }
      });

      // Entrada em sala de análise
      socket.on('join-analysis', (analysisId) => {
        socket.join(`analysis-${analysisId}`);
        logger.debug(`Socket ${socket.id} entrou na sala analysis-${analysisId}`);
      });

      // Saída de sala de análise
      socket.on('leave-analysis', (analysisId) => {
        socket.leave(`analysis-${analysisId}`);
        logger.debug(`Socket ${socket.id} saiu da sala analysis-${analysisId}`);
      });

  // Desconexão
      socket.on('disconnect', (reason) => {
        logger.info(`WebSocket desconectado: ${socket.id}`, { reason });
      });

      // Erro
      socket.on('error', (error) => {
        logger.error(`WebSocket erro: ${socket.id}`, error);
  });
});
  }

  private setupErrorHandling(): void {
    // Middleware de tratamento de erros (deve ser o último)
    this.app.use(errorHandler);

    // Tratamento de erros não capturados
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection:', reason);
      // Não sai do processo em produção, apenas loga
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      // Em produção, considere usar um process manager como PM2
    process.exit(1);
    });
  }

  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      logger.info(`Recebido sinal ${signal}, iniciando shutdown graceful...`);

      // Para de aceitar novas conexões
      this.server.close(async () => {
        logger.info('HTTP server fechado');

        try {
          // Fecha WebSocket
          this.io.close(() => {
            logger.info('WebSocket server fechado');
          });

          // Fecha banco de dados
          await setupDatabase();
          logger.info('Conexões de banco encerradas');
          
          // Fecha Redis
          await setupRedis();
          logger.info('Conexão Redis encerrada');
          
          logger.info('Shutdown graceful concluído');
    process.exit(0);
        } catch (error) {
          logger.error('Erro durante shutdown:', error);
          process.exit(1);
        }
      });

      // Force exit após 30 segundos
      setTimeout(() => {
        logger.error('Forçando saída após timeout');
  process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }

  async start(): Promise<void> {
    await this.initialize();

    this.server.listen(env.PORT, () => {
      logger.info(`🌟 Servidor rodando na porta ${env.PORT}`);
      logger.info(`📚 Documentação disponível em http://localhost:${env.PORT}/api-docs`);
      logger.info(`🏥 Health check disponível em http://localhost:${env.PORT}/health`);
      
      if (env.NODE_ENV === 'development') {
        logger.info(`🔧 Modo de desenvolvimento ativo`);
      }
    });
  }

  // Método para testes
  getApp(): express.Application {
    return this.app;
  }

  getServer(): http.Server {
    return this.server;
  }

  getIO(): SocketIOServer {
    return this.io;
  }
}

// Inicialização
const server = new Server();

if (require.main === module) {
  server.start().catch((error) => {
    logger.error('Falha ao iniciar servidor:', error);
    process.exit(1);
  });
} 

export default server; 