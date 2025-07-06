import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        id: string;
        email: string;
        role: string;
        plan?: string;
      };
    }
  }
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      logger.warn('Tentativa de acesso sem token de autorização');
      return res.status(401).json({ error: 'Token de acesso é obrigatório' });
    }

    const secret = process.env['JWT_SECRET'];
    if (!secret) {
      logger.error('JWT_SECRET não configurado');
      throw new Error('JWT_SECRET não configurado');
    }

    const decoded = jwt.verify(token, secret) as JwtPayload;
    
    // Verifica se o usuário ainda existe e está ativo
    const user = await prisma.user.findUnique({
      where: { id: decoded['userId'] },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true
      }
    });

    if (!user) {
      logger.warn(`Token válido mas usuário não encontrado: ${decoded['userId']}`);
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    if (!user.isActive) {
      logger.warn(`Token válido mas usuário inativo: ${user.email}`);
      return res.status(401).json({ error: 'Usuário inativo' });
    }

    req.user = {
      userId: user.id,
      id: user.id,
      email: user.email,
      role: user.role
    };

    logger.debug(`Usuário autenticado: ${user.email}`);
    return next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('Token inválido fornecido');
      return res.status(403).json({ error: 'Token inválido' });
    }
    if (error instanceof jwt.TokenExpiredError) {
      logger.warn('Token expirado fornecido');
      return res.status(401).json({ error: 'Token expirado' });
    }
    
    logger.error('Erro na autenticação:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const requireRole = (roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Autenticação necessária' });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { role: true }
      });

      if (!user || !roles.includes(user.role)) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Autenticação necessária' });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
  }

  return next();
};

export const requireOwnerOrAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Autenticação necessária' });
  }

  const resourceUserId = req.params['userId'] || req.body['userId'];
  
  if (req.user.role !== 'ADMIN' && req.user.id !== resourceUserId) {
    return res.status(403).json({ error: 'Acesso negado. Você só pode acessar seus próprios recursos.' });
  }

  return next();
};

export const rateLimit = (maxRequests: number, windowMs: number) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
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

export const requireActivePlan = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Autenticação necessária' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        userPlan: {
          include: {
            plan: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Se não tem plano, redireciona para seleção
    if (!user.userPlan) {
      return res.status(402).json({ 
        error: 'Selecione um plano para continuar',
        requiresPlanSelection: true
      });
    }

    // Verifica status do plano
    if (user.userPlan.status === 'EXPIRED' || user.userPlan.status === 'CANCELLED') {
      return res.status(403).json({ 
        error: 'Plano expirado ou cancelado. Renove seu plano para continuar.',
        requiresPlanRenewal: true
      });
    }

    // Verifica trial expirado
    if (user.userPlan.status === 'TRIAL' && user.userPlan.trialEndsAt && user.userPlan.trialEndsAt < new Date()) {
      return res.status(402).json({ 
        error: 'Período de trial expirado. Selecione um plano pago para continuar.',
        trialExpired: true
      });
    }

    req.user = {
      ...req.user,
      plan: user.userPlan.planType
    };

    return next();
  } catch (error) {
    console.error('Erro ao verificar plano:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const checkPlanLimits = (feature: 'analyses' | 'reports' | 'fileSize' | 'videoLength') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticação necessária' });
    }

    try {
      const userPlan = await prisma.userPlan.findUnique({
        where: { userId: req.user.id },
        include: {
          plan: true
        }
      });

      if (!userPlan) {
        return res.status(402).json({ 
          error: 'Selecione um plano para continuar',
          requiresPlanSelection: true
        });
      }

      const plan = userPlan.plan;

      // Verifica limites baseados no recurso
      switch (feature) {
        case 'analyses':
          if (userPlan.analysesUsed >= plan.maxAnalyses) {
            return res.status(403).json({ 
              error: `Limite de análises do plano ${plan.displayName} atingido (${plan.maxAnalyses}/mês)`,
              limit: plan.maxAnalyses,
              used: userPlan.analysesUsed,
              upgradeRequired: true
            });
          }
          break;

        case 'reports':
          if (userPlan.reportsUsed >= plan.maxReports) {
            return res.status(403).json({ 
              error: `Limite de relatórios do plano ${plan.displayName} atingido (${plan.maxReports}/mês)`,
              limit: plan.maxReports,
              used: userPlan.reportsUsed,
              upgradeRequired: true
            });
          }
          break;

        case 'fileSize':
          // Verifica tamanho do arquivo no corpo da requisição
          const fileSizeMB = req.file ? req.file.size / (1024 * 1024) : 0;
          if (fileSizeMB > plan.maxFileSize) {
            return res.status(403).json({ 
              error: `Arquivo muito grande. Limite do plano ${plan.displayName}: ${plan.maxFileSize}MB`,
              limit: plan.maxFileSize,
              fileSize: fileSizeMB,
              upgradeRequired: true
            });
          }
          break;

        case 'videoLength':
          // Verifica duração do vídeo (seria implementado após análise do arquivo)
          const videoLengthMinutes = req.body.videoLength || 0;
          if (videoLengthMinutes > plan.maxVideoLength) {
            return res.status(403).json({ 
              error: `Vídeo muito longo. Limite do plano ${plan.displayName}: ${plan.maxVideoLength} minutos`,
              limit: plan.maxVideoLength,
              videoLength: videoLengthMinutes,
              upgradeRequired: true
            });
          }
          break;
      }

      // Verifica se precisa resetar contadores mensais
      const now = new Date();
      const lastReset = new Date(userPlan.lastResetDate);
      const daysSinceReset = Math.floor((now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSinceReset >= 30) {
        await prisma.userPlan.update({
          where: { id: userPlan.id },
          data: {
            analysesUsed: 0,
            reportsUsed: 0,
            lastResetDate: now
          }
        });
      }

      return next();
    } catch (error) {
      console.error('Erro ao verificar limites:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  };
};

// Função auxiliar para incrementar uso de recursos
export const incrementPlanUsage = async (userId: string, resource: 'analyses' | 'reports') => {
  try {
    const userPlan = await prisma.userPlan.findUnique({
      where: { userId }
    });

    if (!userPlan) {
      console.warn(`UserPlan não encontrado para usuário ${userId}`);
      return;
    }

    const updateData = resource === 'analyses' 
      ? { analysesUsed: { increment: 1 } }
      : { reportsUsed: { increment: 1 } };

    await prisma.userPlan.update({
      where: { userId },
      data: updateData
    });
  } catch (error) {
    console.error(`Erro ao incrementar uso de ${resource}:`, error);
  }
};