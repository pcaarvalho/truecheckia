// Re-exporta os tipos principais
export * from '../types/detection.types';

// Re-exporta os serviços
export { BaseDetectionService } from './aiDetection/baseDetectionService';
export { MockAIDetectionService } from './aiDetection/mockAIDetectionService';
export { RealAIDetectionService } from './aiDetection/realAIDetectionService';

// Re-exporta utilitários
export { TextAnalyzer } from '../utils/textAnalyzer';
export { VideoAnalyzer } from '../utils/videoAnalyzer';

// Re-exporta serviços de suporte
export { CacheService } from './cache/cacheService';
export { QueueService } from './queue/queueService';
export { MetricsService } from './metrics/metricsService';

// Exporta serviço principal configurado
import { RealAIDetectionService } from './aiDetection/realAIDetectionService';
export const aiDetectionService = RealAIDetectionService.getInstance();

// Validador de entrada
export class InputValidator {
  static validateTextInput(text: string, maxLength: number = 50000): void {
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid text input');
    }
    
    if (text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }
    
    if (text.length > maxLength) {
      throw new Error(`Text exceeds maximum length of ${maxLength} characters`);
    }
  }
  
  static validateVideoUrl(url: string): void {
    if (!url || typeof url !== 'string') {
      throw new Error('Invalid video URL');
    }
    
    try {
      new URL(url);
    } catch {
      throw new Error('Invalid URL format');
    }
    
    const validExtensions = ['.mp4', '.avi', '.mov', '.mkv', '.webm'];
    const hasValidExtension = validExtensions.some(ext => url.toLowerCase().includes(ext));
    
    if (!hasValidExtension) {
      throw new Error('Invalid video file format');
    }
  }
  
  static sanitizeInput(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/\0/g, ''); // Remove null bytes
  }
}