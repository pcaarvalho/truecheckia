"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addToQueue = addToQueue;
const redis_1 = require("../config/redis");
const logger_1 = require("../utils/logger");
const memoryQueue = [];
let queueProcessing = false;
async function addToQueue(type, data) {
    const job = {
        id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        data
    };
    try {
        if (redis_1.redis) {
            await redis_1.redis.lpush('processing-queue', JSON.stringify(job));
            logger_1.logger.info(`Job ${job.id} adicionado à fila Redis`);
        }
        else {
            memoryQueue.push(job);
            logger_1.logger.info(`Job ${job.id} adicionado à fila em memória`);
            if (!queueProcessing) {
                processMemoryQueue();
            }
        }
    }
    catch (error) {
        logger_1.logger.error('Erro ao adicionar job à fila:', error);
        memoryQueue.push(job);
        if (!queueProcessing) {
            processMemoryQueue();
        }
    }
}
async function processMemoryQueue() {
    if (queueProcessing)
        return;
    queueProcessing = true;
    logger_1.logger.info('Iniciando processamento da fila em memória');
    while (memoryQueue.length > 0) {
        const job = memoryQueue.shift();
        if (job) {
            try {
                await processJob(job);
                logger_1.logger.info(`Job ${job.id} processado com sucesso`);
            }
            catch (error) {
                logger_1.logger.error(`Erro ao processar job ${job.id}:`, error);
            }
        }
    }
    queueProcessing = false;
    logger_1.logger.info('Processamento da fila em memória finalizado');
}
async function processJob(job) {
    const { type, data } = job;
    switch (type) {
        case 'analysis':
            await processAnalysisJob(data);
            break;
        case 'report':
            await processReportJob(data);
            break;
        default:
            logger_1.logger.warn(`Tipo de job desconhecido: ${type}`);
    }
}
async function processAnalysisJob(data) {
    logger_1.logger.info(`Processando análise: ${data.analysisId}`);
    try {
        const { prisma } = require('../config/database');
        const { anthropicService } = require('./anthropicService');
        await prisma.analysis.update({
            where: { id: data.analysisId },
            data: { status: 'PROCESSING' }
        });
        let result;
        if (data.textContent) {
            result = await anthropicService.analyzeText(data.textContent);
        }
        else {
            result = {
                provider: 'TrueCheckIA',
                confidence: 75.0,
                isAIGenerated: false,
                details: {
                    message: 'Análise de arquivo não implementada ainda',
                    processingTime: 100
                }
            };
        }
        await prisma.analysis.update({
            where: { id: data.analysisId },
            data: {
                status: 'COMPLETED',
                confidence: result.confidence,
                isAIGenerated: result.isAIGenerated,
                metadata: JSON.stringify(result.details || {})
            }
        });
        await prisma.analysisResult.create({
            data: {
                analysisId: data.analysisId,
                provider: result.provider,
                confidence: result.confidence,
                isAIGenerated: result.isAIGenerated,
                details: JSON.stringify({
                    message: result.details?.message || 'Análise concluída',
                    response: result.details?.response || 'Sem resposta específica',
                    ...(result.details || {})
                }),
                processingTime: result.details?.processingTime || 0
            }
        });
        logger_1.logger.info(`Análise ${data.analysisId} concluída com sucesso`);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        logger_1.logger.error(`Erro ao processar análise ${data.analysisId}:`, error);
        try {
            const { prisma } = require('../config/database');
            await prisma.analysis.update({
                where: { id: data.analysisId },
                data: {
                    status: 'FAILED',
                    metadata: JSON.stringify({ error: errorMessage })
                }
            });
        }
        catch (updateError) {
            logger_1.logger.error('Erro ao atualizar status de falha:', updateError);
        }
    }
}
async function processReportJob(data) {
    logger_1.logger.info(`Processando relatório: ${data.reportId}`);
}
//# sourceMappingURL=queue.js.map