import { BaseDetectionService } from './baseDetectionService';
import { DetectionResult, TextAnalysisData, VideoAnalysisData, AnalysisConfig } from '../../types/detection.types';
export declare class RealAIDetectionService extends BaseDetectionService {
    private static instance;
    private queueService;
    private mockService;
    private constructor();
    static getInstance(): RealAIDetectionService;
    private setupQueueHandlers;
    analyzeText(data: TextAnalysisData, config?: AnalysisConfig): Promise<DetectionResult[]>;
    private processTextAnalysis;
    analyzeVideo(data: VideoAnalysisData, _config?: AnalysisConfig): Promise<DetectionResult[]>;
    private processVideoAnalysis;
    private waitForJobCompletion;
    getQueueStatus(): {
        pending: number;
        processing: number;
        activeJobs: number;
        totalJobs: number;
    };
    getMetrics(): {
        totalRequests: number;
        successRate: number;
        averageProcessingTime: number;
        queueStatus: {
            pending: number;
            processing: number;
            activeJobs: number;
            totalJobs: number;
        };
        cacheStats: {
            size: number;
            memoryUsage: number;
        };
    };
    private calculateSuccessRate;
    clearCache(): void;
    clearQueue(): void;
}
//# sourceMappingURL=realAIDetectionService.d.ts.map