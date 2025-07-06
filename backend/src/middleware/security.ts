import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { body, validationResult, param, query } from 'express-validator';
import xss from 'xss';
import mongoSanitize from 'express-mongo-sanitize';
import { logger } from '../utils/logger';

// Configuração de segurança com Helmet
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.anthropic.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Rate limiting inteligente por endpoint
export const createRateLimit = (windowMs: number, max: number, message?: string) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return rateLimit({
    windowMs: isDevelopment ? 60000 : windowMs, // 1 min em dev vs configurado em prod
    max: isDevelopment ? 1000 : max, // 1000 req/min em dev vs configurado em prod
    message: {
      error: message || 'Muitas tentativas. Tente novamente mais tarde.',
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip para desenvolvimento ou IPs locais
      if (isDevelopment) return true;
      const ip = req.ip || req.connection.remoteAddress;
      return ip === '127.0.0.1' || ip === '::1' || ip?.startsWith('192.168.');
    },
    keyGenerator: (req) => {
      // Combina IP + User-Agent para mais precisão
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || 'unknown';
      return `${ip}:${userAgent.substring(0, 50)}`;
    },
    handler: (req, res) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        url: req.url,
        userAgent: req.get('User-Agent')
      });
      res.status(429).json({
        error: message || 'Muitas tentativas. Tente novamente mais tarde.',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
};

// Rate limiters específicos
export const authRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutos
  5, // 5 tentativas
  'Muitas tentativas de login. Tente novamente em 15 minutos.'
);

export const apiRateLimit = createRateLimit(
  60 * 1000, // 1 minuto
  100, // 100 requests
  'Limite de requisições excedido.'
);

export const analysisRateLimit = createRateLimit(
  60 * 1000, // 1 minuto
  10, // 10 análises
  'Limite de análises excedido. Tente novamente em 1 minuto.'
);

export const uploadRateLimit = createRateLimit(
  5 * 60 * 1000, // 5 minutos
  3, // 3 uploads
  'Limite de uploads excedido. Tente novamente em 5 minutos.'
);

// Sanitização de dados
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Remove dados maliciosos
  mongoSanitize()(req, res, () => {
    // Sanitiza strings contra XSS
    const sanitizeObject = (obj: any): any => {
      if (typeof obj === 'string') {
        return xss(obj, {
          whiteList: {}, // Remove todas as tags HTML
          stripIgnoreTag: true,
          stripIgnoreTagBody: ['script']
        });
      }
      
      if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      }
      
      if (obj !== null && typeof obj === 'object') {
        const sanitized: any = {};
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            sanitized[key] = sanitizeObject(obj[key]);
          }
        }
        return sanitized;
      }
      
      return obj;
    };

    if (req.body) req.body = sanitizeObject(req.body);
    if (req.query) req.query = sanitizeObject(req.query);
    if (req.params) req.params = sanitizeObject(req.params);
    
    next();
  });
};

// Validadores comuns
export const validateEmail = () => 
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido');

export const validatePassword = () => 
  body('password')
    .isLength({ min: 6, max: 128 })
    .withMessage('Senha deve ter entre 6 e 128 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Senha deve conter pelo menos uma letra minúscula, maiúscula e um número');

export const validateText = (field: string = 'textContent', maxLength: number = 50000) =>
  body(field)
    .isString()
    .withMessage(`${field} deve ser uma string`)
    .isLength({ min: 10, max: maxLength })
    .withMessage(`${field} deve ter entre 10 e ${maxLength} caracteres`)
    .custom((value) => {
      // Verifica se não é spam ou conteúdo suspeito
      const suspiciousPatterns = [
        /(.)\1{50,}/, // Repetição excessiva de caracteres
        /[^\w\s\p{P}\p{S}]/u, // Caracteres não permitidos
        /(http|https|ftp):\/\/[^\s]+/gi // URLs não permitidas em texto
      ];
      
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(value)) {
          throw new Error('Conteúdo suspeito detectado');
        }
      }
      
      return true;
    });

export const validateTitle = () =>
  body('title')
    .optional()
    .isString()
    .isLength({ max: 200 })
    .withMessage('Título deve ter no máximo 200 caracteres');

export const validateUUID = (field: string) =>
  param(field)
    .isUUID()
    .withMessage(`${field} deve ser um UUID válido`);

export const validatePagination = () => [
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Página deve ser um número entre 1 e 1000'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit deve ser um número entre 1 e 100')
];

// Middleware para verificar validação
export const checkValidation = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    logger.warn('Validation failed', {
      errors: errors.array(),
      body: req.body,
      query: req.query,
      params: req.params,
      ip: req.ip
    });
    
    return res.status(400).json({
      error: 'Dados inválidos',
      details: errors.array().map(err => ({
        field: err.type === 'field' ? err.path : 'unknown',
        message: err.msg
      }))
    });
  }
  
  next();
};

// Middleware de segurança para headers
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Remove headers que expõem informações do servidor
  res.removeHeader('X-Powered-By');
  
  // Headers de segurança adicionais
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Controle de cache para rotas sensíveis
  if (req.path.includes('/api/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  
  next();
};

// Middleware de logging de segurança
export const securityLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      duration,
      contentLength: res.get('Content-Length') || 0
    };
    
    // Log suspeito para status de erro
    if (res.statusCode >= 400) {
      logger.warn('HTTP Error', logData);
    } else {
      logger.info('HTTP Request', logData);
    }
  });
  
  next();
};

// Middleware de detecção de ataques
export const detectAttacks = (req: Request, res: Response, next: NextFunction) => {
  const suspicious = [
    // SQL Injection patterns
    /('|(\\)|;|--|\/\*|\*\/|xp_|sp_)/i,
    // XSS patterns
    /<script[^>]*>.*?<\/script>/gi,
    // Command injection patterns
    /[;&|`$(){}[\]]/,
    // Path traversal
    /\.\.[\/\\]/
  ];
  
  const checkSuspicious = (value: string): boolean => {
    return suspicious.some(pattern => pattern.test(value));
  };
  
  const checkObject = (obj: any): boolean => {
    if (typeof obj === 'string') {
      return checkSuspicious(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.some(checkObject);
    }
    
    if (obj && typeof obj === 'object') {
      return Object.values(obj).some(checkObject);
    }
    
    return false;
  };
  
  if (checkObject(req.body) || checkObject(req.query) || checkObject(req.params)) {
    logger.error('Suspicious request detected', {
      ip: req.ip,
      url: req.url,
      method: req.method,
      body: req.body,
      query: req.query,
      params: req.params,
      userAgent: req.get('User-Agent')
    });
    
    return res.status(403).json({
      error: 'Requisição suspeita detectada'
    });
  }
  
  next();
}; 