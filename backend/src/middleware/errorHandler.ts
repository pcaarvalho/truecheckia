import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (error: AppError, req: Request, res: Response, _next: NextFunction) => {
  let { statusCode = 500, message } = error;

  // Log do erro
  logger.error(`Erro ${statusCode}: ${message}`, {
    error: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Se é um erro operacional conhecido
  if (error.isOperational) {
    return res.status(statusCode).json({
      error: message,
      statusCode,
    });
  }

  // Erros de validação do Prisma
  if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;

    switch (prismaError.code) {
      case 'P2002':
        statusCode = 409;
        message = 'Registro já existe';
        break;
      case 'P2025':
        statusCode = 404;
        message = 'Registro não encontrado';
        break;
      case 'P2003':
        statusCode = 400;
        message = 'Violação de chave estrangeira';
        break;
      default:
        statusCode = 400;
        message = 'Erro no banco de dados';
    }

    return res.status(statusCode).json({
      error: message,
      statusCode,
    });
  }

  // Erros de validação do Joi ou express-validator
  if (error.name === 'ValidationError' || error.name === 'ValidatorError') {
    statusCode = 400;
    return res.status(statusCode).json({
      error: 'Dados inválidos',
      details: error.message,
      statusCode,
    });
  }

  // Erros de JWT
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token inválido';
  }

  if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expirado';
  }

  // Erros de arquivo
  if (error.name === 'MulterError') {
    const multerError = error as any;
    statusCode = 400;

    switch (multerError.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'Arquivo muito grande';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Muitos arquivos';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Campo de arquivo inesperado';
        break;
      default:
        message = 'Erro no upload do arquivo';
    }

    return res.status(statusCode).json({
      error: message,
      statusCode,
    });
  }

  // Em produção, não expor detalhes internos
  if (process.env['NODE_ENV'] === 'production') {
    message = 'Erro interno do servidor';
  }

  return res.status(statusCode).json({
    error: message,
    statusCode,
    ...(process.env['NODE_ENV'] === 'development' && { stack: error.stack }),
  });
};

// Função para criar erros operacionais
export const createError = (message: string, statusCode: number = 500): AppError => {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};

// Middleware para capturar erros assíncronos
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void> | void
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Middleware para verificar se a requisição é válida
export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({
      error: 'Corpo da requisição vazio',
      statusCode: 400,
    });
  }
  return next();
};

// Middleware para verificar se o arquivo foi enviado
export const validateFileUpload = (req: Request, res: Response, next: NextFunction) => {
  if (!req.file && !req.files) {
    return res.status(400).json({
      error: 'Nenhum arquivo enviado',
      statusCode: 400,
    });
  }
  return next();
};
