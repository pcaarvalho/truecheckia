export interface DetectionResult {
  provider: string;
  confidence: number;
  isAIGenerated: boolean;
  details: DetectionDetails;
  processingTime: number;
  timestamp: Date;
  requestId: string;
}

export interface AnalysisResponse {
  summary?: string;
  details?: string[];
  confidence?: number;
}

export interface FaceAnalysis {
  faces_detected: number;
  manipulation_score: number;
  inconsistencies: string[];
}

export interface MotionAnalysis {
  smoothness: string;
  consistency: string;
  temporal_artifacts: number;
}

export interface DetectionDetails {
  message?: string;
  response?: string | AnalysisResponse;
  model?: string;
  tokensUsed?: number;
  analysis?: AnalysisResponse;
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
  face_analysis?: FaceAnalysis;
  motion_analysis?: MotionAnalysis;
  deepfake_confidence?: number;
  face_swap_detected?: boolean;
  lip_sync_score?: number;
  temporal_artifacts?: number;
}

export interface AnalysisMetadata {
  source?: string;
  tags?: string[];
  language?: string;
  [key: string]: unknown;
}

export interface TextAnalysisData {
  textContent: string;
  title?: string;
  description?: string;
  metadata?: AnalysisMetadata;
  userId?: string;
  requestId?: string;
}

export interface VideoAnalysisData {
  fileUrl: string;
  title?: string;
  description?: string;
  metadata?: AnalysisMetadata;
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

export interface QueueJob<T = unknown> {
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
