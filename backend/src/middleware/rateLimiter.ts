import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger';

const isDevelopment = process.env['NODE_ENV'] === 'development';

export const createRateLimiter = (options: {
  windowMs?: number;
  max?: number;
  prefix?: string;
}) => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000,
    max: options.max || 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP',
    keyGenerator: (req) => {
      return `${options.prefix || 'rl:'}${req.ip}`;
    },
  });
};

// Rate limiter para rotas de autenticação (MUITO PERMISSIVO EM DEV)
export const authLimiter = rateLimit({
  windowMs: isDevelopment ? 1 * 60 * 1000 : 15 * 60 * 1000, // 1 min em dev, 15 min em prod
  max: isDevelopment ? 1000 : 10, // 1000 tentativas em dev, 10 em prod
  message: {
    error: isDevelopment 
      ? 'Rate limit temporário atingido. Aguarde 1 minuto.' 
      : 'Muitas tentativas de login. Tente novamente em 15 minutos.',
    retryAfter: isDevelopment ? 60 : 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit de auth atingido para IP: ${req.ip}`);
    res.status(429).json({
      error: isDevelopment 
        ? 'Rate limit temporário atingido. Aguarde 1 minuto.' 
        : 'Muitas tentativas de login. Tente novamente em 15 minutos.',
      retryAfter: isDevelopment ? 60 : 15 * 60
    });
  }
});

// Rate limiter geral para API (MUITO PERMISSIVO EM DEV)
export const apiLimiter = rateLimit({
  windowMs: isDevelopment ? 1 * 60 * 1000 : 15 * 60 * 1000, // 1 min em dev, 15 min em prod
  max: isDevelopment ? 10000 : 100, // 10000 requisições em dev, 100 em prod
  message: {
    error: isDevelopment 
      ? 'Rate limit temporário atingido. Aguarde 1 minuto.' 
      : 'Muitas requisições deste IP. Tente novamente mais tarde.',
    retryAfter: isDevelopment ? 60 : 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit de API atingido para IP: ${req.ip}`);
    res.status(429).json({
      error: isDevelopment 
        ? 'Rate limit temporário atingido. Aguarde 1 minuto.' 
        : 'Muitas requisições deste IP. Tente novamente mais tarde.',
      retryAfter: isDevelopment ? 60 : 15 * 60
    });
  }
});

// Rate limiter para upload de arquivos (PERMISSIVO EM DEV)
export const uploadLimiter = rateLimit({
  windowMs: isDevelopment ? 5 * 60 * 1000 : 60 * 60 * 1000, // 5 min em dev, 1 hora em prod
  max: isDevelopment ? 1000 : 20, // 1000 uploads em dev, 20 em prod
  message: {
    error: isDevelopment 
      ? 'Rate limit temporário atingido. Aguarde 5 minutos.' 
      : 'Limite de uploads atingido. Tente novamente em 1 hora.',
    retryAfter: isDevelopment ? 5 * 60 : 60 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit de upload atingido para IP: ${req.ip}`);
    res.status(429).json({
      error: isDevelopment 
        ? 'Rate limit temporário atingido. Aguarde 5 minutos.' 
        : 'Limite de uploads atingido. Tente novamente em 1 hora.',
      retryAfter: isDevelopment ? 5 * 60 : 60 * 60
    });
  }
});

// 🚀 DESENVOLVIMENTO: Rate limiter desabilitado para desenvolvimento local
export const devBypassLimiter = rateLimit({
  windowMs: 1000, // 1 segundo
  max: 10000, // 10000 requisições por segundo (essencialmente sem limite)
  standardHeaders: false,
  legacyHeaders: false,
  skip: () => isDevelopment, // Pula completamente em desenvolvimento
});

// Exportar rate limiter apropriado baseado no ambiente
export const smartAuthLimiter = isDevelopment ? devBypassLimiter : authLimiter;
export const smartApiLimiter = isDevelopment ? devBypassLimiter : apiLimiter; 