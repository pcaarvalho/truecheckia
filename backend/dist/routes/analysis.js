"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analysisRoutes = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const express_validator_1 = require("express-validator");
const database_1 = require("../config/database");
const minio_1 = require("../config/minio");
const auth_1 = require("../middleware/auth");
const rateLimiter_1 = require("../middleware/rateLimiter");
const logger_1 = require("../utils/logger");
const queue_1 = require("../services/queue");
const anthropicService_1 = require("../services/anthropicService");
const router = (0, express_1.Router)();
exports.analysisRoutes = router;
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 100 * 1024 * 1024,
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
            'image/gif'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Tipo de arquivo não suportado'));
        }
    }
});
router.post('/text', auth_1.authenticateToken, [
    (0, express_validator_1.body)('textContent').trim().isLength({ min: 10, max: 50000 }).withMessage('Texto deve ter entre 10 e 50000 caracteres'),
    (0, express_validator_1.body)('title').optional().trim().isLength({ min: 1, max: 200 }),
    (0, express_validator_1.body)('description').optional().trim().isLength({ max: 1000 })
], async (req, res, next) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { textContent, title, description } = req.body;
        if (!req.user) {
            return res.status(401).json({ error: 'Usuário não autenticado' });
        }
        const userId = req.user.id;
        logger_1.logger.info(`🔍 Análise direta de texto solicitada por usuário ${userId}`);
        const analysisResult = await anthropicService_1.anthropicService.analyzeText(textContent, title);
        const analysis = await database_1.prisma.analysis.create({
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
                    analysis: analysisResult.details?.analysis
                })
            },
            include: {
                user: {
                    select: { name: true, email: true }
                }
            }
        });
        await database_1.prisma.analysisResult.create({
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
                    analysis: analysisResult.details?.analysis
                }),
                processingTime: analysisResult.details?.processingTime || 0
            }
        });
        logger_1.logger.info(`✅ Análise direta concluída: ${analysis.id}`);
        return res.status(200).json({
            message: analysisResult.message,
            provider: analysisResult.provider,
            confidence: analysisResult.confidence,
            isAIGenerated: analysisResult.isAIGenerated,
            response: analysisResult.response,
            analysisId: analysis.id
        });
    }
    catch (error) {
        logger_1.logger.error('❌ Erro na análise direta de texto:', error);
        return next(error);
    }
});
router.post('/', auth_1.authenticateToken, [
    (0, express_validator_1.body)('title').optional().trim().isLength({ min: 1, max: 200 }),
    (0, express_validator_1.body)('description').optional().trim().isLength({ max: 1000 }),
    (0, express_validator_1.body)('textContent').optional().trim().isLength({ min: 10, max: 50000 })
], async (req, res, next) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { title, description, textContent } = req.body;
        if (!req.user) {
            return res.status(401).json({ error: 'Usuário não autenticado' });
        }
        const userId = req.user.id;
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId },
            include: { userPlan: true }
        });
        if (!user?.userPlan) {
            return res.status(400).json({ error: 'Plano não encontrado' });
        }
        const analysisCount = await database_1.prisma.analysis.count({
            where: { userId }
        });
        if (analysisCount >= user.userPlan.maxAnalyses) {
            return res.status(403).json({ error: 'Limite de análises atingido' });
        }
        const analysis = await database_1.prisma.analysis.create({
            data: {
                userId,
                title,
                description,
                textContent,
                contentType: textContent ? 'TEXT' : 'VIDEO',
                status: 'PENDING'
            },
            include: {
                user: {
                    select: { name: true, email: true }
                }
            }
        });
        await (0, queue_1.addToQueue)('analysis', {
            analysisId: analysis.id,
            contentType: analysis.contentType,
            textContent: analysis.textContent
        });
        logger_1.logger.info(`Nova análise criada: ${analysis.id} por ${user.email}`);
        return res.status(201).json(analysis);
    }
    catch (error) {
        return next(error);
    }
});
router.post('/upload', auth_1.authenticateToken, rateLimiter_1.uploadLimiter, upload.single('file'), async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Arquivo é obrigatório' });
        }
        if (!req.user) {
            return res.status(401).json({ error: 'Usuário não autenticado' });
        }
        if (!minio_1.minioClient) {
            return res.status(503).json({ error: 'Upload de arquivos não disponível - MinIO não configurado' });
        }
        const { title, description } = req.body;
        const userId = req.user.id;
        const file = req.file;
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId },
            include: { userPlan: true }
        });
        if (!user?.userPlan) {
            return res.status(400).json({ error: 'Plano não encontrado' });
        }
        const fileSizeMB = file.size / (1024 * 1024);
        if (fileSizeMB > user.userPlan.maxFileSize) {
            return res.status(400).json({
                error: `Arquivo muito grande. Máximo permitido: ${user.userPlan.maxFileSize}MB`
            });
        }
        const fileName = `${userId}/${Date.now()}-${file.originalname}`;
        await minio_1.minioClient.putObject(minio_1.BUCKET_NAME, fileName, file.buffer);
        let contentType = 'TEXT';
        if (file.mimetype.startsWith('video/')) {
            contentType = 'VIDEO';
        }
        else if (file.mimetype.startsWith('image/')) {
            contentType = 'IMAGE';
        }
        else if (file.mimetype.startsWith('audio/')) {
            contentType = 'AUDIO';
        }
        const analysis = await database_1.prisma.analysis.create({
            data: {
                userId,
                title,
                description,
                fileUrl: fileName,
                contentType: contentType,
                status: 'PENDING'
            },
            include: {
                user: {
                    select: { name: true, email: true }
                }
            }
        });
        await (0, queue_1.addToQueue)('analysis', {
            analysisId: analysis.id,
            contentType: analysis.contentType,
            fileUrl: fileName
        });
        logger_1.logger.info(`Arquivo enviado: ${fileName} por ${user.email}`);
        return res.status(201).json(analysis);
    }
    catch (error) {
        return next(error);
    }
});
router.get('/', auth_1.authenticateToken, async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Usuário não autenticado' });
        }
        const userId = req.user.id;
        const { page = 1, limit = 10, status } = req.query;
        const where = { userId };
        if (status) {
            where.status = status;
        }
        const analyses = await database_1.prisma.analysis.findMany({
            where,
            include: {
                results: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: { createdAt: 'desc' },
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit)
        });
        const total = await database_1.prisma.analysis.count({ where });
        return res.json({
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
router.get('/:id', auth_1.authenticateToken, async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Usuário não autenticado' });
        }
        const { id } = req.params;
        const userId = req.user.id;
        if (!id) {
            return res.status(400).json({ error: 'ID da análise é obrigatório' });
        }
        const analysis = await database_1.prisma.analysis.findFirst({
            where: { id, userId },
            include: {
                results: {
                    orderBy: { createdAt: 'desc' }
                },
                user: {
                    select: { name: true, email: true }
                }
            }
        });
        if (!analysis) {
            return res.status(404).json({ error: 'Análise não encontrada' });
        }
        return res.json(analysis);
    }
    catch (error) {
        return next(error);
    }
});
router.delete('/:id', auth_1.authenticateToken, async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Usuário não autenticado' });
        }
        const { id } = req.params;
        const userId = req.user.id;
        if (!id) {
            return res.status(400).json({ error: 'ID da análise é obrigatório' });
        }
        const analysis = await database_1.prisma.analysis.findFirst({
            where: { id, userId }
        });
        if (!analysis) {
            return res.status(404).json({ error: 'Análise não encontrada' });
        }
        if (analysis.fileUrl && minio_1.minioClient) {
            try {
                await minio_1.minioClient.removeObject(minio_1.BUCKET_NAME, analysis.fileUrl);
            }
            catch (error) {
                logger_1.logger.warn(`Erro ao remover arquivo do MinIO: ${error}`);
            }
        }
        await database_1.prisma.analysis.delete({
            where: { id }
        });
        logger_1.logger.info(`Análise deletada: ${id} por ${req.user.email}`);
        return res.json({ message: 'Análise deletada com sucesso' });
    }
    catch (error) {
        return next(error);
    }
});
//# sourceMappingURL=analysis.js.map