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
        userPlan: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Se não tem plano, usa o plano FREE
    if (!user.userPlan) {
      req.user = {
        ...req.user,
        plan: 'FREE'
      };
      return next();
    }

    // Verifica se o plano está ativo
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
  } catch (error) {
    console.error('Erro ao verificar plano:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export const checkPlanLimits = (feature: 'analyses' | 'reports' | 'storage') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticação necessária' });
    }

    try {
      const user = await prisma.user.findUnique({
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
        // Plano FREE
        const limits = {
          analyses: 5,
          reports: 3,
          storage: 100 // MB
        };

        const currentUsage = await getCurrentUsage(req.user.id, feature);
        
        if (currentUsage >= limits[feature]) {
          return res.status(403).json({ 
            error: `Limite do plano FREE atingido para ${feature}. Faça upgrade para continuar.`
          });
        }
      } else {
        // Verifica limites do plano pago
        const limits = {
          analyses: plan.maxAnalyses,
          reports: 10, // Valor padrão para planos pagos
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
    } catch (error) {
      console.error('Erro ao verificar limites:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  };
};

async function getCurrentUsage(userId: string, feature: string): Promise<number> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  switch (feature) {
    case 'analyses':
      return await prisma.analysis.count({
        where: {
          userId,
          createdAt: {
            gte: startOfMonth
          }
        }
      });
    
    case 'reports':
      return await prisma.report.count({
        where: {
          userId,
          createdAt: {
            gte: startOfMonth
          }
        }
      });
    
    case 'storage':
      // Simula cálculo de armazenamento usado
      const analyses = await prisma.analysis.findMany({
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
      
      // Simula tamanho médio de 1MB por análise
      return analyses.length * 1024 * 1024;
    
    default:
      return 0;
  }
}