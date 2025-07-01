export interface DetectionResult {
    provider: string;
    confidence: number;
    isAIGenerated: boolean;
    details: DetectionDetails;
    processingTime: number;
    timestamp: Date;
    requestId: string;
}
export interface DetectionDetails {
    message?: string;
    response?: any;
    model?: string;
    tokensUsed?: number;
    analysis?: any;
    wordCount?: number;
    textLength?: number;
    perplexity?: number;
    burstiness?: number;
    markers?: string[];
    ai_score?: number;
    human_score?: number;
    confidence?: string;
    language?: string;
    classification?: string;
    probability?: number;
    reasoning?: string;
    artifacts?: string[];
    resolution?: string;
    duration?: string;
    artifacts_detected?: number;
    face_analysis?: any;
    motion_analysis?: any;
    deepfake_confidence?: number;
    face_swap_detected?: boolean;
    lip_sync_score?: number;
    temporal_artifacts?: number;
}
export interface TextAnalysisData {
    textContent: string;
    title?: string;
    description?: string;
    metadata?: Record<string, any>;
    userId?: string;
    requestId?: string;
}
export interface VideoAnalysisData {
    fileUrl: string;
    title?: string;
    description?: string;
    metadata?: Record<string, any>;
    userId?: string;
    requestId?: string;
}
export interface AnalysisConfig {
    providers?: string[];
    maxRetries?: number;
    timeout?: number;
    cacheResults?: boolean;
    priority?: 'low' | 'normal' | 'high';
}
export interface QueueJob<T = any> {
    id: string;
    data: T;
    priority: number;
    retries: number;
    maxRetries: number;
    createdAt: Date;
    processingStartedAt?: Date;
    completedAt?: Date;
    error?: Error;
    status: 'pending' | 'processing' | 'completed' | 'failed';
}
export interface TextCharacteristics {
    wordCount: number;
    sentenceCount: number;
    avgSentenceLength: number;
    lexicalDiversity: number;
    avgWordLength: number;
    repetitionScore: number;
    formalityScore: number;
    patternScore: number;
    language: string;
}
export interface VideoCharacteristics {
    aiProbability: number;
    resolution: string;
    duration: string;
    fps: number;
    codec: string;
    artifacts: string[];
    faceCount: number;
    motionAnalysis: {
        smoothness: string;
        consistency: string;
    };
}
//# sourceMappingURL=detection.types.d.ts.map