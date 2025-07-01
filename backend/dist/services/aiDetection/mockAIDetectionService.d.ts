import { BaseDetectionService } from './baseDetectionService';
import { DetectionResult, TextAnalysisData, VideoAnalysisData } from '../../types/detection.types';
export declare class MockAIDetectionService extends BaseDetectionService {
    private static instance;
    private constructor();
    static getInstance(): MockAIDetectionService;
    analyzeText(data: TextAnalysisData): Promise<DetectionResult[]>;
    analyzeVideo(data: VideoAnalysisData): Promise<DetectionResult[]>;
    private generateProviderDetails;
    private generateVideoProviderDetails;
    private generateMarkers;
    private generateReasoning;
    private determineIfAI;
    private adjustScore;
}
//# sourceMappingURL=mockAIDetectionService.d.ts.map