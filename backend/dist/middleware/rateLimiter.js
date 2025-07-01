"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.smartApiLimiter = exports.smartAuthLimiter = exports.devBypassLimiter = exports.uploadLimiter = exports.apiLimiter = exports.authLimiter = exports.createRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const logger_1 = require("../utils/logger");
const isDevelopment = process.env['NODE_ENV'] === 'development';
const createRateLimiter = (options) => {
    return (0, express_rate_limit_1.default)({
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
exports.createRateLimiter = createRateLimiter;
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: isDevelopment ? 1 * 60 * 1000 : 15 * 60 * 1000,
    max: isDevelopment ? 1000 : 10,
    message: {
        error: isDevelopment
            ? 'Rate limit temporário atingido. Aguarde 1 minuto.'
            : 'Muitas tentativas de login. Tente novamente em 15 minutos.',
        retryAfter: isDevelopment ? 60 : 15 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger_1.logger.warn(`Rate limit de auth atingido para IP: ${req.ip}`);
        res.status(429).json({
            error: isDevelopment
                ? 'Rate limit temporário atingido. Aguarde 1 minuto.'
                : 'Muitas tentativas de login. Tente novamente em 15 minutos.',
            retryAfter: isDevelopment ? 60 : 15 * 60
        });
    }
});
exports.apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: isDevelopment ? 1 * 60 * 1000 : 15 * 60 * 1000,
    max: isDevelopment ? 10000 : 100,
    message: {
        error: isDevelopment
            ? 'Rate limit temporário atingido. Aguarde 1 minuto.'
            : 'Muitas requisições deste IP. Tente novamente mais tarde.',
        retryAfter: isDevelopment ? 60 : 15 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger_1.logger.warn(`Rate limit de API atingido para IP: ${req.ip}`);
        res.status(429).json({
            error: isDevelopment
                ? 'Rate limit temporário atingido. Aguarde 1 minuto.'
                : 'Muitas requisições deste IP. Tente novamente mais tarde.',
            retryAfter: isDevelopment ? 60 : 15 * 60
        });
    }
});
exports.uploadLimiter = (0, express_rate_limit_1.default)({
    windowMs: isDevelopment ? 5 * 60 * 1000 : 60 * 60 * 1000,
    max: isDevelopment ? 1000 : 20,
    message: {
        error: isDevelopment
            ? 'Rate limit temporário atingido. Aguarde 5 minutos.'
            : 'Limite de uploads atingido. Tente novamente em 1 hora.',
        retryAfter: isDevelopment ? 5 * 60 : 60 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger_1.logger.warn(`Rate limit de upload atingido para IP: ${req.ip}`);
        res.status(429).json({
            error: isDevelopment
                ? 'Rate limit temporário atingido. Aguarde 5 minutos.'
                : 'Limite de uploads atingido. Tente novamente em 1 hora.',
            retryAfter: isDevelopment ? 5 * 60 : 60 * 60
        });
    }
});
exports.devBypassLimiter = (0, express_rate_limit_1.default)({
    windowMs: 1000,
    max: 10000,
    standardHeaders: false,
    legacyHeaders: false,
    skip: () => isDevelopment,
});
exports.smartAuthLimiter = isDevelopment ? exports.devBypassLimiter : exports.authLimiter;
exports.smartApiLimiter = isDevelopment ? exports.devBypassLimiter : exports.apiLimiter;
//# sourceMappingURL=rateLimiter.js.map