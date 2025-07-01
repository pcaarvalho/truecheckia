import { TextCharacteristics } from '../types/detection.types';
export declare class TextAnalyzer {
    static analyzeTextCharacteristics(text: string): TextCharacteristics;
    static calculateTextScore(analysis: TextCharacteristics): number;
    private static calculateRepetitionScore;
    private static calculateFormalityScore;
    private static detectPatterns;
    private static calculateSimilarity;
    private static detectLanguage;
}
//# sourceMappingURL=textAnalyzer.d.ts.map