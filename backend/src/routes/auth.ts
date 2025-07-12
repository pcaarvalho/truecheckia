import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// Registro de usuário
router.post('/register', [
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres'),
  body('name').trim().isLength({ min: 2 }).withMessage('Nome deve ter pelo menos 2 caracteres')
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Erro de validação no registro:', errors.array());
      return res.status(400).json({ 
        error: 'Dados inválidos',
        details: errors.array() 
      });
    }

    const { email, password, name } = req.body;

    logger.info(`Tentativa de registro para email: ${email}`);

    // Verifica se o usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      logger.warn(`Tentativa de registro com email já existente: ${email}`);
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 12);

    // Buscar o plano FREE
    const freePlan = await prisma.plan.findFirst({
      where: { name: 'FREE' }
    });

    if (!freePlan) {
      logger.error('Plano FREE não encontrado no banco de dados');
      return res.status(500).json({ error: 'Configuração de planos incompleta' });
    }

    // Cria o usuário com plano FREE automático
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    // Criar UserPlan automático com plano FREE
    const now = new Date();
    const userPlan = await prisma.userPlan.create({
      data: {
        userId: user.id,
        planId: freePlan.id,
        planType: 'FREE',
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: null, // Plano gratuito não tem expiração
        analysesUsed: 0,
        reportsUsed: 0,
        isTrialUsed: false,
        lastResetDate: now
      }
    });

    // Verifica se as chaves JWT estão configuradas
    const jwtSecret = process.env['JWT_SECRET'];
    const jwtRefreshSecret = process.env['JWT_REFRESH_SECRET'];

    if (!jwtSecret || !jwtRefreshSecret) {
      logger.error('Chaves JWT não configuradas');
      throw new Error('Configuração de JWT incompleta');
    }

    // Gera tokens
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      jwtSecret,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      jwtRefreshSecret,
      { expiresIn: '7d' }
    );

    logger.info(`✅ Novo usuário registrado com sucesso: ${user.email}`);

    return res.status(201).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        plan: {
          ...userPlan,
          plan: freePlan,
          requiresPlanSelection: false
        },
        requiresPlanSelection: false
      },
      accessToken,
      refreshToken,
      message: 'Cadastro realizado com sucesso! Bem-vindo ao TrueCheckIA.'
    });
  } catch (error) {
    logger.error('Erro no registro:', error);
    return next(error);
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('Senha é obrigatória')
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Erro de validação no login:', errors.array());
      return res.status(400).json({ 
        error: 'Dados inválidos',
        details: errors.array() 
      });
    }

    const { email, password } = req.body;

    logger.info(`Tentativa de login para email: ${email}`);

    // Busca o usuário
    const user = await prisma.user.findUnique({
      where: { email },
      include: { 
        userPlan: {
          include: {
            plan: true
          }
        }
      }
    });

    if (!user) {
      logger.warn(`Tentativa de login com email inexistente: ${email}`);
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    if (!user.isActive) {
      logger.warn(`Tentativa de login com usuário inativo: ${email}`);
      return res.status(401).json({ error: 'Conta desativada' });
    }

    // Verifica a senha
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      logger.warn(`Senha incorreta para usuário: ${email}`);
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Verifica se as chaves JWT estão configuradas
    const jwtSecret = process.env['JWT_SECRET'];
    const jwtRefreshSecret = process.env['JWT_REFRESH_SECRET'];

    if (!jwtSecret || !jwtRefreshSecret) {
      logger.error('Chaves JWT não configuradas');
      throw new Error('Configuração de JWT incompleta');
    }

    // Gera tokens
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      jwtSecret,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      jwtRefreshSecret,
      { expiresIn: '7d' }
    );

    // Se usuário não tem plano, criar automaticamente um plano FREE
    if (!user.userPlan) {
      const freePlan = await prisma.plan.findFirst({
        where: { name: 'FREE' }
      });

      if (freePlan) {
        const now = new Date();
        const newUserPlan = await prisma.userPlan.create({
          data: {
            userId: user.id,
            planId: freePlan.id,
            planType: 'FREE',
            status: 'ACTIVE',
            currentPeriodStart: now,
            currentPeriodEnd: null,
            analysesUsed: 0,
            reportsUsed: 0,
            isTrialUsed: false,
            lastResetDate: now
          },
          include: {
            plan: true
          }
        });

        user.userPlan = newUserPlan;
      }
    }

    logger.info(`✅ Login realizado com sucesso: ${user.email}`);

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        plan: user.userPlan ? {
          ...user.userPlan,
          plan: user.userPlan.plan,
          requiresPlanSelection: false
        } : null,
        requiresPlanSelection: !user.userPlan
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    logger.error('Erro no login:', error);
    return next(error);
  }
});

// Refresh token
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token é obrigatório' });
    }

    const jwtRefreshSecret = process.env['JWT_REFRESH_SECRET'];
    if (!jwtRefreshSecret) {
      logger.error('JWT_REFRESH_SECRET não configurado');
      throw new Error('Configuração de JWT incompleta');
    }

    // Verifica o refresh token
    const decoded = jwt.verify(refreshToken, jwtRefreshSecret) as any;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, role: true, isActive: true }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    const jwtSecret = process.env['JWT_SECRET'];
    if (!jwtSecret) {
      logger.error('JWT_SECRET não configurado');
      throw new Error('Configuração de JWT incompleta');
    }

    // Gera novo access token
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      jwtSecret,
      { expiresIn: '15m' }
    );

    logger.info(`✅ Token renovado para usuário: ${user.email}`);

    return res.json({ 
      success: true,
      accessToken 
    });
  } catch (error) {
    logger.error('Erro no refresh token:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Token inválido' });
    }
    return next(error);
  }
});

// Logout
router.post('/logout', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // Em uma implementação mais robusta, você invalidaria o refresh token
    logger.info('Logout realizado');
    return res.json({ 
      success: true,
      message: 'Logout realizado com sucesso' 
    });
  } catch (error) {
    logger.error('Erro no logout:', error);
    return next(error);
  }
});

// Obter usuário autenticado (me)
router.get('/me', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
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

    if (!user.isActive) {
      return res.status(401).json({ error: 'Conta desativada' });
    }

    // Se usuário não tem plano, criar automaticamente um plano FREE
    if (!user.userPlan) {
      const freePlan = await prisma.plan.findFirst({
        where: { name: 'FREE' }
      });

      if (freePlan) {
        const now = new Date();
        const newUserPlan = await prisma.userPlan.create({
          data: {
            userId: user.id,
            planId: freePlan.id,
            planType: 'FREE',
            status: 'ACTIVE',
            currentPeriodStart: now,
            currentPeriodEnd: null,
            analysesUsed: 0,
            reportsUsed: 0,
            isTrialUsed: false,
            lastResetDate: now
          },
          include: {
            plan: true
          }
        });

        user.userPlan = newUserPlan;
      }
    }

    logger.debug(`Perfil obtido para usuário: ${user.email}`);

    return res.json({ 
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        plan: user.userPlan ? {
          ...user.userPlan,
          plan: user.userPlan.plan,
          requiresPlanSelection: false
        } : null,
        requiresPlanSelection: !user.userPlan
      }
    });
  } catch (error) {
    logger.error('Erro ao obter perfil:', error);
    return next(error);
  }
});

export { router as authRoutes }; 