import { logger } from '../../utils/logger';
import { DetectionResult, TextAnalysisData, VideoAnalysisData } from '../../types/detection.types';
import { CacheService } from '../cache/cacheService';
import { MetricsService } from '../metrics/metricsService';
import { v4 as uuidv4 } from 'uuid';

export abstract class BaseDetectionService {
  protected cacheService: CacheService;
  protected metricsService: MetricsService;

  constructor() {
    this.cacheService = CacheService.getInstance();
    this.metricsService = MetricsService.getInstance();
  }

  protected generateRequestId(): string {
    return uuidv4();
  }

  protected async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        logger.warn(`Operation failed (attempt ${i + 1}/${maxRetries}):`, error);

        if (i < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)));
        }
      }
    }

    throw lastError!;
  }

  protected recordAnalysisMetrics(
    provider: string,
    processingTime: number,
    success: boolean
  ): void {
    this.metricsService.recordMetric('analysis.processing_time', processingTime, { provider });
    this.metricsService.recordMetric('analysis.requests', 1, {
      provider,
      status: success ? 'success' : 'failure',
    });
  }

  protected async simulateProcessingDelay(min: number, max: number): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min) + min);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  protected detectLanguage(text: string): string {
    const patterns = {
      'pt-BR': /\b(de|da|do|que|para|com|por|uma|não|mais|foi|ser|está|são|tem|mas|ele|ela)\b/gi,
      'en-US': /\b(the|and|for|with|that|this|from|have|will|been|are|was|can|but|not|you|all)\b/gi,
      'es-ES': /\b(de|la|el|en|y|a|los|del|las|un|por|con|para|es|una)\b/gi,
      'fr-FR': /\b(le|de|la|les|et|des|en|un|une|pour|que|dans|par|sur|avec)\b/gi,
    };

    const scores: Record<string, number> = {};

    for (const [lang, pattern] of Object.entries(patterns)) {
      const matches = text.match(pattern);
      scores[lang] = matches ? matches.length : 0;
    }

    const detectedLang = Object.entries(scores).reduce((a, b) => (a[1] > b[1] ? a : b))[0];
    return detectedLang || 'unknown';
  }

  protected getConfidenceLevel(score: number): string {
    if (score > 0.85) return 'very_high';
    if (score > 0.7) return 'high';
    if (score > 0.5) return 'medium';
    if (score > 0.3) return 'low';
    return 'very_low';
  }

  abstract analyzeText(data: TextAnalysisData): Promise<DetectionResult[]>;
  abstract analyzeVideo(data: VideoAnalysisData): Promise<DetectionResult[]>;
}
