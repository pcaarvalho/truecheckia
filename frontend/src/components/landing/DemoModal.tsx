import React, { useState } from 'react';
import { X, Play, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DemoModal: React.FC<DemoModalProps> = ({ isOpen, onClose }) => {
  const [demoText, setDemoText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<{
    aiProbability: number;
    isAIGenerated: boolean;
    confidence: number;
  } | null>(null);

  const sampleTexts = [
    'A inteligência artificial revolucionou a forma como processamos informações, criando novas possibilidades para o futuro da tecnologia.',
    'O desenvolvimento sustentável é fundamental para garantir um futuro melhor para as próximas gerações.',
    'A transformação digital está redefinindo os paradigmas empresariais em todo o mundo.',
  ];

  const handleDemo = async () => {
    if (!demoText.trim()) return;

    setIsAnalyzing(true);
    setResult(null);

    // Simular análise
    await new Promise(resolve => setTimeout(resolve, 2000));

    const aiProbability = Math.random() * 100;
    const isAIGenerated = aiProbability > 50;
    const confidence = Math.random() * 20 + 80;

    setResult({
      aiProbability,
      isAIGenerated,
      confidence,
    });
    setIsAnalyzing(false);
  };

  const handleSampleText = (text: string) => {
    setDemoText(text);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Demonstração da Plataforma</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Textos de exemplo */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Textos de Exemplo</h3>
            <div className="grid gap-2">
              {sampleTexts.map((text, index) => (
                <button
                  key={index}
                  onClick={() => handleSampleText(text)}
                  className="text-left p-3 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors text-slate-300 hover:text-white"
                >
                  {text.substring(0, 80)}...
                </button>
              ))}
            </div>
          </div>

          {/* Área de texto */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Digite ou cole o texto para análise
            </label>
            <textarea
              value={demoText}
              onChange={e => setDemoText(e.target.value)}
              placeholder="Cole aqui o texto que deseja analisar..."
              className="w-full h-32 p-4 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Botão de análise */}
          <button
            onClick={handleDemo}
            disabled={!demoText.trim() || isAnalyzing}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Analisando...</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                <span>Analisar Texto</span>
              </>
            )}
          </button>

          {/* Resultado */}
          {result && (
            <div className="p-6 bg-slate-700/30 rounded-lg border border-slate-600">
              <h3 className="text-lg font-semibold text-white mb-4">Resultado da Análise</h3>

              <div className="space-y-4">
                {/* Probabilidade de IA */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-300">Probabilidade de IA</span>
                    <span className="text-white font-semibold">
                      {result.aiProbability.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-600 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-1000 ${
                        result.aiProbability > 70
                          ? 'bg-red-500'
                          : result.aiProbability > 40
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                      }`}
                      style={{ width: `${result.aiProbability}%` }}
                    />
                  </div>
                </div>

                {/* Classificação */}
                <div className="flex items-center space-x-3">
                  {result.isAIGenerated ? (
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                  ) : (
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  )}
                  <span
                    className={`font-semibold ${
                      result.isAIGenerated ? 'text-red-400' : 'text-green-400'
                    }`}
                  >
                    {result.isAIGenerated ? 'Provavelmente gerado por IA' : 'Provavelmente humano'}
                  </span>
                </div>

                {/* Confiança */}
                <div className="text-sm text-slate-400">
                  Nível de confiança: {result.confidence.toFixed(1)}%
                </div>
              </div>
            </div>
          )}

          {/* Informações adicionais */}
          <div className="text-center text-sm text-slate-400">
            <p>Esta é uma demonstração. Para análises completas, faça login na plataforma.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoModal;
