import { TextCharacteristics } from '../types/detection.types';

export class TextAnalyzer {
  static analyzeTextCharacteristics(text: string): TextCharacteristics {
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const words = text
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 0);
    const uniqueWords = new Set(words);

    return {
      wordCount: words.length,
      sentenceCount: sentences.length,
      avgSentenceLength: words.length / (sentences.length || 1),
      lexicalDiversity: uniqueWords.size / words.length,
      avgWordLength: words.reduce((sum, word) => sum + word.length, 0) / words.length,
      repetitionScore: this.calculateRepetitionScore(words),
      formalityScore: this.calculateFormalityScore(words),
      patternScore: this.detectPatterns(text),
      language: this.detectLanguage(text),
    };
  }

  static calculateTextScore(analysis: TextCharacteristics): number {
    let score = 0;

    // Fatores que indicam IA
    if (analysis.avgSentenceLength > 25 || analysis.avgSentenceLength < 10) score += 0.2;
    if (analysis.lexicalDiversity < 0.5) score += 0.15;
    if (analysis.repetitionScore > 0.3) score += 0.2;
    if (analysis.formalityScore > 0.6) score += 0.15;
    if (analysis.patternScore > 0.5) score += 0.2;

    // Adiciona ruído para tornar mais realista
    score += (Math.random() - 0.5) * 0.1;

    return Math.max(0, Math.min(1, score));
  }

  private static calculateRepetitionScore(words: string[]): number {
    const wordFreq: Record<string, number> = {};
    words.forEach((word) => {
      if (word.length > 3) {
        // Ignora palavras muito curtas
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });

    const repetitions = Object.values(wordFreq).filter((freq) => freq > 2).length;
    return Math.min(repetitions / words.length, 1);
  }

  private static calculateFormalityScore(words: string[]): number {
    const formalWords = [
      'portanto',
      'consequentemente',
      'ademais',
      'posteriormente',
      'therefore',
      'consequently',
      'furthermore',
      'moreover',
      'entretanto',
      'todavia',
      'contudo',
      'nevertheless',
    ];

    const formalCount = words.filter((word) => formalWords.includes(word)).length;
    return Math.min((formalCount / words.length) * 10, 1);
  }

  private static detectPatterns(text: string): number {
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    if (sentences.length < 3) return 0;

    let patternScore = 0;

    // Verifica comprimento similar de sentenças
    const lengths = sentences.map((s) => s.trim().split(/\s+/).length);
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance =
      lengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / lengths.length;

    if (variance < 10) patternScore += 0.3;

    // Verifica início similar de sentenças
    const startWords = sentences
      .map((s) => s.trim().split(/\s+/)[0]?.toLowerCase())
      .filter(Boolean);
    const uniqueStarts = new Set(startWords).size;
    if (uniqueStarts < sentences.length * 0.7) patternScore += 0.3;

    // Verifica estruturas repetitivas
    for (let i = 0; i < sentences.length - 1; i++) {
      const sentence1 = sentences[i];
      const sentence2 = sentences[i + 1];
      if (sentence1 && sentence2) {
        const similarity = this.calculateSimilarity(sentence1, sentence2);
        if (similarity > 0.6) patternScore += 0.1;
      }
    }

    return Math.min(patternScore, 1);
  }

  private static calculateSimilarity(str1: string, str2: string): number {
    const words1 = new Set(str1.toLowerCase().split(/\s+/));
    const words2 = new Set(str2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter((x) => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  private static detectLanguage(text: string): string {
    const patterns = {
      'pt-BR': /\b(de|da|do|que|para|com|por|uma|não|mais|foi|ser|está|são|tem|mas|ele|ela)\b/gi,
      'en-US': /\b(the|and|for|with|that|this|from|have|will|been|are|was|can|but|not|you|all)\b/gi,
      'es-ES': /\b(de|la|el|en|y|a|los|del|las|un|por|con|para|es|una)\b/gi,
      'fr-FR': /\b(le|de|la|les|et|des|en|un|une|pour|que|dans|par|sur|avec)\b/gi,
    };

    const scores: Record<string, number> = {};

    for (const [lang, pattern] of Object.entries(patterns)) {
      const matches = text.match(pattern);
      scores[lang] = matches ? matches.length : 0;
    }

    const detectedLang = Object.entries(scores).reduce((a, b) => (a[1] > b[1] ? a : b))[0];
    return detectedLang || 'unknown';
  }
}
