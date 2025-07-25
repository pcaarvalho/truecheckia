"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockAIDetectionService = void 0;
const logger_1 = require("../../utils/logger");
const baseDetectionService_1 = require("./baseDetectionService");
const textAnalyzer_1 = require("../../utils/textAnalyzer");
const videoAnalyzer_1 = require("../../utils/videoAnalyzer");
class MockAIDetectionService extends baseDetectionService_1.BaseDetectionService {
    constructor() {
        super();
    }
    static getInstance() {
        if (!MockAIDetectionService.instance) {
            MockAIDetectionService.instance = new MockAIDetectionService();
        }
        return MockAIDetectionService.instance;
    }
    async analyzeText(data) {
        const startTime = Date.now();
        const requestId = data.requestId || this.generateRequestId();
        logger_1.logger.info(`🔍 Iniciando análise mock de texto: ${data.title || 'Sem título'} [${requestId}]`);
        await this.simulateProcessingDelay(1000, 3000);
        const textAnalysis = textAnalyzer_1.TextAnalyzer.analyzeTextCharacteristics(data.textContent);
        const baseScore = textAnalyzer_1.TextAnalyzer.calculateTextScore(textAnalysis);
        const providers = ['GPTZero', 'Hive', 'OpenAI'];
        const results = providers.map((provider, index) => {
            const adjustedScore = this.adjustScore(baseScore, 0.1 + (index * 0.05));
            const processingTime = Date.now() - startTime + (index * 200);
            const result = {
                provider,
                confidence: adjustedScore,
                isAIGenerated: this.determineIfAI(provider, baseScore),
                details: this.generateProviderDetails(provider, baseScore, textAnalysis),
                processingTime,
                timestamp: new Date(),
                requestId
            };
            this.recordAnalysisMetrics(provider.toLowerCase(), processingTime, true);
            return result;
        });
        logger_1.logger.info(`✅ Análise mock de texto concluída em ${Date.now() - startTime}ms [${requestId}]`);
        return results;
    }
    async analyzeVideo(data) {
        const startTime = Date.now();
        const requestId = data.requestId || this.generateRequestId();
        logger_1.logger.info(`🎥 Iniciando análise mock de vídeo: ${data.title || 'Sem título'} [${requestId}]`);
        await this.simulateProcessingDelay(3000, 7000);
        const videoAnalysis = videoAnalyzer_1.VideoAnalyzer.analyzeVideoCharacteristics(data.fileUrl, data.metadata);
        const baseScore = videoAnalysis.aiProbability;
        const providers = ['Hive', 'OpenAI', 'Deepware'];
        const results = providers.map((provider, index) => {
            const adjustedScore = this.adjustScore(baseScore, 0.15);
            const processingTime = Date.now() - startTime + (index * 500);
            const result = {
                provider,
                confidence: adjustedScore,
                isAIGenerated: baseScore > 0.65,
                details: this.generateVideoProviderDetails(provider, videoAnalysis),
                processingTime,
                timestamp: new Date(),
                requestId
            };
            this.recordAnalysisMetrics(`${provider.toLowerCase()}_video`, processingTime, true);
            return result;
        });
        logger_1.logger.info(`✅ Análise mock de vídeo concluída em ${Date.now() - startTime}ms [${requestId}]`);
        return results;
    }
    generateProviderDetails(provider, baseScore, analysis) {
        const common = {
            wordCount: analysis.wordCount,
            textLength: analysis.wordCount * analysis.avgWordLength,
            language: analysis.language
        };
        switch (provider) {
            case 'GPTZero':
                return {
                    ...common,
                    perplexity: 30 + (baseScore * 70) + (Math.random() - 0.5) * 10,
                    burstiness: 0.2 + (baseScore * 0.6) + (Math.random() - 0.5) * 0.1,
                    markers: this.generateMarkers(baseScore),
                    confidence: this.getConfidenceLevel(baseScore)
                };
            case 'Hive':
                return {
                    ...common,
                    ai_score: baseScore,
                    human_score: 1 - baseScore,
                    confidence: this.getConfidenceLevel(baseScore),
                    model: 'hive-detector-v3',
                    analysis: {
                        lexicalDiversity: analysis.lexicalDiversity,
                        repetitionScore: analysis.repetitionScore,
                        formalityScore: analysis.formalityScore
                    }
                };
            case 'OpenAI':
                return {
                    ...common,
                    classification: baseScore > 0.7 ? 'likely_ai' : baseScore > 0.4 ? 'unclear' : 'likely_human',
                    probability: baseScore,
                    reasoning: this.generateReasoning(baseScore, analysis),
                    model: 'text-davinci-003-detector',
                    tokensUsed: Math.floor(analysis.wordCount * 1.3)
                };
            default:
                return common;
        }
    }
    generateVideoProviderDetails(provider, analysis) {
        const common = {
            resolution: analysis.resolution,
            duration: `${analysis.duration}s`,
            artifacts: analysis.artifacts
        };
        switch (provider) {
            case 'Hive':
                return {
                    ...common,
                    ai_score: analysis.aiProbability,
                    human_score: 1 - analysis.aiProbability,
                    confidence: this.getConfidenceLevel(analysis.aiProbability),
                    face_analysis: {
                        count: analysis.faceCount,
                        quality: analysis.aiProbability > 0.7 ? 'inconsistent' : 'natural'
                    },
                    motion_analysis: analysis.motionAnalysis
                };
            case 'OpenAI':
                return {
                    ...common,
                    classification: analysis.aiProbability > 0.7 ? 'likely_ai' : 'likely_human',
                    probability: analysis.aiProbability,
                    artifacts_detected: analysis.artifacts.length,
                    model: 'video-detector-v2',
                    analysis: {
                        fps: analysis.fps,
                        codec: analysis.codec,
                        motionConsistency: analysis.motionAnalysis.consistency
                    }
                };
            case 'Deepware':
                return {
                    ...common,
                    deepfake_confidence: analysis.aiProbability * 100,
                    face_swap_detected: analysis.aiProbability > 0.8,
                    lip_sync_score: Math.random() * 0.3 + (analysis.aiProbability > 0.7 ? 0.7 : 0),
                    temporal_artifacts: analysis.artifacts.filter((a) => a.includes('temporal')).length
                };
            default:
                return common;
        }
    }
    generateMarkers(score) {
        const allMarkers = [
            'repetição_estrutural',
            'vocabulário_limitado',
            'padrões_previsíveis',
            'falta_de_nuance',
            'estrutura_rígida',
            'transições_mecânicas',
            'ausência_de_erros',
            'formalidade_excessiva'
        ];
        const count = Math.floor(score * allMarkers.length);
        return allMarkers.slice(0, count);
    }
    generateReasoning(_score, analysis) {
        const reasons = [];
        if (analysis.repetitionScore > 0.3) {
            reasons.push('alta repetição de palavras e estruturas');
        }
        if (analysis.formalityScore > 0.6) {
            reasons.push('linguagem excessivamente formal');
        }
        if (analysis.lexicalDiversity < 0.5) {
            reasons.push('baixa diversidade lexical');
        }
        if (analysis.patternScore > 0.5) {
            reasons.push('padrões estruturais repetitivos');
        }
        if (reasons.length === 0) {
            return 'Texto apresenta características naturais de escrita humana';
        }
        return `Texto apresenta ${reasons.join(', ')}`;
    }
    determineIfAI(provider, baseScore) {
        const thresholds = {
            'GPTZero': 0.70,
            'Hive': 0.65,
            'OpenAI': 0.75,
            'Deepware': 0.60
        };
        return baseScore > (thresholds[provider] || 0.70);
    }
    adjustScore(baseScore, variation) {
        const adjusted = baseScore + (Math.random() - 0.5) * variation;
        return Math.round(Math.max(0, Math.min(100, adjusted * 100)));
    }
}
exports.MockAIDetectionService = MockAIDetectionService;
//# sourceMappingURL=mockAIDetectionService.js.map