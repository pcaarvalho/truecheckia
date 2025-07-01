import { DetectionResult, TextAnalysisData, VideoAnalysisData } from '../../types/detection.types';
import { CacheService } from '../cache/cacheService';
import { MetricsService } from '../metrics/metricsService';
export declare abstract class BaseDetectionService {
    protected cacheService: CacheService;
    protected metricsService: MetricsService;
    constructor();
    protected generateRequestId(): string;
    protected withRetry<T>(operation: () => Promise<T>, maxRetries?: number, delay?: number): Promise<T>;
    protected recordAnalysisMetrics(provider: string, processingTime: number, success: boolean): void;
    protected simulateProcessingDelay(min: number, max: number): Promise<void>;
    protected detectLanguage(text: string): string;
    protected getConfidenceLevel(score: number): string;
    abstract analyzeText(data: TextAnalysisData): Promise<DetectionResult[]>;
    abstract analyzeVideo(data: VideoAnalysisData): Promise<DetectionResult[]>;
}
//# sourceMappingURL=baseDetectionService.d.ts.map