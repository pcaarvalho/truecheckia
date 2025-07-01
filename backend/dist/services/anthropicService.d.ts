export interface AnthropicAnalysisResult {
    message: string;
    provider: string;
    confidence: number;
    isAIGenerated: boolean;
    response: string;
    details?: any;
}
export declare class AnthropicService {
    private static instance;
    private readonly apiKey;
    private readonly baseUrl;
    private readonly model;
    private constructor();
    static getInstance(): AnthropicService;
    analyzeText(textContent: string, title?: string): Promise<AnthropicAnalysisResult>;
    private mockAnalysis;
    private buildAnalysisPrompt;
    private parseAnalysisResponse;
}
export declare const anthropicService: AnthropicService;
//# sourceMappingURL=anthropicService.d.ts.map