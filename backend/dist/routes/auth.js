"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
const auth_1 = require("../middleware/auth");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
exports.authRoutes = router;
router.post('/register', [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('Email inválido'),
    (0, express_validator_1.body)('password').isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres'),
    (0, express_validator_1.body)('name').trim().isLength({ min: 2 }).withMessage('Nome deve ter pelo menos 2 caracteres')
], async (req, res, next) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            logger_1.logger.warn('Erro de validação no registro:', errors.array());
            return res.status(400).json({
                error: 'Dados inválidos',
                details: errors.array()
            });
        }
        const { email, password, name } = req.body;
        logger_1.logger.info(`Tentativa de registro para email: ${email}`);
        const existingUser = await database_1.prisma.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            logger_1.logger.warn(`Tentativa de registro com email já existente: ${email}`);
            return res.status(400).json({ error: 'Email já cadastrado' });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        const user = await database_1.prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                userPlan: {
                    create: {
                        planType: 'FREE',
                        maxAnalyses: 10,
                        maxFileSize: 10
                    }
                }
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true
            }
        });
        const jwtSecret = process.env['JWT_SECRET'];
        const jwtRefreshSecret = process.env['JWT_REFRESH_SECRET'];
        if (!jwtSecret || !jwtRefreshSecret) {
            logger_1.logger.error('Chaves JWT não configuradas');
            throw new Error('Configuração de JWT incompleta');
        }
        const accessToken = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, jwtSecret, { expiresIn: '15m' });
        const refreshToken = jsonwebtoken_1.default.sign({ userId: user.id }, jwtRefreshSecret, { expiresIn: '7d' });
        logger_1.logger.info(`✅ Novo usuário registrado com sucesso: ${user.email}`);
        return res.status(201).json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            },
            accessToken,
            refreshToken
        });
    }
    catch (error) {
        logger_1.logger.error('Erro no registro:', error);
        return next(error);
    }
});
router.post('/login', [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('Email inválido'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Senha é obrigatória')
], async (req, res, next) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            logger_1.logger.warn('Erro de validação no login:', errors.array());
            return res.status(400).json({
                error: 'Dados inválidos',
                details: errors.array()
            });
        }
        const { email, password } = req.body;
        logger_1.logger.info(`Tentativa de login para email: ${email}`);
        const user = await database_1.prisma.user.findUnique({
            where: { email },
            include: { userPlan: true }
        });
        if (!user) {
            logger_1.logger.warn(`Tentativa de login com email inexistente: ${email}`);
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }
        if (!user.isActive) {
            logger_1.logger.warn(`Tentativa de login com usuário inativo: ${email}`);
            return res.status(401).json({ error: 'Conta desativada' });
        }
        const isValidPassword = await bcryptjs_1.default.compare(password, user.password);
        if (!isValidPassword) {
            logger_1.logger.warn(`Senha incorreta para usuário: ${email}`);
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }
        const jwtSecret = process.env['JWT_SECRET'];
        const jwtRefreshSecret = process.env['JWT_REFRESH_SECRET'];
        if (!jwtSecret || !jwtRefreshSecret) {
            logger_1.logger.error('Chaves JWT não configuradas');
            throw new Error('Configuração de JWT incompleta');
        }
        const accessToken = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, jwtSecret, { expiresIn: '15m' });
        const refreshToken = jsonwebtoken_1.default.sign({ userId: user.id }, jwtRefreshSecret, { expiresIn: '7d' });
        logger_1.logger.info(`✅ Login realizado com sucesso: ${user.email}`);
        return res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                plan: user.userPlan
            },
            accessToken,
            refreshToken
        });
    }
    catch (error) {
        logger_1.logger.error('Erro no login:', error);
        return next(error);
    }
});
router.post('/refresh', async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token é obrigatório' });
        }
        const jwtRefreshSecret = process.env['JWT_REFRESH_SECRET'];
        if (!jwtRefreshSecret) {
            logger_1.logger.error('JWT_REFRESH_SECRET não configurado');
            throw new Error('Configuração de JWT incompleta');
        }
        const decoded = jsonwebtoken_1.default.verify(refreshToken, jwtRefreshSecret);
        const user = await database_1.prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, email: true, name: true, role: true, isActive: true }
        });
        if (!user || !user.isActive) {
            return res.status(401).json({ error: 'Token inválido' });
        }
        const jwtSecret = process.env['JWT_SECRET'];
        if (!jwtSecret) {
            logger_1.logger.error('JWT_SECRET não configurado');
            throw new Error('Configuração de JWT incompleta');
        }
        const accessToken = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, jwtSecret, { expiresIn: '15m' });
        logger_1.logger.info(`✅ Token renovado para usuário: ${user.email}`);
        return res.json({
            success: true,
            accessToken
        });
    }
    catch (error) {
        logger_1.logger.error('Erro no refresh token:', error);
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return res.status(401).json({ error: 'Token inválido' });
        }
        return next(error);
    }
});
router.post('/logout', async (_req, res, next) => {
    try {
        logger_1.logger.info('Logout realizado');
        return res.json({
            success: true,
            message: 'Logout realizado com sucesso'
        });
    }
    catch (error) {
        logger_1.logger.error('Erro no logout:', error);
        return next(error);
    }
});
router.get('/me', auth_1.authenticateToken, async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Usuário não autenticado' });
        }
        const userId = req.user.id;
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId },
            include: {
                userPlan: true
            }
        });
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        if (!user.isActive) {
            return res.status(401).json({ error: 'Conta desativada' });
        }
        logger_1.logger.debug(`Perfil obtido para usuário: ${user.email}`);
        return res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                plan: user.userPlan
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Erro ao obter perfil:', error);
        return next(error);
    }
});
//# sourceMappingURL=auth.js.map