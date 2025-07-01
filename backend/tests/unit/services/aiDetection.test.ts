import { MockAIDetectionService } from '../../../src/services/aiDetection/mockAIDetectionService';
import { TextAnalyzer } from '../../../src/utils/textAnalyzer';
import { VideoAnalyzer } from '../../../src/utils/videoAnalyzer';

describe('MockAIDetectionService', () => {
  let service: MockAIDetectionService;

  beforeEach(() => {
    service = MockAIDetectionService.getInstance();
  });

  describe('analyzeText', () => {
    it('should analyze text and return detection results', async () => {
      const textData = {
        textContent: 'Este é um texto de teste para análise',
        title: 'Teste',
        userId: 'user123'
      };

      const results = await service.analyzeText(textData);

      expect(results).toHaveLength(3); // GPTZero, Hive, OpenAI
      expect(results[0]).toHaveProperty('provider');
      expect(results[0]).toHaveProperty('confidence');
      expect(results[0]).toHaveProperty('isAIGenerated');
      expect(results[0]).toHaveProperty('processingTime');
      expect(results[0]).toHaveProperty('timestamp');
      expect(results[0]).toHaveProperty('requestId');
    });

    it('should detect AI text patterns correctly', async () => {
      const aiText = {
        textContent: 'Portanto, consequentemente, ademais, posteriormente, o texto apresenta padrões muito estruturados.',
        title: 'AI Test'
      };

      const results = await service.analyzeText(aiText);
      
      // Pelo menos um provider deve detectar como IA
      const hasAIDetection = results.some(r => r.isAIGenerated);
      expect(hasAIDetection).toBe(true);
    });

    it('should handle empty text gracefully', async () => {
      const emptyTextData = {
        textContent: '',
        title: 'Empty Test'
      };

      await expect(service.analyzeText(emptyTextData)).rejects.toThrow();
    });
  });

  describe('analyzeVideo', () => {
    it('should analyze video and return detection results', async () => {
      const videoData = {
        fileUrl: 'https://example.com/video.mp4',
        title: 'Test Video',
        metadata: {
          duration: '120',
          resolution: '1920x1080',
          fps: 30
        }
      };

      const results = await service.analyzeVideo(videoData);

      expect(results).toHaveLength(3); // Hive, OpenAI, Deepware
      expect(results[0]).toHaveProperty('provider');
      expect(results[0]).toHaveProperty('confidence');
      expect(results[0]).toHaveProperty('isAIGenerated');
    });

    it('should detect suspicious video names', async () => {
      const suspiciousVideo = {
        fileUrl: 'https://example.com/deepfake-ai-generated.mp4',
        title: 'Suspicious Video'
      };

      const results = await service.analyzeVideo(suspiciousVideo);
      
      // Deve ter probabilidade mais alta de IA devido ao nome
      const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
      expect(avgConfidence).toBeGreaterThan(50);
    });
  });
});

describe('TextAnalyzer', () => {
  describe('analyzeTextCharacteristics', () => {
    it('should analyze basic text characteristics', () => {
      const text = 'Este é um texto simples. Tem duas sentenças.';
      const analysis = TextAnalyzer.analyzeTextCharacteristics(text);

      expect(analysis.wordCount).toBe(9);
      expect(analysis.sentenceCount).toBe(2);
      expect(analysis.avgSentenceLength).toBe(4.5);
      expect(analysis.language).toBe('pt-BR');
    });

    it('should detect formal language patterns', () => {
      const formalText = 'Portanto, consequentemente, ademais, posteriormente, entretanto, todavia.';
      const analysis = TextAnalyzer.analyzeTextCharacteristics(formalText);

      expect(analysis.formalityScore).toBeGreaterThan(0.5);
    });

    it('should calculate lexical diversity', () => {
      const repetitiveText = 'teste teste teste diferente';
      const analysis = TextAnalyzer.analyzeTextCharacteristics(repetitiveText);

      expect(analysis.lexicalDiversity).toBe(0.5); // 2 unique words out of 4 total
    });
  });

  describe('calculateTextScore', () => {
    it('should return higher scores for AI-like text', () => {
      const aiLikeAnalysis = {
        avgSentenceLength: 30, // Very long sentences
        lexicalDiversity: 0.3, // Low diversity
        repetitionScore: 0.4, // High repetition
        formalityScore: 0.7, // Very formal
        patternScore: 0.6, // High pattern detection
        wordCount: 100,
        sentenceCount: 3,
        avgWordLength: 6,
        language: 'pt-BR'
      };

      const score = TextAnalyzer.calculateTextScore(aiLikeAnalysis);
      expect(score).toBeGreaterThan(0.7);
    });

    it('should return lower scores for human-like text', () => {
      const humanLikeAnalysis = {
        avgSentenceLength: 15, // Normal sentences
        lexicalDiversity: 0.8, // High diversity
        repetitionScore: 0.1, // Low repetition
        formalityScore: 0.2, // Natural formality
        patternScore: 0.2, // Low patterns
        wordCount: 100,
        sentenceCount: 7,
        avgWordLength: 5,
        language: 'pt-BR'
      };

      const score = TextAnalyzer.calculateTextScore(humanLikeAnalysis);
      expect(score).toBeLessThan(0.4);
    });
  });
});

describe('VideoAnalyzer', () => {
  describe('analyzeVideoCharacteristics', () => {
    it('should analyze basic video characteristics', () => {
      const analysis = VideoAnalyzer.analyzeVideoCharacteristics(
        'https://example.com/normal-video.mp4',
        { duration: '120', resolution: '1920x1080', fps: 30 }
      );

      expect(analysis.duration).toBe('120');
      expect(analysis.resolution).toBe('1920x1080');
      expect(analysis.fps).toBe(30);
      expect(analysis.aiProbability).toBeLessThan(0.6);
    });

    it('should detect suspicious video indicators', () => {
      const analysis = VideoAnalyzer.analyzeVideoCharacteristics(
        'https://example.com/ai-generated-deepfake.mp4'
      );

      expect(analysis.aiProbability).toBeGreaterThan(0.5);
      expect(analysis.artifacts.length).toBeGreaterThan(0);
    });

    it('should handle extreme durations', () => {
      const shortVideo = VideoAnalyzer.analyzeVideoCharacteristics(
        'https://example.com/short.mp4',
        { duration: '5' } // Very short
      );

      const longVideo = VideoAnalyzer.analyzeVideoCharacteristics(
        'https://example.com/long.mp4',
        { duration: '1200' } // Very long
      );

      expect(shortVideo.aiProbability).toBeGreaterThan(0.3);
      expect(longVideo.aiProbability).toBeGreaterThan(0.3);
    });
  });
}); 