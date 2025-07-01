"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
exports.setupRedis = setupRedis;
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = require("../utils/logger");
let redis = null;
exports.redis = redis;
if (process.env['REDIS_URL']) {
    exports.redis = redis = new ioredis_1.default(process.env['REDIS_URL'], {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        showFriendlyErrorStack: false
    });
}
else {
    logger_1.logger.info('Redis não configurado - usando fallbacks para cache e filas');
}
async function setupRedis() {
    try {
        if (!redis) {
            logger_1.logger.warn('⚠️ Redis não configurado - cache e filas serão desabilitados');
            return;
        }
        await redis.ping();
        logger_1.logger.info('✅ Conectado ao Redis');
    }
    catch (error) {
        logger_1.logger.warn('⚠️ Redis não disponível - cache e filas serão desabilitados:', error);
        redis?.disconnect();
        exports.redis = redis = null;
    }
}
//# sourceMappingURL=redis.js.map