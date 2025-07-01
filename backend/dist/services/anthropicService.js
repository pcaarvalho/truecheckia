"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.anthropicService = exports.AnthropicService = void 0;
const logger_1 = require("../utils/logger");
class AnthropicService {
    constructor() {
        this.baseUrl = 'https://api.anthropic.com/v1/messages';
        this.model = 'claude-3-opus-20240229';
        this.apiKey = process.env['ANTHROPIC_API_KEY'] || '';
    }
    static getInstance() {
        if (!AnthropicService.instance) {
            AnthropicService.instance = new AnthropicService();
        }
        return AnthropicService.instance;
    }
    async analyzeText(textContent, title) {
        const startTime = Date.now();
        if (!this.apiKey || this.apiKey === 'your-anthropic-api-key-here') {
            logger_1.logger.warn('⚠️ Chave da API do Anthropic não configurada, usando análise mock');
            return this.mockAnalysis(textContent, title, startTime);
        }
        try {
            logger_1.logger.info(`🔍 Iniciando análise com Claude Opus: ${title || 'Sem título'}`);
            const prompt = this.buildAnalysisPrompt(textContent, title);
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: this.model,
                    max_tokens: 1000,
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ]
                })
            });
            if (!response.ok) {
                const errorText = await response.text();
                logger_1.logger.error(`❌ Erro na API da Anthropic: ${response.status} - ${errorText}`);
                logger_1.logger.warn('Usando análise mock como fallback');
                return this.mockAnalysis(textContent, title, startTime);
            }
            const data = await response.json();
            const analysisText = data.content[0]?.text || '';
            const analysis = this.parseAnalysisResponse(analysisText);
            const processingTime = Date.now() - startTime;
            logger_1.logger.info(`✅ Análise Claude Opus concluída em ${processingTime}ms`);
            return {
                message: 'Análise real concluída com sucesso',
                provider: 'Claude Opus',
                confidence: analysis.confidence,
                isAIGenerated: analysis.isAIGenerated,
                response: analysis.response,
                details: {
                    processingTime,
                    model: this.model,
                    tokensUsed: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
                    analysis: analysisText
                }
            };
        }
        catch (error) {
            logger_1.logger.error(`❌ Erro ao analisar texto com Claude Opus:`, error);
            logger_1.logger.warn('Usando análise mock como fallback');
            return this.mockAnalysis(textContent, title, startTime);
        }
    }
    mockAnalysis(textContent, _title, startTime) {
        const processingTime = Date.now() - startTime + Math.random() * 1000;
        const words = textContent.split(/\s+/).length;
        const hasRepetition = /(.{10,})\1/.test(textContent);
        const hasFormalLanguage = /portanto|ademais|consequentemente|outrossim/.test(textContent.toLowerCase());
        let confidence = 50;
        let isAIGenerated = false;
        let response = 'Análise mock realizada';
        if (words > 100)
            confidence += 10;
        if (hasRepetition)
            confidence += 20;
        if (hasFormalLanguage)
            confidence += 15;
        isAIGenerated = confidence > 70;
        confidence = Math.min(95, confidence + Math.random() * 10);
        if (isAIGenerated) {
            response = 'O texto apresenta características típicas de conteúdo gerado por IA, como estrutura repetitiva e linguagem muito formal.';
        }
        else {
            response = 'O texto parece ter sido escrito por um humano, com variações naturais no estilo.';
        }
        logger_1.logger.info(`✅ Análise mock concluída em ${processingTime.toFixed(0)}ms`);
        return {
            message: 'Análise mock concluída com sucesso (Anthropic não configurado)',
            provider: 'TrueCheckIA Mock',
            confidence,
            isAIGenerated,
            response,
            details: {
                processingTime: Math.round(processingTime),
                model: 'mock-analysis-v1',
                tokensUsed: Math.round(words * 1.2),
                analysis: `Análise mock: ${words} palavras, repetição: ${hasRepetition}, linguagem formal: ${hasFormalLanguage}`,
                wordCount: words
            }
        };
    }
    buildAnalysisPrompt(textContent, title) {
        return `Você é um especialista em detecção de conteúdo gerado por IA. Analise o seguinte texto e determine se ele foi gerado por inteligência artificial.

TEXTO PARA ANÁLISE:
${title ? `Título: ${title}\n` : ''}
${textContent}

INSTRUÇÕES:
1. Analise o texto em busca de padrões típicos de conteúdo gerado por IA
2. Considere fatores como:
   - Repetição de estruturas
   - Vocabulário muito formal ou técnico
   - Falta de variação natural
   - Padrões de pontuação
   - Complexidade inconsistente
   - Falta de erros humanos naturais

3. Responda no seguinte formato JSON:
{
  "confidence": 85.5,
  "isAIGenerated": true,
  "response": "Texto analisado usando Claude Opus com sucesso",
  "reasoning": "Breve explicação do seu raciocínio"
}

IMPORTANTE: Responda APENAS com o JSON válido, sem texto adicional.`;
    }
    parseAnalysisResponse(responseText) {
        try {
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    confidence: parsed.confidence || 50.0,
                    isAIGenerated: parsed.isAIGenerated || false,
                    response: parsed.response || 'Análise concluída'
                };
            }
            logger_1.logger.warn('Não foi possível extrair JSON da resposta da IA, usando fallback');
            return {
                confidence: 75.0,
                isAIGenerated: responseText.toLowerCase().includes('ia') || responseText.toLowerCase().includes('artificial'),
                response: 'Análise concluída com Claude Opus'
            };
        }
        catch (error) {
            logger_1.logger.error('Erro ao fazer parse da resposta da IA:', error);
            return {
                confidence: 50.0,
                isAIGenerated: false,
                response: 'Erro na análise'
            };
        }
    }
}
exports.AnthropicService = AnthropicService;
exports.anthropicService = AnthropicService.getInstance();
//# sourceMappingURL=anthropicService.js.map