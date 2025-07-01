"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = exports.io = exports.startServer = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const errorHandler_1 = require("./middleware/errorHandler");
const rateLimiter_1 = require("./middleware/rateLimiter");
const logger_1 = require("./utils/logger");
const database_1 = require("./config/database");
const redis_1 = require("./config/redis");
const minio_1 = require("./config/minio");
const swagger_1 = require("./config/swagger");
const auth_1 = require("./routes/auth");
const analysis_1 = require("./routes/analysis");
const user_1 = require("./routes/user");
const reports_1 = require("./routes/reports");
const admin_1 = require("./routes/admin");
const app = (0, express_1.default)();
exports.app = app;
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env['FRONTEND_URL'] || 'http://localhost:3000',
        methods: ['GET', 'POST']
    }
});
exports.io = io;
app.use((req, _res, next) => {
    req.io = io;
    next();
});
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));
app.use((0, cors_1.default)({
    origin: process.env['FRONTEND_URL'] || 'http://localhost:3000',
    credentials: true
}));
app.use((0, compression_1.default)());
app.use((0, morgan_1.default)('combined', {
    stream: {
        write: (message) => logger_1.logger.info(message.trim())
    }
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
(0, swagger_1.setupSwagger)(app);
app.get('/health', (_req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env['NODE_ENV'] || 'development',
        version: process.env['npm_package_version'] || '1.0.0'
    });
});
app.get('/', (_req, res) => {
    res.json({
        message: 'TrueCheckIA API',
        version: '1.0.0',
        documentation: '/api-docs',
        health: '/health'
    });
});
app.use('/api/auth', rateLimiter_1.smartAuthLimiter);
app.use('/api', rateLimiter_1.smartApiLimiter);
app.use('/api/auth', auth_1.authRoutes);
app.use('/api/analysis', analysis_1.analysisRoutes);
app.use('/api/user', user_1.userRoutes);
app.use('/api/reports', reports_1.reportRoutes);
app.use('/api/admin', admin_1.adminRoutes);
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint não encontrado',
        path: req.originalUrl,
        method: req.method
    });
});
app.use(errorHandler_1.errorHandler);
io.on('connection', (socket) => {
    logger_1.logger.info(`Cliente conectado: ${socket.id}`);
    socket.on('authenticate', async (token) => {
        try {
            const jwt = require('jsonwebtoken');
            const { prisma } = require('./config/database');
            const decoded = jwt.verify(token, process.env['JWT_SECRET']);
            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                select: { id: true, email: true, isActive: true }
            });
            if (user && user.isActive) {
                socket.data.userId = user.id;
                socket.join(`user:${user.id}`);
                socket.emit('authenticated', { userId: user.id });
                logger_1.logger.info(`Usuário autenticado via socket: ${user.email}`);
            }
            else {
                socket.emit('auth_error', { error: 'Usuário inválido ou inativo' });
            }
        }
        catch (error) {
            socket.emit('auth_error', { error: 'Token inválido' });
            logger_1.logger.warn('Erro de autenticação via socket:', error);
        }
    });
    socket.on('join-analysis', (analysisId) => {
        if (socket.data.userId) {
            socket.join(`analysis-${analysisId}`);
            logger_1.logger.debug(`Usuário ${socket.data.userId} entrou na sala da análise ${analysisId}`);
        }
    });
    socket.on('leave-analysis', (analysisId) => {
        socket.leave(`analysis-${analysisId}`);
        logger_1.logger.debug(`Usuário saiu da sala da análise ${analysisId}`);
    });
    socket.on('disconnect', () => {
        logger_1.logger.info(`Cliente desconectado: ${socket.id}`);
    });
});
const startServer = async () => {
    try {
        await (0, database_1.setupDatabase)();
        await (0, redis_1.setupRedis)();
        await (0, minio_1.setupMinIO)();
        const port = process.env['PORT'] || 3001;
        server.listen(port, () => {
            logger_1.logger.info(`🚀 Servidor TrueCheckIA rodando na porta ${port}`);
            logger_1.logger.info(`📚 Documentação disponível em: http://localhost:${port}/api-docs`);
            logger_1.logger.info(`🔍 Health check em: http://localhost:${port}/health`);
            logger_1.logger.info(`🌍 Ambiente: ${process.env['NODE_ENV'] || 'development'}`);
        });
    }
    catch (error) {
        logger_1.logger.error('❌ Erro ao iniciar servidor:', error);
        process.exit(1);
    }
};
exports.startServer = startServer;
const gracefulShutdown = async (signal) => {
    logger_1.logger.info(`${signal} recebido, encerrando servidor graciosamente...`);
    server.close(async () => {
        try {
            const { prisma } = require('./config/database');
            await prisma.$disconnect();
            logger_1.logger.info('Conexões de banco encerradas');
            const { redis } = require('./config/redis');
            if (redis) {
                redis.disconnect();
                logger_1.logger.info('Conexão Redis encerrada');
            }
            logger_1.logger.info('Servidor encerrado com sucesso');
            process.exit(0);
        }
        catch (error) {
            logger_1.logger.error('Erro durante o encerramento:', error);
            process.exit(1);
        }
    });
};
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('uncaughtException', (error) => {
    logger_1.logger.error('❌ Erro não capturado:', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    logger_1.logger.error('❌ Promise rejeitada não tratada:', { reason, promise });
    process.exit(1);
});
if (require.main === module) {
    (0, exports.startServer)();
}
//# sourceMappingURL=server.js.map