import { VideoCharacteristics } from '../types/detection.types';

export class VideoAnalyzer {
  static analyzeVideoCharacteristics(
    fileUrl: string,
    metadata?: Record<string, any>
  ): VideoCharacteristics {
    // Simula análise baseada em metadados e nome do arquivo
    const fileName = fileUrl.toLowerCase();
    let aiProbability = 0.3;

    // Ajusta probabilidade baseado em indicadores no nome
    const aiIndicators = ['ai', 'generated', 'synthetic', 'deepfake', 'fake'];
    aiIndicators.forEach((indicator) => {
      if (fileName.includes(indicator)) aiProbability += 0.15;
    });

    // Usa metadados se disponíveis
    if (metadata?.['duration']) {
      // Vídeos muito curtos ou muito longos podem ser suspeitos
      const duration = parseInt(metadata['duration']);
      if (duration < 10 || duration > 600) aiProbability += 0.1;
    }

    return {
      aiProbability: Math.min(aiProbability, 0.95),
      resolution: metadata?.['resolution'] || '1920x1080',
      duration: metadata?.['duration'] || '120',
      fps: metadata?.['fps'] || 30,
      codec: metadata?.['codec'] || 'h264',
      artifacts: this.generateVideoArtifacts(aiProbability),
      faceCount: Math.floor(Math.random() * 5) + 1,
      motionAnalysis: {
        smoothness: aiProbability > 0.7 ? 'irregular' : 'natural',
        consistency: aiProbability > 0.7 ? 'low' : 'high',
      },
    };
  }

  private static generateVideoArtifacts(aiProbability: number): string[] {
    const artifacts = [];

    if (aiProbability > 0.8) {
      artifacts.push(
        'temporal_inconsistency',
        'facial_distortion',
        'unnatural_eye_movement',
        'lighting_mismatch'
      );
    } else if (aiProbability > 0.6) {
      artifacts.push('minor_facial_artifacts', 'occasional_blur', 'subtle_distortion');
    } else if (aiProbability > 0.4) {
      artifacts.push('compression_artifacts');
    }

    return artifacts;
  }
}
