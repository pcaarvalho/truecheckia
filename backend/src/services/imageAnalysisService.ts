import { logger } from '../utils/logger';
import { anthropicService } from './anthropicService';

export interface ImageAnalysisResult {
  message: string;
  provider: string;
  confidence: number;
  isAIGenerated: boolean;
  response: string;
  details?: any;
}

export class ImageAnalysisService {
  private static instance: ImageAnalysisService;

  private constructor() {}

  static getInstance(): ImageAnalysisService {
    if (!ImageAnalysisService.instance) {
      ImageAnalysisService.instance = new ImageAnalysisService();
    }
    return ImageAnalysisService.instance;
  }

  async analyzeImage(filePath: string, fileName: string, metadata?: any): Promise<ImageAnalysisResult> {
    const startTime = Date.now();
    
    try {
      logger.info(`🖼️ Iniciando análise de imagem: ${fileName}`);

      // Para MVP, vamos usar análise básica baseada em metadata e características
      const analysis = await this.performBasicImageAnalysis(fileName, metadata);
      
      const processingTime = Date.now() - startTime;
      
      logger.info(`✅ Análise de imagem concluída em ${processingTime}ms`);

      return {
        message: 'Análise de imagem concluída com sucesso',
        provider: 'TrueCheckIA Image Analyzer',
        confidence: analysis.confidence,
        isAIGenerated: analysis.isAIGenerated,
        response: analysis.response,
        details: {
          processingTime,
          model: 'basic-image-analysis-v1',
          fileName,
          fileType: this.getFileType(fileName),
          analysis: analysis.details
        }
      };

    } catch (error) {
      logger.error(`❌ Erro ao analisar imagem ${fileName}:`, error);
      
      // Fallback para análise mock
      return this.mockImageAnalysis(fileName, startTime);
    }
  }

  private async performBasicImageAnalysis(fileName: string, metadata?: any): Promise<{
    confidence: number;
    isAIGenerated: boolean;
    response: string;
    details: string;
  }> {
    // Análise baseada em características do arquivo
    const fileExtension = fileName.toLowerCase().split('.').pop() || '';
    const fileSize = metadata?.size || 0;
    
    let confidence = 50;
    let indicators: string[] = [];
    
    // Indicadores baseados no tipo de arquivo
    if (['jpg', 'jpeg'].includes(fileExtension)) {
      confidence += 5;
      indicators.push('Formato JPEG comum');
    } else if (fileExtension === 'png') {
      confidence += 10;
      indicators.push('Formato PNG frequentemente usado por geradores de IA');
    } else if (fileExtension === 'webp') {
      confidence += 15;
      indicators.push('Formato WebP moderno, comum em IA');
    }
    
    // Análise de tamanho
    if (fileSize > 0) {
      if (fileSize < 500 * 1024) { // < 500KB
        confidence += 10;
        indicators.push('Arquivo pequeno, típico de geradores de IA');
      } else if (fileSize > 5 * 1024 * 1024) { // > 5MB
        confidence -= 10;
        indicators.push('Arquivo grande, menos comum em IA');
      }
    }
    
    // Padrões no nome do arquivo
    const fileName_lower = fileName.toLowerCase();
    if (fileName_lower.includes('generated') || fileName_lower.includes('ai') || fileName_lower.includes('synthetic')) {
      confidence += 20;
      indicators.push('Nome do arquivo sugere conteúdo gerado');
    }
    
    if (fileName_lower.includes('photo') || fileName_lower.includes('img') || fileName_lower.includes('pic')) {
      confidence -= 5;
      indicators.push('Nome sugere foto real');
    }
    
    // Análise de qualidade de nome (nomes muito genéricos podem ser IA)
    if (/^(img|image|photo|pic)_?\d+\.(jpg|png|webp)$/i.test(fileName)) {
      confidence += 15;
      indicators.push('Nome genérico, comum em IA');
    }
    
    confidence = Math.max(10, Math.min(95, confidence));
    const isAIGenerated = confidence > 60;
    
    let response = '';
    if (isAIGenerated) {
      response = `A imagem apresenta ${confidence.toFixed(1)}% de probabilidade de ser gerada por IA. `;
      response += 'Características identificadas: ' + indicators.join(', ') + '.';
    } else {
      response = `A imagem apresenta ${confidence.toFixed(1)}% de probabilidade de ser gerada por IA, `;
      response += 'sugerindo que é provavelmente uma foto real. ';
      response += 'Características analisadas: ' + indicators.join(', ') + '.';
    }
    
    return {
      confidence: Number(confidence.toFixed(1)),
      isAIGenerated,
      response,
      details: `Análise baseada em: ${indicators.join(', ')}`
    };
  }

  private mockImageAnalysis(fileName: string, startTime: number): ImageAnalysisResult {
    const processingTime = Date.now() - startTime + Math.random() * 1000;
    
    // Análise mock básica
    const mockConfidence = 40 + Math.random() * 40; // 40-80%
    const isAIGenerated = mockConfidence > 60;
    
    const response = isAIGenerated 
      ? `Análise mock: A imagem ${fileName} pode ter sido gerada por IA com ${mockConfidence.toFixed(1)}% de confiança.`
      : `Análise mock: A imagem ${fileName} provavelmente é real com ${mockConfidence.toFixed(1)}% de confiança.`;

    logger.info(`✅ Análise mock de imagem concluída em ${processingTime.toFixed(0)}ms`);

    return {
      message: 'Análise mock de imagem concluída',
      provider: 'TrueCheckIA Mock Image Analyzer',
      confidence: Number(mockConfidence.toFixed(1)),
      isAIGenerated,
      response,
      details: {
        processingTime: Math.round(processingTime),
        model: 'mock-image-analysis-v1',
        fileName,
        fileType: this.getFileType(fileName),
        analysis: 'Análise simulada para desenvolvimento'
      }
    };
  }

  private getFileType(fileName: string): string {
    const extension = fileName.toLowerCase().split('.').pop() || '';
    
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        return 'JPEG';
      case 'png':
        return 'PNG';
      case 'gif':
        return 'GIF';
      case 'webp':
        return 'WebP';
      case 'bmp':
        return 'BMP';
      case 'svg':
        return 'SVG';
      default:
        return 'Unknown';
    }
  }

  // Método para análise avançada com IA (futuro)
  async analyzeWithAI(filePath: string, fileName: string): Promise<ImageAnalysisResult> {
    // TODO: Implementar análise com Claude Vision ou outro serviço
    // Por enquanto, usar análise básica
    return this.analyzeImage(filePath, fileName);
  }
}

export const imageAnalysisService = ImageAnalysisService.getInstance();