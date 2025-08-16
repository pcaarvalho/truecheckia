import Redis from 'ioredis';
import { logger } from '../utils/logger';

let redis: Redis | null = null;

// Inicializa Redis apenas se a URL estiver disponível
if (process.env['REDIS_URL']) {
  redis = new Redis(process.env['REDIS_URL'], {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    showFriendlyErrorStack: false,
  });
} else {
  logger.info('Redis não configurado - usando fallbacks para cache e filas');
}

export async function setupRedis() {
  try {
    if (!redis) {
      logger.warn('⚠️ Redis não configurado - cache e filas serão desabilitados');
      return;
    }

    await redis.ping();
    logger.info('✅ Conectado ao Redis');
  } catch (error) {
    logger.warn('⚠️ Redis não disponível - cache e filas serão desabilitados:', error);
    redis?.disconnect();
    redis = null;
  }
}

export { redis };
