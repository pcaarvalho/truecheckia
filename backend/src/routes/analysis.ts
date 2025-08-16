import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { body, validationResult } from 'express-validator';
import { prisma } from '../config/database';
import { fileStorage } from '../config/fileStorage';
import {
  authenticateToken,
  requireActivePlan,
  checkPlanLimits,
  incrementPlanUsage,
} from '../middleware/auth';
import { uploadLimiter } from '../middleware/rateLimiter';
import { logger } from '../utils/logger';
import { addToQueue } from '../services/queue';
import { anthropicService } from '../services/anthropicService';

// Extensão da interface Request para incluir user
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    plan?: string;
  };
}

const router = Router();

// Configuração do Multer para upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      'text/plain',
      'text/markdown',
      'application/pdf',
      'video/mp4',
      'video/avi',
      'video/mov',
      'image/jpeg',
      'image/png',
      'image/gif',
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não suportado'));
    }
  },
});

/**
 * @swagger
 * /api/analysis/text:
 *   post:
 *     summary: Análise direta de texto
 *     tags: [Analysis]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - textContent
 *             properties:
 *               textContent:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 50000
 *               title:
 *                 type: string
 *                 maxLength: 200
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *     responses:
 *       200:
 *         description: Análise concluída com sucesso
 */
router.post(
  '/text',
  authenticateToken,
  requireActivePlan,
  checkPlanLimits('analyses'),
  [
    body('textContent')
      .trim()
      .isLength({ min: 10, max: 50000 })
      .withMessage('Texto deve ter entre 10 e 50000 caracteres'),
    body('title').optional().trim().isLength({ min: 1, max: 200 }),
    body('description').optional().trim().isLength({ max: 1000 }),
  ],
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { textContent, title, description } = req.body;

      if (!req.user) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const userId = req.user.id;

      logger.info(`🔍 Análise direta de texto solicitada por usuário ${userId}`);

      // Executa análise direta com Claude Opus
      const analysisResult = await anthropicService.analyzeText(textContent, title);

      // Cria registro da análise no banco
      const analysis = await prisma.analysis.create({
        data: {
          userId,
          title,
          description,
          textContent,
          contentType: 'TEXT',
          status: 'COMPLETED',
          confidence: analysisResult.confidence,
          isAIGenerated: analysisResult.isAIGenerated,
          metadata: JSON.stringify({
            provider: analysisResult.provider,
            model: analysisResult.details?.model,
            tokensUsed: analysisResult.details?.tokensUsed,
            processingTime: analysisResult.details?.processingTime,
            analysis: analysisResult.details?.analysis,
          }),
        },
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      });

      // Salva o resultado da análise
      await prisma.analysisResult.create({
        data: {
          analysisId: analysis.id,
          provider: analysisResult.provider,
          confidence: analysisResult.confidence,
          isAIGenerated: analysisResult.isAIGenerated,
          details: JSON.stringify({
            message: analysisResult.message,
            response: analysisResult.response,
            model: analysisResult.details?.model,
            tokensUsed: analysisResult.details?.tokensUsed,
            analysis: analysisResult.details?.analysis,
          }),
          processingTime: analysisResult.details?.processingTime || 0,
        },
      });

      logger.info(`✅ Análise direta concluída: ${analysis.id}`);

      // Incrementa o contador de uso do plano
      await incrementPlanUsage(userId, 'analyses');

      // Retorna o formato solicitado
      return res.status(200).json({
        message: analysisResult.message,
        provider: analysisResult.provider,
        confidence: analysisResult.confidence,
        isAIGenerated: analysisResult.isAIGenerated,
        response: analysisResult.response,
        analysisId: analysis.id,
      });
    } catch (error) {
      logger.error('❌ Erro na análise direta de texto:', error);
      return next(error);
    }
  }
);

