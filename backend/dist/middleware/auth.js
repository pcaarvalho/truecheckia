"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPlanLimits = exports.requireActivePlan = exports.rateLimit = exports.requireOwnerOrAdmin = exports.requireAdmin = exports.requireRole = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            logger_1.logger.warn('Tentativa de acesso sem token de autorização');
            return res.status(401).json({ error: 'Token de acesso é obrigatório' });
        }
        const secret = process.env['JWT_SECRET'];
        if (!secret) {
            logger_1.logger.error('JWT_SECRET não configurado');
            throw new Error('JWT_SECRET não configurado');
        }
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        const user = await database_1.prisma.user.findUnique({
            where: { id: decoded['userId'] },
            select: {
                id: true,
                email: true,
                role: true,
                isActive: true
            }
        });
        if (!user) {
            logger_1.logger.warn(`Token válido mas usuário não encontrado: ${decoded['userId']}`);
            return res.status(401).json({ error: 'Usuário não encontrado' });
        }
        if (!user.isActive) {
            logger_1.logger.warn(`Token válido mas usuário inativo: ${user.email}`);
            return res.status(401).json({ error: 'Usuário inativo' });
        }
        req.user = {
            id: user.id,
            email: user.email,
            role: user.role
        };
        logger_1.logger.debug(`Usuário autenticado: ${user.email}`);
        return next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            logger_1.logger.warn('Token inválido fornecido');
            return res.status(403).json({ error: 'Token inválido' });
        }
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            logger_1.logger.warn('Token expirado fornecido');
            return res.status(401).json({ error: 'Token expirado' });
        }
        logger_1.logger.error('Erro na autenticação:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
};
exports.authenticateToken = authenticateToken;
const requireRole = (roles) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Autenticação necessária' });
            }
            const user = await database_1.prisma.user.findUnique({
                where: { id: req.user.id },
                select: { role: true }
            });
            if (!user || !roles.includes(user.role)) {
                return res.status(403).json({ error: 'Acesso negado' });
            }
            return next();
        }
        catch (error) {
            return next(error);
        }
    };
};
exports.requireRole = requireRole;
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Autenticação necessária' });
    }
    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
    }
    return next();
};
exports.requireAdmin = requireAdmin;
const requireOwnerOrAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Autenticação necessária' });
    }
    const resourceUserId = req.params['userId'] || req.body['userId'];
    if (req.user.role !== 'ADMIN' && req.user.id !== resourceUserId) {
        return res.status(403).json({ error: 'Acesso negado. Você só pode acessar seus próprios recursos.' });
    }
    return next();
};
exports.requireOwnerOrAdmin = requireOwnerOrAdmin;
const rateLimit = (maxRequests, windowMs) => {
    const requests = new Map();
    return (req, res, next) => {
        if (!req.user) {
            return next();
        }
        const userId = req.user.id;
        const now = Date.now();
        const userRequests = requests.get(userId);
        if (!userRequests || now > userRequests.resetTime) {
            requests.set(userId, {
                count: 1,
                resetTime: now + windowMs
            });
            return next();
        }
        if (userRequests.count >= maxRequests) {
            return res.status(429).json({
                error: 'Muitas requisições. Tente novamente mais tarde.',
                retryAfter: Math.ceil((userRequests.resetTime - now) / 1000)
            });
        }
        userRequests.count++;
        return next();
    };
};
exports.rateLimit = rateLimit;
const requireActivePlan = async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Autenticação necessária' });
    }
    try {
        const user = await database_1.prisma.user.findUnique({
            where: { id: req.user.id },
            include: {
                userPlan: true
            }
        });
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        if (!user.userPlan) {
            req.user = {
                ...req.user,
                plan: 'FREE'
            };
            return next();
        }
        if (user.userPlan.expiresAt && user.userPlan.expiresAt < new Date()) {
            return res.status(403).json({
                error: 'Plano expirado. Renove seu plano para continuar usando o serviço.'
            });
        }
        req.user = {
            ...req.user,
            plan: user.userPlan.planType
        };
        return next();
    }
    catch (error) {
        console.error('Erro ao verificar plano:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
};
exports.requireActivePlan = requireActivePlan;
const checkPlanLimits = (feature) => {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Autenticação necessária' });
        }
        try {
            const user = await database_1.prisma.user.findUnique({
                where: { id: req.user.id },
                include: {
                    userPlan: true
                }
            });
            if (!user) {
                return res.status(404).json({ error: 'Usuário não encontrado' });
            }
            const plan = user.userPlan;
            if (!plan) {
                const limits = {
                    analyses: 5,
                    reports: 3,
                    storage: 100
                };
                const currentUsage = await getCurrentUsage(req.user.id, feature);
                if (currentUsage >= limits[feature]) {
                    return res.status(403).json({
                        error: `Limite do plano FREE atingido para ${feature}. Faça upgrade para continuar.`
                    });
                }
            }
            else {
                const limits = {
                    analyses: plan.maxAnalyses,
                    reports: 10,
                    storage: plan.maxFileSize
                };
                const currentUsage = await getCurrentUsage(req.user.id, feature);
                if (currentUsage >= limits[feature]) {
                    return res.status(403).json({
                        error: `Limite do plano ${plan.planType} atingido para ${feature}. Faça upgrade para continuar.`
                    });
                }
            }
            return next();
        }
        catch (error) {
            console.error('Erro ao verificar limites:', error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    };
};
exports.checkPlanLimits = checkPlanLimits;
async function getCurrentUsage(userId, feature) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    switch (feature) {
        case 'analyses':
            return await database_1.prisma.analysis.count({
                where: {
                    userId,
                    createdAt: {
                        gte: startOfMonth
                    }
                }
            });
        case 'reports':
            return await database_1.prisma.report.count({
                where: {
                    userId,
                    createdAt: {
                        gte: startOfMonth
                    }
                }
            });
        case 'storage':
            const analyses = await database_1.prisma.analysis.findMany({
                where: {
                    userId,
                    createdAt: {
                        gte: startOfMonth
                    }
                },
                select: {
                    id: true
                }
            });
            return analyses.length * 1024 * 1024;
        default:
            return 0;
    }
}
//# sourceMappingURL=auth.js.map