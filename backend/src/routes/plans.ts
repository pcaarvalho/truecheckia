import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { z } from 'zod';
import { Request, Response } from 'express';

const router = Router();
const prisma = new PrismaClient();

// Schema de validação
const selectPlanSchema = z.object({
  planId: z.string().min(1, 'Plan ID é obrigatório')
});

// Buscar todos os planos disponíveis
router.get('/available', async (req: Request, res: Response) => {
  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        displayName: true,
        description: true,
        price: true,
        currency: true,
        maxAnalyses: true,
        maxFileSize: true,
        maxVideoLength: true,
        maxReports: true,
        features: true
      }
    });

    // Parse features JSON
    const plansWithFeatures = plans.map(plan => ({
      ...plan,
      features: JSON.parse(plan.features)
    }));

    res.json({
      success: true,
      data: plansWithFeatures
    });
  } catch (error) {
    console.error('Erro ao buscar planos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar planos disponíveis'
    });
  }
});

// Buscar plano atual do usuário
router.get('/current', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const userPlan = await prisma.userPlan.findUnique({
      where: { userId },
      include: {
        plan: true,
        subscriptions: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!userPlan) {
      return res.status(404).json({
        success: false,
        message: 'Plano não encontrado'
      });
    }

    // Calcular uso
    const usagePercentage = {
      analyses: userPlan.plan.maxAnalyses > 0 
        ? (userPlan.analysesUsed / userPlan.plan.maxAnalyses) * 100 
        : 0,
      reports: userPlan.plan.maxReports > 0 
        ? (userPlan.reportsUsed / userPlan.plan.maxReports) * 100 
        : 0
    };

    res.json({
      success: true,
      data: {
        ...userPlan,
        plan: {
          ...userPlan.plan,
          features: JSON.parse(userPlan.plan.features)
        },
        usage: {
          analyses: {
            used: userPlan.analysesUsed,
            max: userPlan.plan.maxAnalyses,
            percentage: usagePercentage.analyses
          },
          reports: {
            used: userPlan.reportsUsed,
            max: userPlan.plan.maxReports,
            percentage: usagePercentage.reports
          }
        },
        hasActiveSubscription: userPlan.subscriptions.length > 0
      }
    });
  } catch (error) {
    console.error('Erro ao buscar plano atual:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar plano atual'
    });
  }
});

// Selecionar plano (para novos usuários ou upgrade)
router.post('/select', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { planId } = selectPlanSchema.parse(req.body);
    const userId = req.user!.userId;

    // Buscar plano selecionado
    const selectedPlan = await prisma.plan.findUnique({
      where: { id: planId }
    });

    if (!selectedPlan || !selectedPlan.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Plano não encontrado ou inativo'
      });
    }

    // Verificar se usuário já tem um plano
    const existingUserPlan = await prisma.userPlan.findUnique({
      where: { userId }
    });

    let userPlan;
    const now = new Date();

    if (existingUserPlan) {
      // Atualizar plano existente
      userPlan = await prisma.userPlan.update({
        where: { userId },
        data: {
          planId: selectedPlan.id,
          planType: selectedPlan.name,
          status: selectedPlan.price === 0 ? 'ACTIVE' : 'TRIAL',
          trialEndsAt: selectedPlan.price > 0 && !existingUserPlan.isTrialUsed 
            ? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 dias de trial
            : existingUserPlan.trialEndsAt,
          isTrialUsed: selectedPlan.price > 0 ? true : existingUserPlan.isTrialUsed,
          currentPeriodStart: now,
          currentPeriodEnd: selectedPlan.price === 0 
            ? null 
            : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 dias
          analysesUsed: 0, // Reset contadores ao mudar de plano
          reportsUsed: 0
        }
      });
    } else {
      // Criar novo plano para o usuário
      userPlan = await prisma.userPlan.create({
        data: {
          userId,
          planId: selectedPlan.id,
          planType: selectedPlan.name,
          status: selectedPlan.price === 0 ? 'ACTIVE' : 'TRIAL',
          trialEndsAt: selectedPlan.price > 0 
            ? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 dias de trial
            : null,
          isTrialUsed: selectedPlan.price > 0,
          currentPeriodStart: now,
          currentPeriodEnd: selectedPlan.price === 0 
            ? null 
            : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 dias
          analysesUsed: 0,
          reportsUsed: 0
        }
      });
    }

    // Se for plano pago e está em trial, criar subscription pendente
    if (selectedPlan.price > 0 && userPlan.status === 'TRIAL') {
      await prisma.subscription.create({
        data: {
          userId,
          userPlanId: userPlan.id,
          planId: selectedPlan.id,
          status: 'PENDING',
          amount: selectedPlan.price,
          currency: selectedPlan.currency,
          interval: 'MONTHLY',
          startDate: userPlan.trialEndsAt || now
        }
      });
    }

    res.json({
      success: true,
      data: {
        userPlan,
        message: selectedPlan.price === 0 
          ? 'Plano gratuito ativado com sucesso!' 
          : 'Período de trial de 7 dias iniciado!',
        requiresPayment: selectedPlan.price > 0,
        trialDays: selectedPlan.price > 0 ? 7 : 0
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: error.errors
      });
    }

    console.error('Erro ao selecionar plano:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao selecionar plano'
    });
  }
});

// Verificar limites do plano
router.get('/check-limits', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const userPlan = await prisma.userPlan.findUnique({
      where: { userId },
      include: { plan: true }
    });

    if (!userPlan) {
      return res.status(404).json({
        success: false,
        message: 'Plano não encontrado'
      });
    }

    // Verificar se precisa resetar contadores (mensal)
    const now = new Date();
    const lastReset = new Date(userPlan.lastResetDate);
    const daysSinceReset = Math.floor((now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceReset >= 30) {
      await prisma.userPlan.update({
        where: { userId },
        data: {
          analysesUsed: 0,
          reportsUsed: 0,
          lastResetDate: now
        }
      });

      userPlan.analysesUsed = 0;
      userPlan.reportsUsed = 0;
    }

    const canAnalyze = userPlan.analysesUsed < userPlan.plan.maxAnalyses;
    const canGenerateReport = userPlan.reportsUsed < userPlan.plan.maxReports;

    res.json({
      success: true,
      data: {
        canAnalyze,
        canGenerateReport,
        limits: {
          analyses: {
            used: userPlan.analysesUsed,
            max: userPlan.plan.maxAnalyses,
            remaining: userPlan.plan.maxAnalyses - userPlan.analysesUsed
          },
          reports: {
            used: userPlan.reportsUsed,
            max: userPlan.plan.maxReports,
            remaining: userPlan.plan.maxReports - userPlan.reportsUsed
          },
          fileSize: userPlan.plan.maxFileSize,
          videoLength: userPlan.plan.maxVideoLength
        },
        resetDate: new Date(lastReset.getTime() + 30 * 24 * 60 * 60 * 1000)
      }
    });
  } catch (error) {
    console.error('Erro ao verificar limites:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar limites do plano'
    });
  }
});

export default router;