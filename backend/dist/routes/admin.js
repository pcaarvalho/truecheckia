"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRoutes = void 0;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const database_1 = require("../config/database");
const auth_1 = require("../middleware/auth");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
exports.adminRoutes = router;
router.use(auth_1.authenticateToken, auth_1.requireAdmin);
router.get('/dashboard', async (_req, res, next) => {
    try {
        const [totalUsers, totalAnalyses, totalReports, activeUsers, completedAnalyses, failedAnalyses] = await Promise.all([
            database_1.prisma.user.count(),
            database_1.prisma.analysis.count(),
            database_1.prisma.report.count(),
            database_1.prisma.user.count({
                where: {
                    updatedAt: {
                        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                    }
                }
            }),
            database_1.prisma.analysis.count({
                where: { status: 'COMPLETED' }
            }),
            database_1.prisma.analysis.count({
                where: { status: 'FAILED' }
            })
        ]);
        const contentTypeStats = await database_1.prisma.analysis.groupBy({
            by: ['contentType'],
            _count: {
                contentType: true
            }
        });
        const statusStats = await database_1.prisma.analysis.groupBy({
            by: ['status'],
            _count: {
                status: true
            }
        });
        const planStatsRaw = await database_1.prisma.userPlan.groupBy({
            by: ['planType'],
            _count: {
                planType: true
            }
        });
        const planStats = planStatsRaw.reduce((acc, stat) => {
            acc[stat.planType] = stat._count.planType;
            return acc;
        }, {});
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentAnalyses = await database_1.prisma.analysis.groupBy({
            by: ['createdAt'],
            where: {
                createdAt: {
                    gte: sevenDaysAgo
                }
            },
            _count: {
                createdAt: true
            }
        });
        res.json({
            stats: {
                totalUsers,
                totalAnalyses,
                totalReports,
                activeUsers,
                completedAnalyses,
                failedAnalyses,
                successRate: totalAnalyses > 0 ? (completedAnalyses / totalAnalyses) * 100 : 0
            },
            contentTypeStats: contentTypeStats.reduce((acc, stat) => {
                acc[stat.contentType] = stat._count.contentType;
                return acc;
            }, {}),
            statusStats: statusStats.reduce((acc, stat) => {
                acc[stat.status] = stat._count.status;
                return acc;
            }, {}),
            planStats,
            recentAnalyses
        });
    }
    catch (error) {
        return next(error);
    }
});
router.get('/users', async (req, res, next) => {
    try {
        const { page = 1, limit = 20, search, plan, status } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (search) {
            where.OR = [
                { email: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } }
            ];
        }
        if (plan)
            where.planId = plan;
        if (status === 'active') {
            where.lastLoginAt = {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            };
        }
        else if (status === 'inactive') {
            where.lastLoginAt = {
                lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            };
        }
        const [users, total] = await Promise.all([
            database_1.prisma.user.findMany({
                where,
                include: {
                    userPlan: true,
                    _count: {
                        select: {
                            analyses: true,
                            reports: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: Number(limit)
            }),
            database_1.prisma.user.count({ where })
        ]);
        res.json({
            users,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        });
    }
    catch (error) {
        return next(error);
    }
});
router.get('/users/:id', async (req, res, next) => {
    try {
        const userId = req.params['id'];
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId },
            include: {
                userPlan: true,
                analyses: {
                    orderBy: { createdAt: 'desc' },
                    take: 10
                },
                reports: {
                    orderBy: { createdAt: 'desc' },
                    take: 10
                },
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
        return res.json({ user });
    }
    catch (error) {
        return next(error);
    }
});
router.put('/users/:id', [
    (0, express_validator_1.body)('name').optional().trim().isLength({ min: 2, max: 100 }),
    (0, express_validator_1.body)('email').optional().isEmail().normalizeEmail(),
    (0, express_validator_1.body)('role').optional().isIn(['USER', 'ADMIN']),
    (0, express_validator_1.body)('isActive').optional().isBoolean()
], async (req, res, next) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const userId = req.params['id'];
        const { name, email, role, isActive } = req.body;
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        const updateData = {};
        if (name)
            updateData.name = name;
        if (email)
            updateData.email = email;
        if (role)
            updateData.role = role;
        if (typeof isActive === 'boolean')
            updateData.isActive = isActive;
        const updatedUser = await database_1.prisma.user.update({
            where: { id: userId },
            data: updateData,
            include: {
                userPlan: true
            }
        });
        logger_1.logger.info(`Usuário atualizado por admin: ${updatedUser.email}`);
        res.json({ user: updatedUser });
    }
    catch (error) {
        return next(error);
    }
});
router.get('/analyses', async (req, res, next) => {
    try {
        const { page = 1, limit = 20, status, contentType, userId } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (status)
            where.status = status;
        if (contentType)
            where.contentType = contentType;
        if (userId)
            where.userId = userId;
        const [analyses, total] = await Promise.all([
            database_1.prisma.analysis.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            name: true
                        }
                    },
                    results: true
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: Number(limit)
            }),
            database_1.prisma.analysis.count({ where })
        ]);
        res.json({
            analyses,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        });
    }
    catch (error) {
        return next(error);
    }
});
router.get('/analyses/:id', async (req, res, next) => {
    try {
        const analysisId = req.params['id'];
        const analysis = await database_1.prisma.analysis.findUnique({
            where: { id: analysisId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true
                    }
                },
                results: true,
                reports: true
            }
        });
        if (!analysis) {
            return res.status(404).json({ error: 'Análise não encontrada' });
        }
        res.json({ analysis });
    }
    catch (error) {
        return next(error);
    }
});
router.get('/reports', async (req, res, next) => {
    try {
        const { page = 1, limit = 20, type, userId } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (type)
            where.type = type;
        if (userId)
            where.userId = userId;
        const [reports, total] = await Promise.all([
            database_1.prisma.report.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            name: true
                        }
                    },
                    analysis: {
                        select: {
                            id: true,
                            title: true,
                            contentType: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: Number(limit)
            }),
            database_1.prisma.report.count({ where })
        ]);
        res.json({
            reports,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        });
    }
    catch (error) {
        return next(error);
    }
});
router.get('/system-stats', async (_req, res, next) => {
    try {
        const storageStats = {
            total: 1024,
            used: Math.random() * 500 + 200,
            available: 1024 - (Math.random() * 500 + 200)
        };
        const performanceStats = {
            averageResponseTime: Math.random() * 100 + 50,
            requestsPerMinute: Math.random() * 1000 + 500,
            errorRate: Math.random() * 5,
            uptime: 99.9
        };
        const hourlyStats = [];
        for (let i = 23; i >= 0; i--) {
            const hour = new Date();
            hour.setHours(hour.getHours() - i);
            hour.setMinutes(0, 0, 0);
            const count = await database_1.prisma.analysis.count({
                where: {
                    createdAt: {
                        gte: hour,
                        lt: new Date(hour.getTime() + 60 * 60 * 1000)
                    }
                }
            });
            hourlyStats.push({
                hour: hour.toISOString(),
                count
            });
        }
        res.json({
            storage: storageStats,
            performance: performanceStats,
            hourlyAnalyses: hourlyStats
        });
    }
    catch (error) {
        return next(error);
    }
});
//# sourceMappingURL=admin.js.map