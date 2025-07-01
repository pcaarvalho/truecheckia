"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateFileUpload = exports.validateRequest = exports.asyncHandler = exports.createError = exports.errorHandler = void 0;
const logger_1 = require("../utils/logger");
const errorHandler = (error, req, res, _next) => {
    let { statusCode = 500, message } = error;
    logger_1.logger.error(`Erro ${statusCode}: ${message}`, {
        error: error.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });
    if (error.isOperational) {
        return res.status(statusCode).json({
            error: message,
            statusCode
        });
    }
    if (error.name === 'PrismaClientKnownRequestError') {
        const prismaError = error;
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
            statusCode
        });
    }
    if (error.name === 'ValidationError' || error.name === 'ValidatorError') {
        statusCode = 400;
        return res.status(statusCode).json({
            error: 'Dados inválidos',
            details: error.message,
            statusCode
        });
    }
    if (error.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Token inválido';
    }
    if (error.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expirado';
    }
    if (error.name === 'MulterError') {
        const multerError = error;
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
            statusCode
        });
    }
    if (process.env['NODE_ENV'] === 'production') {
        message = 'Erro interno do servidor';
    }
    return res.status(statusCode).json({
        error: message,
        statusCode,
        ...(process.env['NODE_ENV'] === 'development' && { stack: error.stack })
    });
};
exports.errorHandler = errorHandler;
const createError = (message, statusCode = 500) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.isOperational = true;
    return error;
};
exports.createError = createError;
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
const validateRequest = (req, res, next) => {
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({
            error: 'Corpo da requisição vazio',
            statusCode: 400
        });
    }
    return next();
};
exports.validateRequest = validateRequest;
const validateFileUpload = (req, res, next) => {
    if (!req.file && !req.files) {
        return res.status(400).json({
            error: 'Nenhum arquivo enviado',
            statusCode: 400
        });
    }
    return next();
};
exports.validateFileUpload = validateFileUpload;
//# sourceMappingURL=errorHandler.js.map