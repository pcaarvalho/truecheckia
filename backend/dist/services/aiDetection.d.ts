export * from '../types/detection.types';
export { BaseDetectionService } from './aiDetection/baseDetectionService';
export { MockAIDetectionService } from './aiDetection/mockAIDetectionService';
export { RealAIDetectionService } from './aiDetection/realAIDetectionService';
export { TextAnalyzer } from '../utils/textAnalyzer';
export { VideoAnalyzer } from '../utils/videoAnalyzer';
export { CacheService } from './cache/cacheService';
export { QueueService } from './queue/queueService';
export { MetricsService } from './metrics/metricsService';
import { RealAIDetectionService } from './aiDetection/realAIDetectionService';
export declare const aiDetectionService: RealAIDetectionService;
export declare class InputValidator {
    static validateTextInput(text: string, maxLength?: number): void;
    static validateVideoUrl(url: string): void;
    static sanitizeInput(input: string): string;
}
//# sourceMappingURL=aiDetection.d.ts.map