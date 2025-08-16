import express, { Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../middleware/auth';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

const router = express.Router();

// GET /api/user/usage - Obter dados de uso do usuário
router.get('/usage', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const userId = req.user.id;

    // Buscar plano do usuário
    const userPlan = await prisma.userPlan.findUnique({
      where: { userId },
      include: {
        plan: true,
      },
    });

    if (!userPlan) {
      return res.status(404).json({ error: 'Plano do usuário não encontrado' });
    }

    // Calcular data de reset (próximo mês)
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Calcular média diária baseada nos dias do mês atual
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const daysInMonth = Math.ceil((now.getTime() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24));
    const dailyAverage = daysInMonth > 0 ? userPlan.analysesUsed / daysInMonth : 0;

    const usageData = {
      currentUsage: userPlan.analysesUsed,
      limit: userPlan.plan.maxAnalyses,
      resetDate: nextMonth.toISOString(),
      dailyAverage: Math.round(dailyAverage * 10) / 10, // Arredondar para 1 casa decimal
    };

    logger.debug(`Dados de uso obtidos para usuário ${userId}:`, usageData);

    res.json(usageData);
  } catch (error) {
    logger.error('Erro ao obter dados de uso:', error);
    return next(error);
  }
});

// GET /api/user/stats - Obter estatísticas do usuário
router.get('/stats', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const userId = req.user.id;

    // Buscar todas as análises do usuário
    const analyses = await prisma.analysis.findMany({
      where: { userId },
      select: {
        confidence: true,
        isAIGenerated: true,
        status: true,
        createdAt: true,
      },
    });

    // Calcular estatísticas
    const totalAnalyses = analyses.length;
    const completedAnalyses = analyses.filter((a) => a.status === 'COMPLETED');
    const aiDetected = completedAnalyses.filter((a) => a.isAIGenerated).length;
    const humanContent = completedAnalyses.filter((a) => !a.isAIGenerated).length;

    // Calcular confiança média apenas das análises completadas
    const averageConfidence =
      completedAnalyses.length > 0
        ? completedAnalyses.reduce((sum, a) => sum + a.confidence, 0) / completedAnalyses.length
        : 0;

    // Análises das últimas 24 horas
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const recentAnalyses = analyses.filter((a) => new Date(a.createdAt) >= yesterday).length;

    // Análises pendentes
    const pendingAnalyses = analyses.filter((a) => a.status === 'PROCESSING').length;

    const stats = {
      totalAnalyses,
      aiDetected,
      humanContent,
      averageConfidence: Math.round(averageConfidence * 10) / 10, // Arredondar para 1 casa decimal
      recentAnalyses,
      pendingAnalyses,
    };

    logger.debug(`Estatísticas obtidas para usuário ${userId}:`, stats);

    res.json(stats);
  } catch (error) {
    logger.error('Erro ao obter estatísticas:', error);
    return next(error);
  }
});

export default router;
