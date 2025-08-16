import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../config/database';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// Middleware para verificar se é admin
router.use(authenticateToken, requireAdmin);

// Dashboard administrativo
router.get('/dashboard', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // Estatísticas gerais
    const [
      totalUsers,
      totalAnalyses,
      totalReports,
      activeUsers,
      completedAnalyses,
      failedAnalyses,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.analysis.count(),
      prisma.report.count(),
      prisma.user.count({
        where: {
          updatedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Últimos 30 dias
          },
        },
      }),
      prisma.analysis.count({
        where: { status: 'COMPLETED' },
      }),
      prisma.analysis.count({
        where: { status: 'FAILED' },
      }),
    ]);

    // Análises por tipo de conteúdo
    const contentTypeStats = await prisma.analysis.groupBy({
      by: ['contentType'],
      _count: {
        contentType: true,
      },
    });

    // Análises por status
    const statusStats = await prisma.analysis.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
    });

    // Usuários por plano (usando UserPlan)
    const planStatsRaw = await prisma.userPlan.groupBy({
      by: ['planType'],
      _count: {
        planType: true,
      },
    });
    const planStats = planStatsRaw.reduce((acc, stat) => {
      acc[stat.planType] = stat._count.planType;
      return acc;
    }, {} as any);

    // Análises dos últimos 7 dias
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentAnalyses = await prisma.analysis.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      _count: {
        createdAt: true,
      },
    });

    res.json({
      stats: {
        totalUsers,
        totalAnalyses,
        totalReports,
        activeUsers,
        completedAnalyses,
        failedAnalyses,
        successRate: totalAnalyses > 0 ? (completedAnalyses / totalAnalyses) * 100 : 0,
      },
      contentTypeStats: contentTypeStats.reduce((acc, stat) => {
        acc[stat.contentType] = stat._count.contentType;
        return acc;
      }, {} as any),
      statusStats: statusStats.reduce((acc, stat) => {
        acc[stat.status] = stat._count.status;
        return acc;
      }, {} as any),
      planStats,
      recentAnalyses,
    });
  } catch (error) {
    return next(error);
  }
});

// Listar usuários
router.get('/users', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 20, search, plan, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (search) {
      where.OR = [
        { email: { contains: search as string, mode: 'insensitive' } },
        { name: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    if (plan) where.planId = plan;
    if (status === 'active') {
      where.lastLoginAt = {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      };
    } else if (status === 'inactive') {
      where.lastLoginAt = {
        lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      };
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          userPlan: true,
          _count: {
            select: {
              analyses: true,
              reports: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    return next(error);
  }
});

// Obter usuário específico
router.get('/users/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params['id'] as string;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userPlan: true,
        analyses: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        reports: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            analyses: true,
            reports: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    return res.json({ user });
  } catch (error) {
    return next(error);
  }
});

// Atualizar usuário
router.put(
  '/users/:id',
  [
    body('name').optional().trim().isLength({ min: 2, max: 100 }),
    body('email').optional().isEmail().normalizeEmail(),
    body('role').optional().isIn(['USER', 'ADMIN']),
    body('isActive').optional().isBoolean(),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = req.params['id'] as string;
      const { name, email, role, isActive } = req.body;

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      const updateData: any = {};
      if (name) updateData.name = name;
      if (email) updateData.email = email;
      if (role) updateData.role = role;
      if (typeof isActive === 'boolean') updateData.isActive = isActive;

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        include: {
          userPlan: true,
        },
      });

      logger.info(`Usuário atualizado por admin: ${updatedUser.email}`);

      res.json({ user: updatedUser });
    } catch (error) {
      return next(error);
    }
  }
);

// Listar análises
router.get('/analyses', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 20, status, contentType, userId } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (status) where.status = status;
    if (contentType) where.contentType = contentType;
    if (userId) where.userId = userId;

    const [analyses, total] = await Promise.all([
      prisma.analysis.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          results: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.analysis.count({ where }),
    ]);

    res.json({
      analyses,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    return next(error);
  }
});

// Obter análise específica
router.get('/analyses/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const analysisId = req.params['id'] as string;

    const analysis = await prisma.analysis.findUnique({
      where: { id: analysisId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        results: true,
        reports: true,
      },
    });

    if (!analysis) {
      return res.status(404).json({ error: 'Análise não encontrada' });
    }

    res.json({ analysis });
  } catch (error) {
    return next(error);
  }
});

// Listar relatórios
router.get('/reports', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 20, type, userId } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (type) where.type = type;
    if (userId) where.userId = userId;

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          analysis: {
            select: {
              id: true,
              title: true,
              contentType: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.report.count({ where }),
    ]);

    res.json({
      reports,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    return next(error);
  }
});

// Estatísticas do sistema
router.get('/system-stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // Uso de armazenamento (simulado)
    const storageStats = {
      total: 1024, // GB
      used: Math.random() * 500 + 200, // GB
      available: 1024 - (Math.random() * 500 + 200), // GB
    };

    // Performance do sistema
    const performanceStats = {
      averageResponseTime: Math.random() * 100 + 50, // ms
      requestsPerMinute: Math.random() * 1000 + 500,
      errorRate: Math.random() * 5, // %
      uptime: 99.9, // %
    };

    // Análises por hora (últimas 24 horas)
    const hourlyStats = [];
    for (let i = 23; i >= 0; i--) {
      const hour = new Date();
      hour.setHours(hour.getHours() - i);
      hour.setMinutes(0, 0, 0);

      const count = await prisma.analysis.count({
        where: {
          createdAt: {
            gte: hour,
            lt: new Date(hour.getTime() + 60 * 60 * 1000),
          },
        },
      });

      hourlyStats.push({
        hour: hour.toISOString(),
        count,
      });
    }

    res.json({
      storage: storageStats,
      performance: performanceStats,
      hourlyAnalyses: hourlyStats,
    });
  } catch (error) {
    return next(error);
  }
});

export { router as adminRoutes };
