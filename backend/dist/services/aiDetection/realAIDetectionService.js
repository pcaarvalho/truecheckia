"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealAIDetectionService = void 0;
const logger_1 = require("../../utils/logger");
const anthropicService_1 = require("../anthropicService");
const baseDetectionService_1 = require("./baseDetectionService");
const queueService_1 = require("../queue/queueService");
const mockAIDetectionService_1 = require("./mockAIDetectionService");
class RealAIDetectionService extends baseDetectionService_1.BaseDetectionService {
    constructor() {
        super();
        this.queueService = queueService_1.QueueService.getInstance();
        this.mockService = mockAIDetectionService_1.MockAIDetectionService.getInstance();
        this.setupQueueHandlers();
    }
    static getInstance() {
        if (!RealAIDetectionService.instance) {
            RealAIDetectionService.instance = new RealAIDetectionService();
        }
        return RealAIDetectionService.instance;
    }
    setupQueueHandlers() {
        this.queueService.on('job:process', async (job) => {
            try {
                const { type, data } = job.data;
                let result;
                if (type === 'text') {
                    result = await this.processTextAnalysis(data);
                }
                else if (type === 'video') {
                    result = await this.processVideoAnalysis(data);
                }
                this.queueService.completeJob(job.id, result);
            }
            catch (error) {
                this.queueService.failJob(job.id, error);
            }
        });
    }
    async analyzeText(data, config) {
        const requestId = data.requestId || this.generateRequestId();
        const startTime = Date.now();
        logger_1.logger.info(`🔍 Iniciando análise real de texto: ${data.title || 'Sem título'} [${requestId}]`);
        if (config?.cacheResults !== false) {
            const cacheKey = this.cacheService.generateKey({ type: 'text', content: data.textContent });
            const cached = this.cacheService.get(cacheKey);
            if (cached) {
                logger_1.logger.info(`✅ Resultado encontrado em cache [${requestId}]`);
                return cached;
            }
        }
        try {
            if (config?.priority === 'high') {
                return await this.processTextAnalysis(data, requestId);
            }
            const jobId = await this.queueService.addJob({
                type: 'text',
                data: { ...data, requestId }
            }, {
                priority: config?.priority === 'low' ? 0 : 1
            });
            return await this.waitForJobCompletion(jobId, config?.timeout || 30000);
        }
        catch (error) {
            logger_1.logger.error(`❌ Erro na análise real de texto [${requestId}]:`, error);
            this.recordAnalysisMetrics('anthropic', Date.now() - startTime, false);
            if (config?.maxRetries === 0)
                throw error;
            logger_1.logger.warn('Usando análise mock como fallback');
            return this.mockService.analyzeText(data);
        }
    }
    async processTextAnalysis(data, requestId) {
        const startTime = Date.now();
        requestId = requestId || this.generateRequestId();
        const anthropicResult = await this.withRetry(() => anthropicService_1.anthropicService.analyzeText(data.textContent, data.title || ''), 3, 2000);
        const result = {
            provider: anthropicResult.provider,
            confidence: anthropicResult.confidence,
            isAIGenerated: anthropicResult.isAIGenerated,
            details: {
                message: anthropicResult.message,
                response: anthropicResult.response,
                model: anthropicResult.details?.model,
                tokensUsed: anthropicResult.details?.tokensUsed,
                analysis: anthropicResult.details?.analysis,
                wordCount: data.textContent.split(/\s+/).length,
                textLength: data.textContent.length,
                language: this.detectLanguage(data.textContent)
            },
            processingTime: Date.now() - startTime,
            timestamp: new Date(),
            requestId
        };
        this.recordAnalysisMetrics('anthropic', result.processingTime, true);
        const cacheKey = this.cacheService.generateKey({ type: 'text', content: data.textContent });
        this.cacheService.set(cacheKey, [result], 3600000);
        logger_1.logger.info(`✅ Análise real de texto concluída em ${result.processingTime}ms [${requestId}]`);
        return [result];
    }
    async analyzeVideo(data, _config) {
        const requestId = data.requestId || this.generateRequestId();
        const startTime = Date.now();
        logger_1.logger.info(`🎥 Iniciando análise de vídeo: ${data.title || 'Sem título'} [${requestId}]`);
        const results = await this.mockService.analyzeVideo(data);
        results.forEach(result => {
            result.timestamp = new Date();
            result.requestId = requestId;
        });
        this.recordAnalysisMetrics('video', Date.now() - startTime, true);
        logger_1.logger.info(`✅ Análise de vídeo concluída em ${Date.now() - startTime}ms [${requestId}]`);
        return results;
    }
    async processVideoAnalysis(data) {
        return this.mockService.analyzeVideo(data);
    }
    async waitForJobCompletion(jobId, timeout) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error(`Job ${jobId} timeout after ${timeout}ms`));
            }, timeout);
            this.queueService.once(`job:completed`, (job) => {
                if (job.id === jobId) {
                    clearTimeout(timer);
                    resolve(job.data);
                }
            });
            this.queueService.once(`job:failed`, (job) => {
                if (job.id === jobId) {
                    clearTimeout(timer);
                    reject(job.error);
                }
            });
        });
    }
    getQueueStatus() {
        return this.queueService.getQueueStatus();
    }
    getMetrics() {
        return {
            totalRequests: this.metricsService.getAggregatedMetrics('analysis.requests', 'count'),
            successRate: this.calculateSuccessRate(),
            averageProcessingTime: this.metricsService.getAggregatedMetrics('analysis.processing_time', 'avg'),
            queueStatus: this.getQueueStatus(),
            cacheStats: this.cacheService.getStats()
        };
    }
    calculateSuccessRate() {
        const successCount = this.metricsService.getMetrics('analysis.requests', { status: 'success' }).length;
        const totalCount = this.metricsService.getAggregatedMetrics('analysis.requests', 'count');
        return totalCount > 0 ? (successCount / totalCount) * 100 : 0;
    }
    clearCache() {
        this.cacheService.clear();
    }
    clearQueue() {
        this.queueService.clearQueue();
    }
}
exports.RealAIDetectionService = RealAIDetectionService;
//# sourceMappingURL=realAIDetectionService.js.map