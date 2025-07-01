"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportRoutes = void 0;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const database_1 = require("../config/database");
const auth_1 = require("../middleware/auth");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
exports.reportRoutes = router;
router.get('/', auth_1.authenticateToken, async (req, res, next) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Usuário não autenticado' });
        const userId = req.user['id'];
        const { page = 1, limit = 10, status, type } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = { userId };
        if (status)
            where.status = status;
        if (type)
            where.type = type;
        const [reports, total] = await Promise.all([
            database_1.prisma.report.findMany({
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
            database_1.prisma.report.count({ where })
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
    }
    catch (error) {
        return next(error);
    }
});
router.get('/:id', auth_1.authenticateToken, async (req, res, next) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Usuário não autenticado' });
        const userId = req.user['id'];
        const reportId = req.params['id'];
        if (!reportId)
            return res.status(400).json({ error: 'ID do relatório não informado' });
        const report = await database_1.prisma.report.findFirst({
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
    }
    catch (error) {
        return next(error);
    }
});
router.post('/', auth_1.authenticateToken, [
    (0, express_validator_1.body)('analysisId').isUUID(),
    (0, express_validator_1.body)('title').trim().isLength({ min: 1, max: 200 }),
    (0, express_validator_1.body)('description').optional().trim().isLength({ max: 1000 }),
    (0, express_validator_1.body)('type').isIn(['DETAILED', 'SUMMARY', 'EXECUTIVE'])
], async (req, res, next) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        if (!req.user)
            return res.status(401).json({ error: 'Usuário não autenticado' });
        const userId = req.user.id;
        const { analysisId, title, type } = req.body;
        const analysis = await database_1.prisma.analysis.findFirst({
            where: {
                id: analysisId,
                userId,
                status: 'COMPLETED'
            }
        });
        if (!analysis) {
            return res.status(404).json({ error: 'Análise não encontrada ou não concluída' });
        }
        const existingReport = await database_1.prisma.report.findFirst({
            where: {
                analysisId,
                userId
            }
        });
        if (existingReport) {
            return res.status(400).json({ error: 'Já existe um relatório para esta análise' });
        }
        const report = await database_1.prisma.report.create({
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
        logger_1.logger.info(`Relatório criado: ${report.id} para análise ${analysisId}`);
        res.status(201).json({ report });
    }
    catch (error) {
        return next(error);
    }
});
router.put('/:id', auth_1.authenticateToken, [
    (0, express_validator_1.body)('title').optional().trim().isLength({ min: 1, max: 200 }),
    (0, express_validator_1.body)('description').optional().trim().isLength({ max: 1000 })
], async (req, res, next) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        if (!req.user)
            return res.status(401).json({ error: 'Usuário não autenticado' });
        const userId = req.user.id;
        const reportId = req.params['id'];
        if (!reportId)
            return res.status(400).json({ error: 'ID do relatório não informado' });
        const report = await database_1.prisma.report.findFirst({
            where: {
                id: reportId,
                userId
            }
        });
        if (!report) {
            return res.status(404).json({ error: 'Relatório não encontrado' });
        }
        const updateData = {};
        if (req.body.title)
            updateData.title = req.body.title;
        const updatedReport = await database_1.prisma.report.update({
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
        logger_1.logger.info(`Relatório atualizado: ${reportId}`);
        res.json({ report: updatedReport });
    }
    catch (error) {
        return next(error);
    }
});
router.delete('/:id', auth_1.authenticateToken, async (req, res, next) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Usuário não autenticado' });
        const userId = req.user.id;
        const reportId = req.params['id'];
        if (!reportId)
            return res.status(400).json({ error: 'ID do relatório não informado' });
        const report = await database_1.prisma.report.findFirst({
            where: {
                id: reportId,
                userId
            }
        });
        if (!report) {
            return res.status(404).json({ error: 'Relatório não encontrado' });
        }
        await database_1.prisma.report.delete({
            where: { id: reportId }
        });
        logger_1.logger.info(`Relatório excluído: ${reportId}`);
        res.json({ message: 'Relatório excluído com sucesso' });
    }
    catch (error) {
        return next(error);
    }
});
router.get('/:id/export', auth_1.authenticateToken, async (req, res, next) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Usuário não autenticado' });
        const userId = req.user.id;
        const reportId = req.params['id'];
        if (!reportId)
            return res.status(400).json({ error: 'ID do relatório não informado' });
        const format = req.query['format'] || 'pdf';
        const report = await database_1.prisma.report.findFirst({
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
        const fileName = `relatorio_${reportId}.${format}`;
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
    }
    catch (error) {
        return next(error);
    }
});
//# sourceMappingURL=reports.js.map