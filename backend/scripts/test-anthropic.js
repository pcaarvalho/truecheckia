#!/usr/bin/env node

/**
 * Script de teste para verificar a integração com a API da Anthropic
 * 
 * Uso: node scripts/test-anthropic.js
 */

require('dotenv').config();

const fetch = require('node-fetch');

async function testAnthropicAPI() {
  console.log('🧪 Testando integração com API da Anthropic...\n');

  // Verifica se a chave da API está configurada
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('❌ ANTHROPIC_API_KEY não encontrada no arquivo .env');
    console.log('📝 Adicione sua chave da API da Anthropic ao arquivo .env:');
    console.log('   ANTHROPIC_API_KEY="sua-chave-aqui"');
    process.exit(1);
  }

  console.log('✅ Chave da API encontrada');

  // Texto de teste
  const testText = `Este é um texto de teste para verificar se a integração com a API da Anthropic está funcionando corretamente. 
  
  O texto contém algumas características que podem ser analisadas pela IA, como estrutura de frases, vocabulário e padrões de escrita.
  
  A análise deve determinar se este texto foi gerado por inteligência artificial ou escrito por um humano.`;

  try {
    console.log('🔍 Enviando texto para análise...');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: `Você é um especialista em detecção de conteúdo gerado por IA. Analise o seguinte texto e determine se ele foi gerado por inteligência artificial.

TEXTO PARA ANÁLISE:
${testText}

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

IMPORTANTE: Responda APENAS com o JSON válido, sem texto adicional.`
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Erro na API: ${response.status} - ${errorText}`);
      process.exit(1);
    }

    const data = await response.json();
    const analysisText = data.content[0]?.text || '';

    console.log('✅ Resposta recebida da API');
    console.log('\n📄 Resposta completa:');
    console.log(analysisText);

    // Tenta extrair JSON da resposta
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('\n📊 Análise estruturada:');
        console.log(`- Confiança: ${parsed.confidence}%`);
        console.log(`- Gerado por IA: ${parsed.isAIGenerated ? 'Sim' : 'Não'}`);
        console.log(`- Resposta: ${parsed.response}`);
        if (parsed.reasoning) {
          console.log(`- Raciocínio: ${parsed.reasoning}`);
        }
      } catch (parseError) {
        console.log('⚠️ Não foi possível fazer parse do JSON da resposta');
      }
    }

    console.log('\n🎉 Teste concluído com sucesso!');
    console.log('✅ A integração com a API da Anthropic está funcionando corretamente.');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    process.exit(1);
  }
}

// Executa o teste
testAnthropicAPI(); 