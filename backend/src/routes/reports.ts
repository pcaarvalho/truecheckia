import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../config/database';
import { authenticateToken, requireActivePlan, checkPlanLimits, incrementPlanUsage } from '../middleware/auth';
import { logger } from '../utils/logger';
import { Request, Response, NextFunction } from 'express';

const router = Router();

// Listar relatórios do usuário
router.get('/', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Usuário não autenticado' });
    const userId = req.user['id'];
    const { page = 1, limit = 10, status, type } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    
    const where: any = { userId };
    if (status) where.status = status;
    if (type) where.type = type;

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          analysis: {
            select: {
              id: true,
              title: true,
              contentType: true,
              status: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.report.count({ where })
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
  } catch (error) {
    return next(error);
  }
});

// Obter relatório específico
router.get('/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Usuário não autenticado' });
    const userId = req.user['id'];
    const reportId = req.params['id'];
    if (!reportId) return res.status(400).json({ error: 'ID do relatório não informado' });

    const report = await prisma.report.findFirst({
      where: {
        id: reportId,
        userId
      },
      include: {
        analysis: {
          include: {
            results: true
          }
        }
      }
    });

    if (!report) {
      return res.status(404).json({ error: 'Relatório não encontrado' });
    }

    res.json({ report });
  } catch (error) {
    return next(error);
  }
});

// Criar novo relatório
router.post('/', 
  authenticateToken,
  requireActivePlan,
  checkPlanLimits('reports'),
  [
    body('analysisId').isUUID(),
    body('title').trim().isLength({ min: 1, max: 200 }),
    body('description').optional().trim().isLength({ max: 1000 }),
    body('type').isIn(['DETAILED', 'SUMMARY', 'EXECUTIVE'])
  ], 
  async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.user) return res.status(401).json({ error: 'Usuário não autenticado' });
    const userId = req.user.id;
    const { analysisId, title, type } = req.body;

    // Verifica se a análise pertence ao usuário e está completa
    const analysis = await prisma.analysis.findFirst({
      where: {
        id: analysisId,
        userId,
        status: 'COMPLETED'
      }
    });

    if (!analysis) {
      return res.status(404).json({ error: 'Análise não encontrada ou não concluída' });
    }

    // Verifica se já existe um relatório para esta análise
    const existingReport = await prisma.report.findFirst({
      where: {
        analysisId,
        userId
      }
    });

    if (existingReport) {
      return res.status(400).json({ error: 'Já existe um relatório para esta análise' });
    }

    // Gera dados do relatório baseado na análise
    const report = await prisma.report.create({
      data: {
        title,
        type,
        analysisId,
        userId,
        content: ''
      },
      include: {
        analysis: {
          select: {
            id: true,
            title: true,
            contentType: true
          }
        }
      }
    });

    // Incrementa o contador de uso do plano
    await incrementPlanUsage(userId, 'reports');

    logger.info(`Relatório criado: ${report.id} para análise ${analysisId}`);

    res.status(201).json({ report });
  } catch (error) {
    return next(error);
  }
});

// Atualizar relatório
router.put('/:id', authenticateToken, [
  body('title').optional().trim().isLength({ min: 1, max: 200 }),
  body('description').optional().trim().isLength({ max: 1000 })
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.user) return res.status(401).json({ error: 'Usuário não autenticado' });
    const userId = req.user.id;
    const reportId = req.params['id'];
    if (!reportId) return res.status(400).json({ error: 'ID do relatório não informado' });

    const report = await prisma.report.findFirst({
      where: {
        id: reportId,
        userId
      }
    });

    if (!report) {
      return res.status(404).json({ error: 'Relatório não encontrado' });
    }

    const updateData: any = {};
    if (req.body.title) updateData.title = req.body.title;

    const updatedReport = await prisma.report.update({
      where: { id: reportId },
      data: updateData,
      include: {
        analysis: {
          select: {
            id: true,
            title: true,
            contentType: true
          }
        }
      }
    });

    logger.info(`Relatório atualizado: ${reportId}`);

    res.json({ report: updatedReport });
  } catch (error) {
    return next(error);
  }
});

// Excluir relatório
router.delete('/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Usuário não autenticado' });
    const userId = req.user.id;
    const reportId = req.params['id'];
    if (!reportId) return res.status(400).json({ error: 'ID do relatório não informado' });

    const report = await prisma.report.findFirst({
      where: {
        id: reportId,
        userId
      }
    });

    if (!report) {
      return res.status(404).json({ error: 'Relatório não encontrado' });
    }

    await prisma.report.delete({
      where: { id: reportId }
    });

    logger.info(`Relatório excluído: ${reportId}`);

    res.json({ message: 'Relatório excluído com sucesso' });
  } catch (error) {
    return next(error);
  }
});

// Exportar relatório (simulado)
router.get('/:id/export', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Usuário não autenticado' });
    const userId = req.user.id;
    const reportId = req.params['id'];
    if (!reportId) return res.status(400).json({ error: 'ID do relatório não informado' });
    const format = req.query['format'] || 'pdf';

    const report = await prisma.report.findFirst({
      where: {
        id: reportId,
        userId
      },
      include: {
        analysis: {
          include: {
            results: true
          }
        }
      }
    });

    if (!report) {
      return res.status(404).json({ error: 'Relatório não encontrado' });
    }

    // Simula geração do arquivo
    const fileName = `relatorio_${reportId}.${format}`;
    
    // Em produção, aqui seria gerado o arquivo real
    const exportData = {
      reportId: report.id,
      title: report.title,
      type: report.type,
      analysis: {
        title: report.analysis ? report.analysis.title : '',
        contentType: report.analysis ? report.analysis.contentType : '',
        results: report.analysis ? report.analysis.results : []
      },
      exportedAt: new Date().toISOString(),
      format
    };

    res.json({
      message: 'Relatório exportado com sucesso',
      fileName,
      downloadUrl: `/api/reports/${reportId}/download/${fileName}`,
      data: exportData
    });
  } catch (error) {
    return next(error);
  }
});

export { router as reportRoutes }; 