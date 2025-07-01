"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseDetectionService = void 0;
const logger_1 = require("../../utils/logger");
const cacheService_1 = require("../cache/cacheService");
const metricsService_1 = require("../metrics/metricsService");
const uuid_1 = require("uuid");
class BaseDetectionService {
    constructor() {
        this.cacheService = cacheService_1.CacheService.getInstance();
        this.metricsService = metricsService_1.MetricsService.getInstance();
    }
    generateRequestId() {
        return (0, uuid_1.v4)();
    }
    async withRetry(operation, maxRetries = 3, delay = 1000) {
        let lastError;
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await operation();
            }
            catch (error) {
                lastError = error;
                logger_1.logger.warn(`Operation failed (attempt ${i + 1}/${maxRetries}):`, error);
                if (i < maxRetries - 1) {
                    await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
                }
            }
        }
        throw lastError;
    }
    recordAnalysisMetrics(provider, processingTime, success) {
        this.metricsService.recordMetric('analysis.processing_time', processingTime, { provider });
        this.metricsService.recordMetric('analysis.requests', 1, {
            provider,
            status: success ? 'success' : 'failure'
        });
    }
    async simulateProcessingDelay(min, max) {
        const delay = Math.floor(Math.random() * (max - min) + min);
        await new Promise(resolve => setTimeout(resolve, delay));
    }
    detectLanguage(text) {
        const patterns = {
            'pt-BR': /\b(de|da|do|que|para|com|por|uma|não|mais|foi|ser|está|são|tem|mas|ele|ela)\b/gi,
            'en-US': /\b(the|and|for|with|that|this|from|have|will|been|are|was|can|but|not|you|all)\b/gi,
            'es-ES': /\b(de|la|el|en|y|a|los|del|las|un|por|con|para|es|una)\b/gi,
            'fr-FR': /\b(le|de|la|les|et|des|en|un|une|pour|que|dans|par|sur|avec)\b/gi
        };
        const scores = {};
        for (const [lang, pattern] of Object.entries(patterns)) {
            const matches = text.match(pattern);
            scores[lang] = matches ? matches.length : 0;
        }
        const detectedLang = Object.entries(scores).reduce((a, b) => a[1] > b[1] ? a : b)[0];
        return detectedLang || 'unknown';
    }
    getConfidenceLevel(score) {
        if (score > 0.85)
            return 'very_high';
        if (score > 0.70)
            return 'high';
        if (score > 0.50)
            return 'medium';
        if (score > 0.30)
            return 'low';
        return 'very_low';
    }
}
exports.BaseDetectionService = BaseDetectionService;
//# sourceMappingURL=baseDetectionService.js.map