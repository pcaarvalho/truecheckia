"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const dotenv_1 = __importDefault(require("dotenv"));
const errorHandler_1 = require("./middleware/errorHandler");
const auth_1 = require("./routes/auth");
const analysis_1 = require("./routes/analysis");
const user_1 = require("./routes/user");
const reports_1 = require("./routes/reports");
const database_1 = require("./config/database");
const redis_1 = require("./config/redis");
const minio_1 = require("./config/minio");
const logger_1 = require("./utils/logger");
const swagger_1 = require("./config/swagger");
const rateLimiter_1 = require("./middleware/rateLimiter");
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env['FRONTEND_URL'] || "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});
exports.io = io;
const PORT = process.env['PORT'] || 3001;
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Muitas requisições deste IP, tente novamente mais tarde.'
});
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env['FRONTEND_URL'] || "http://localhost:3000",
    credentials: true
}));
app.use((0, compression_1.default)());
app.use((0, morgan_1.default)('combined', { stream: { write: (message) => logger_1.logger.info(message.trim()) } }));
app.use(limiter);
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
(0, swagger_1.setupSwagger)(app);
app.get('/health', (_req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: process.env['npm_package_version'] || '1.0.0'
    });
});
app.use('/api/auth', auth_1.authRoutes);
app.use('/api/analysis', analysis_1.analysisRoutes);
app.use('/api/user', user_1.userRoutes);
app.use('/api/report', reports_1.reportRoutes);
app.use((req, _res, next) => {
    req.io = io;
    next();
});
app.use('/api/auth', rateLimiter_1.authLimiter);
app.use('/api', rateLimiter_1.apiLimiter);
io.on('connection', (socket) => {
    logger_1.logger.info(`Cliente conectado: ${socket.id}`);
    socket.on('join-analysis', (analysisId) => {
        socket.join(`analysis-${analysisId}`);
    });
    socket.on('disconnect', () => {
        logger_1.logger.info(`Cliente desconectado: ${socket.id}`);
    });
});
app.use(errorHandler_1.errorHandler);
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint não encontrado',
        path: req.originalUrl
    });
});
async function startServer() {
    try {
        await (0, database_1.setupDatabase)();
        await (0, redis_1.setupRedis)();
        await (0, minio_1.setupMinIO)();
        server.listen(PORT, () => {
            logger_1.logger.info(`🚀 Servidor rodando na porta ${PORT}`);
            logger_1.logger.info(`📚 Documentação disponível em http://localhost:${PORT}/api-docs`);
            logger_1.logger.info(`🔍 Health check em http://localhost:${PORT}/health`);
        });
    }
    catch (error) {
        logger_1.logger.error('Erro ao inicializar servidor:', error);
        process.exit(1);
    }
}
process.on('SIGTERM', () => {
    logger_1.logger.info('SIGTERM recebido, encerrando servidor...');
    server.close(() => {
        logger_1.logger.info('Servidor encerrado');
        process.exit(0);
    });
});
process.on('SIGINT', () => {
    logger_1.logger.info('SIGINT recebido, encerrando servidor...');
    server.close(() => {
        logger_1.logger.info('Servidor encerrado');
        process.exit(0);
    });
});
startServer();
//# sourceMappingURL=index.js.map