/**
 * @swagger
 * /api/analysis:
 *   post:
 *     summary: Criar nova análise assíncrona
 *     tags: [Analysis]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/',
  authenticateToken,
  requireActivePlan,
  checkPlanLimits('analyses'),
  [
    body('title').optional().trim().isLength({ min: 1, max: 200 }),
    body('description').optional().trim().isLength({ max: 1000 }),
    body('textContent').optional().trim().isLength({ min: 10, max: 50000 }),
  ],
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { title, description, textContent } = req.body;

      if (!req.user) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const userId = req.user.id;

      // Cria a análise
      const analysis = await prisma.analysis.create({
        data: {
          userId,
          title,
          description,
          textContent,
          contentType: textContent ? 'TEXT' : 'VIDEO',
          status: 'PENDING',
        },
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      });

      // Adiciona à fila de processamento
      await addToQueue('analysis', {
        analysisId: analysis.id,
        contentType: analysis.contentType,
        textContent: analysis.textContent,
      });

      // Incrementa o contador de uso do plano
      await incrementPlanUsage(userId, 'analyses');

      logger.info(`Nova análise criada: ${analysis.id} por ${req.user.email}`);

      return res.status(201).json(analysis);
    } catch (error) {
      return next(error);
    }
  }
);

/**
 * @swagger
 * /api/analysis/upload:
 *   post:
 *     summary: Upload de arquivo para análise
 *     tags: [Analysis]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/upload',
  authenticateToken,
  requireActivePlan,
  checkPlanLimits('analyses'),
  checkPlanLimits('fileSize'),
  uploadLimiter,
  upload.single('file'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Arquivo é obrigatório' });
      }

      if (!req.user) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      // Verifica se sistema de storage está configurado
      if (!fileStorage) {
        return res
          .status(503)
          .json({ error: 'Upload de arquivos não disponível - Storage não configurado' });
      }

      const { title, description } = req.body;
      const userId = req.user.id;
      const file = req.file;

      // Upload usando o sistema de storage configurado
      const fileName = `${userId}/${Date.now()}-${file.originalname}`;
      await fileStorage.uploadFile(fileName, file.buffer, file.mimetype);

      // Determina tipo de conteúdo
      let contentType = 'TEXT';
      if (file.mimetype.startsWith('video/')) {
        contentType = 'VIDEO';
      } else if (file.mimetype.startsWith('image/')) {
        contentType = 'IMAGE';
      } else if (file.mimetype.startsWith('audio/')) {
        contentType = 'AUDIO';
      }

      // Cria a análise
      const analysis = await prisma.analysis.create({
        data: {
          userId,
          title,
          description,
          fileUrl: fileName,
          contentType: contentType as any,
          status: 'PENDING',
        },
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      });

      // Adiciona à fila de processamento
      await addToQueue('analysis', {
        analysisId: analysis.id,
        contentType: analysis.contentType,
        fileUrl: fileName,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
      });

      // Incrementa o contador de uso do plano
      await incrementPlanUsage(userId, 'analyses');

      logger.info(`Arquivo enviado: ${fileName} por ${req.user.email}`);

      return res.status(201).json(analysis);
    } catch (error) {
      return next(error);
    }
  }
);

/**
 * @swagger
 * /api/analysis/{id}/file-url:
 *   get:
 *     summary: Obter URL do arquivo de uma análise
 *     tags: [Analysis]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:id/file-url',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const { id } = req.params;
      const userId = req.user.id;

      // Busca a análise
      const analysis = await prisma.analysis.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!analysis) {
        return res.status(404).json({ error: 'Análise não encontrada' });
      }

      if (!analysis.fileUrl) {
        return res.status(404).json({ error: 'Arquivo não encontrado' });
      }

      // Gera URL do arquivo
      const fileUrl = await fileStorage.getFileUrl(analysis.fileUrl);

      return res.json({ fileUrl });
    } catch (error) {
      return next(error);
    }
  }
);

/**
 * @swagger
 * /api/analysis:
 *   get:
 *     summary: Listar análises do usuário
 *     tags: [Analysis]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const userId = req.user.id;
      const { page = 1, limit = 10, status } = req.query;

      const where: any = { userId };
      if (status) {
        where.status = status;
      }

      const analyses = await prisma.analysis.findMany({
        where,
        include: {
          results: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      });

      const total = await prisma.analysis.count({ where });

      return res.json({
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
  }
);

/**
 * @swagger
 * /api/analysis/{id}:
 *   get:
 *     summary: Obter análise específica
 *     tags: [Analysis]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:id',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const { id } = req.params;
      const userId = req.user.id;

      if (!id) {
        return res.status(400).json({ error: 'ID da análise é obrigatório' });
      }

      const analysis = await prisma.analysis.findFirst({
        where: { id, userId },
        include: {
          results: {
            orderBy: { createdAt: 'desc' },
          },
          user: {
            select: { name: true, email: true },
          },
        },
      });

      if (!analysis) {
        return res.status(404).json({ error: 'Análise não encontrada' });
      }

      return res.json(analysis);
    } catch (error) {
      return next(error);
    }
  }
);

/**
 * @swagger
 * /api/analysis/{id}:
 *   delete:
 *     summary: Deletar análise
 *     tags: [Analysis]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/:id',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const { id } = req.params;
      const userId = req.user.id;

      if (!id) {
        return res.status(400).json({ error: 'ID da análise é obrigatório' });
      }

      const analysis = await prisma.analysis.findFirst({
        where: { id, userId },
      });

      if (!analysis) {
        return res.status(404).json({ error: 'Análise não encontrada' });
      }

      // Remove arquivo do MinIO se existir
      if (analysis.fileUrl && minioClient) {
        try {
          await minioClient.removeObject(BUCKET_NAME, analysis.fileUrl);
        } catch (error) {
          logger.warn(
            `Erro ao remover arquivo do MinIO: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }

      await prisma.analysis.delete({
        where: { id },
      });

      logger.info(`Análise deletada: ${id} por ${req.user.email}`);

      return res.json({ message: 'Análise deletada com sucesso' });
    } catch (error) {
      return next(error);
    }
  }
);

export { router as analysisRoutes };
