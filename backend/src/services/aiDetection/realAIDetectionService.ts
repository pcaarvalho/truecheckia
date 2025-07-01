import { logger } from '../../utils/logger';
import { anthropicService } from '../anthropicService';
import { BaseDetectionService } from './baseDetectionService';
import { DetectionResult, TextAnalysisData, VideoAnalysisData, AnalysisConfig } from '../../types/detection.types';
import { QueueService } from '../queue/queueService';
import { MockAIDetectionService } from './mockAIDetectionService';

export class RealAIDetectionService extends BaseDetectionService {
  private static instance: RealAIDetectionService;
  private queueService: QueueService;
  private mockService: MockAIDetectionService;

  private constructor() {
    super();
    this.queueService = QueueService.getInstance();
    this.mockService = MockAIDetectionService.getInstance();
    this.setupQueueHandlers();
  }

  static getInstance(): RealAIDetectionService {
    if (!RealAIDetectionService.instance) {
      RealAIDetectionService.instance = new RealAIDetectionService();
    }
    return RealAIDetectionService.instance;
  }

  private setupQueueHandlers(): void {
    this.queueService.on('job:process', async (job: any) => {
      try {
        const { type, data } = job.data;
        let result;

        if (type === 'text') {
          result = await this.processTextAnalysis(data);
        } else if (type === 'video') {
          result = await this.processVideoAnalysis(data);
        }

        this.queueService.completeJob(job.id, result);
      } catch (error) {
        this.queueService.failJob(job.id, error as Error);
      }
    });
  }

  async analyzeText(data: TextAnalysisData, config?: AnalysisConfig): Promise<DetectionResult[]> {
    const requestId = data.requestId || this.generateRequestId();
    const startTime = Date.now();
    
    logger.info(`🔍 Iniciando análise real de texto: ${data.title || 'Sem título'} [${requestId}]`);
    
    // Verifica cache
    if (config?.cacheResults !== false) {
      const cacheKey = this.cacheService.generateKey({ type: 'text', content: data.textContent });
      const cached = this.cacheService.get(cacheKey);
      if (cached) {
        logger.info(`✅ Resultado encontrado em cache [${requestId}]`);
        return cached;
      }
    }

    try {
      // Se for alta prioridade, processa imediatamente
      if (config?.priority === 'high') {
        return await this.processTextAnalysis(data, requestId);
      }

      // Adiciona à fila para processamento
      const jobId = await this.queueService.addJob({
        type: 'text',
        data: { ...data, requestId }
      }, {
        priority: config?.priority === 'low' ? 0 : 1
      });

      // Aguarda conclusão com timeout
      return await this.waitForJobCompletion(jobId, config?.timeout || 30000);

    } catch (error) {
      logger.error(`❌ Erro na análise real de texto [${requestId}]:`, error);
      this.recordAnalysisMetrics('anthropic', Date.now() - startTime, false);
      
      // Fallback para análise mock em caso de erro
      if (config?.maxRetries === 0) throw error;
      
      logger.warn('Usando análise mock como fallback');
      return this.mockService.analyzeText(data);
    }
  }

  private async processTextAnalysis(data: TextAnalysisData, requestId?: string): Promise<DetectionResult[]> {
    const startTime = Date.now();
    requestId = requestId || this.generateRequestId();

    const anthropicResult = await this.withRetry(
      () => anthropicService.analyzeText(data.textContent, data.title || ''),
      3,
      2000
    );
    
    const result: DetectionResult = {
      provider: (anthropicResult as any).provider,
      confidence: (anthropicResult as any).confidence,
      isAIGenerated: (anthropicResult as any).isAIGenerated,
      details: {
        message: (anthropicResult as any).message,
        response: (anthropicResult as any).response,
        model: (anthropicResult as any).details?.model,
        tokensUsed: (anthropicResult as any).details?.tokensUsed,
        analysis: (anthropicResult as any).details?.analysis,
        wordCount: data.textContent.split(/\s+/).length,
        textLength: data.textContent.length,
        language: this.detectLanguage(data.textContent)
      },
      processingTime: Date.now() - startTime,
      timestamp: new Date(),
      requestId
    };

    // Registra métricas
    this.recordAnalysisMetrics('anthropic', result.processingTime, true);
    
    // Salva em cache
    const cacheKey = this.cacheService.generateKey({ type: 'text', content: data.textContent });
    this.cacheService.set(cacheKey, [result], 3600000); // 1 hora

    logger.info(`✅ Análise real de texto concluída em ${result.processingTime}ms [${requestId}]`);
    return [result];
  }

  async analyzeVideo(data: VideoAnalysisData, _config?: AnalysisConfig): Promise<DetectionResult[]> {
    const requestId = data.requestId || this.generateRequestId();
    const startTime = Date.now();
    
    logger.info(`🎥 Iniciando análise de vídeo: ${data.title || 'Sem título'} [${requestId}]`);
    
    // Por enquanto, usa o serviço mock para vídeos
    // TODO: Implementar análise real de vídeo
    const results = await this.mockService.analyzeVideo(data);
    
    // Adiciona metadados
    results.forEach(result => {
      result.timestamp = new Date();
      result.requestId = requestId;
    });

    this.recordAnalysisMetrics('video', Date.now() - startTime, true);
    
    logger.info(`✅ Análise de vídeo concluída em ${Date.now() - startTime}ms [${requestId}]`);
    return results;
  }

  private async processVideoAnalysis(data: VideoAnalysisData): Promise<DetectionResult[]> {
    // Implementação futura para análise real de vídeo
    return this.mockService.analyzeVideo(data);
  }

  private async waitForJobCompletion(jobId: string, timeout: number): Promise<DetectionResult[]> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Job ${jobId} timeout after ${timeout}ms`));
      }, timeout);

      this.queueService.once(`job:completed`, (job: any) => {
        if (job.id === jobId) {
          clearTimeout(timer);
          resolve(job.data);
        }
      });

      this.queueService.once(`job:failed`, (job: any) => {
        if (job.id === jobId) {
          clearTimeout(timer);
          reject(job.error);
        }
      });
    });
  }

  // Métodos para gerenciamento
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

  private calculateSuccessRate(): number {
    const successCount = this.metricsService.getMetrics('analysis.requests', { status: 'success' }).length;
    const totalCount = this.metricsService.getAggregatedMetrics('analysis.requests', 'count');
    return totalCount > 0 ? (successCount / totalCount) * 100 : 0;
  }

  clearCache(): void {
    this.cacheService.clear();
  }

  clearQueue(): void {
    this.queueService.clearQueue();
  }
} 