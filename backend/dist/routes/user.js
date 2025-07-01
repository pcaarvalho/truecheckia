"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoutes = void 0;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const database_1 = require("../config/database");
const auth_1 = require("../middleware/auth");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
exports.userRoutes = router;
router.get('/profile', auth_1.authenticateToken, async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Usuário não autenticado' });
        }
        const userId = req.user.id;
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId },
            include: {
                userPlan: true,
                _count: {
                    select: {
                        analyses: true,
                        reports: true
                    }
                }
            }
        });
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        const storageUsed = Math.random() * 50;
        return res.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                plan: user.userPlan,
                usage: {
                    analysesCount: user._count.analyses,
                    reportsCount: user._count.reports,
                    storageUsed: Math.round(storageUsed * 10) / 10
                }
            }
        });
    }
    catch (error) {
        return next(error);
    }
});
router.put('/profile', auth_1.authenticateToken, [
    (0, express_validator_1.body)('name').optional().trim().isLength({ min: 2, max: 100 }),
    (0, express_validator_1.body)('email').optional().isEmail().normalizeEmail()
], async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Usuário não autenticado' });
        }
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const userId = req.user.id;
        const { name, email } = req.body;
        if (email) {
            const existingUser = await database_1.prisma.user.findFirst({
                where: {
                    email,
                    id: { not: userId }
                }
            });
            if (existingUser) {
                return res.status(400).json({ error: 'Email já está em uso' });
            }
        }
        const updateData = {};
        if (name)
            updateData.name = name;
        if (email)
            updateData.email = email;
        const user = await database_1.prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                email: true,
                name: true,
                role: true
            }
        });
        logger_1.logger.info(`Perfil atualizado: ${user.email}`);
        return res.json({ user });
    }
    catch (error) {
        return next(error);
    }
});
router.put('/password', auth_1.authenticateToken, [
    (0, express_validator_1.body)('currentPassword').notEmpty(),
    (0, express_validator_1.body)('newPassword').isLength({ min: 6 })
], async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Usuário não autenticado' });
        }
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        const bcrypt = require('bcryptjs');
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isValidPassword) {
            return res.status(400).json({ error: 'Senha atual incorreta' });
        }
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        await database_1.prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        });
        logger_1.logger.info(`Senha alterada: ${user.email}`);
        return res.json({ message: 'Senha alterada com sucesso' });
    }
    catch (error) {
        return next(error);
    }
});
router.get('/stats', auth_1.authenticateToken, async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Usuário não autenticado' });
        }
        const userId = req.user.id;
        const analysisStats = await database_1.prisma.analysis.groupBy({
            by: ['status'],
            where: { userId },
            _count: {
                status: true
            }
        });
        const contentTypeStats = await database_1.prisma.analysis.groupBy({
            by: ['contentType'],
            where: { userId },
            _count: {
                contentType: true
            }
        });
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const monthlyStats = await database_1.prisma.analysis.groupBy({
            by: ['createdAt'],
            where: {
                userId,
                createdAt: {
                    gte: sixMonthsAgo
                }
            },
            _count: {
                createdAt: true
            }
        });
        const totalAnalyses = await database_1.prisma.analysis.count({
            where: { userId }
        });
        const completedAnalyses = await database_1.prisma.analysis.count({
            where: {
                userId,
                status: 'COMPLETED'
            }
        });
        const successRate = totalAnalyses > 0 ? (completedAnalyses / totalAnalyses) * 100 : 0;
        return res.json({
            analysisStats: analysisStats.reduce((acc, stat) => {
                acc[stat.status] = stat._count.status;
                return acc;
            }, {}),
            contentTypeStats: contentTypeStats.reduce((acc, stat) => {
                acc[stat.contentType] = stat._count.contentType;
                return acc;
            }, {}),
            monthlyStats,
            successRate: Math.round(successRate * 100) / 100,
            totalAnalyses,
            completedAnalyses
        });
    }
    catch (error) {
        return next(error);
    }
});
//# sourceMappingURL=user.js.map