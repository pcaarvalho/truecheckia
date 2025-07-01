import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// Obter perfil do usuário
router.get('/profile', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const userId = req.user.id;

    const user = await prisma.user.findUnique({
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

    // Calcula uso de armazenamento (simulado)
    const storageUsed = Math.random() * 50; // MB

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
  } catch (error) {
    return next(error);
  }
});

// Atualizar perfil
router.put('/profile', authenticateToken, [
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('email').optional().isEmail().normalizeEmail()
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    const { name, email } = req.body;

    // Verifica se o email já está em uso
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          id: { not: userId }
        }
      });

      if (existingUser) {
        return res.status(400).json({ error: 'Email já está em uso' });
      }
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });

    logger.info(`Perfil atualizado: ${user.email}`);

    return res.json({ user });
  } catch (error) {
    return next(error);
  }
});

// Alterar senha
router.put('/password', authenticateToken, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 })
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Busca usuário com senha
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verifica senha atual
    const bcrypt = require('bcryptjs');
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Senha atual incorreta' });
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Atualiza senha
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    logger.info(`Senha alterada: ${user.email}`);

    return res.json({ message: 'Senha alterada com sucesso' });
  } catch (error) {
    return next(error);
  }
});

// Obter estatísticas do usuário
router.get('/stats', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const userId = req.user.id;

    // Estatísticas das análises
    const analysisStats = await prisma.analysis.groupBy({
      by: ['status'],
      where: { userId },
      _count: {
        status: true
      }
    });

    // Análises por tipo de conteúdo
    const contentTypeStats = await prisma.analysis.groupBy({
      by: ['contentType'],
      where: { userId },
      _count: {
        contentType: true
      }
    });

    // Análises por mês (últimos 6 meses)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyStats = await prisma.analysis.groupBy({
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

    // Taxa de sucesso
    const totalAnalyses = await prisma.analysis.count({
      where: { userId }
    });

    const completedAnalyses = await prisma.analysis.count({
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
      }, {} as any),
      contentTypeStats: contentTypeStats.reduce((acc, stat) => {
        acc[stat.contentType] = stat._count.contentType;
        return acc;
      }, {} as any),
      monthlyStats,
      successRate: Math.round(successRate * 100) / 100,
      totalAnalyses,
      completedAnalyses
    });
  } catch (error) {
    return next(error);
  }
});

export { router as userRoutes }; 