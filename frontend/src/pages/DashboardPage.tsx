import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  FileText, 
  Upload,
  History,
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle,
  BarChart3,
  Activity,
  AlertTriangle,
  Zap,
  Eye
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useSocket } from '../contexts/SocketContext'
import { authService } from '../services/api'

interface AnalysisResult {
  message: string
  provider: string
  confidence: number
  isAIGenerated: boolean
  response: string
  analysisId: string
}

interface Analysis {
  id: string
  title: string
  textContent?: string
  confidence: number
  isAIGenerated: boolean
  status: string
  createdAt: string
  metadata?: string
}

export const DashboardPage = () => {
  const { user } = useAuth()
  const { socket, connected: isConnected } = useSocket()
  
  const [activeTab, setActiveTab] = useState<'analyze' | 'upload' | 'history'>('analyze')
  const [isLoading, setIsLoading] = useState(false)
  
  // Estado da análise de texto
  const [textContent, setTextContent] = useState('')
  const [title, setTitle] = useState('')
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  
  // Estado do histórico
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  // Carregar histórico ao montar
  useEffect(() => {
    loadAnalysisHistory()
  }, [])

  const loadAnalysisHistory = async () => {
    try {
      setHistoryLoading(true)
      const response = await authService.get('/api/analysis?limit=10')
      setAnalyses(response.data.analyses || [])
    } catch (error) {
      console.error('Erro ao carregar histórico:', error)
    } finally {
      setHistoryLoading(false)
    }
  }

  const analyzeText = async () => {
    if (!textContent.trim() || textContent.length < 10) {
      alert('Digite pelo menos 10 caracteres para análise')
      return
    }

    try {
      setIsLoading(true)
      setAnalysisResult(null)
      
      const response = await authService.post('/api/analysis/text', {
        textContent: textContent.trim(),
        title: title.trim() || undefined
      })

      setAnalysisResult(response.data)
      
      // Recarregar histórico
      await loadAnalysisHistory()
      
    } catch (error: any) {
      console.error('Erro na análise:', error)
      alert(error.response?.data?.error || 'Erro ao analisar texto')
    } finally {
      setIsLoading(false)
    }
  }

  const clearForm = () => {
    setTextContent('')
    setTitle('')
    setAnalysisResult(null)
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-400'
    if (confidence >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle size={16} className="text-green-500" />
      case 'FAILED':
        return <XCircle size={16} className="text-red-500" />
      case 'PROCESSING':
        return <Activity size={16} className="text-blue-500 animate-pulse" />
      default:
        return <Clock size={16} className="text-yellow-500" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-xl p-6 border border-blue-500/20"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">
              TrueCheckIA - Detecção de Conteúdo Gerado por IA
            </h1>
            <p className="text-gray-300">
              Bem-vindo, {user?.name}! Use nossa IA avançada para detectar conteúdo artificial.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-300">
              {isConnected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Tabs Navigation */}
      <div className="flex space-x-1 bg-slate-800 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('analyze')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
            activeTab === 'analyze' 
              ? 'bg-blue-600 text-white' 
              : 'text-gray-400 hover:text-white hover:bg-slate-700'
          }`}
        >
          <FileText size={18} />
          <span>Analisar Texto</span>
        </button>
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
            activeTab === 'upload' 
              ? 'bg-blue-600 text-white' 
              : 'text-gray-400 hover:text-white hover:bg-slate-700'
          }`}
        >
          <Upload size={18} />
          <span>Upload Arquivo</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
            activeTab === 'history' 
              ? 'bg-blue-600 text-white' 
              : 'text-gray-400 hover:text-white hover:bg-slate-700'
          }`}
        >
          <History size={18} />
          <span>Histórico</span>
        </button>
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Análise de Texto */}
        {activeTab === 'analyze' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Form */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <FileText className="mr-2 text-blue-400" size={24} />
                Análise de Texto
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Título (opcional)
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Título do texto para análise"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    maxLength={200}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Texto para Análise (mín. 10 caracteres)
                  </label>
                  <textarea
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder="Cole aqui o texto que deseja analisar..."
                    className="w-full h-40 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    maxLength={50000}
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    {textContent.length}/50000 caracteres
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={analyzeText}
                    disabled={isLoading || textContent.length < 10}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
                  >
                    {isLoading ? (
                      <>
                        <Activity size={18} className="mr-2 animate-spin" />
                        Analisando...
                      </>
                    ) : (
                      <>
                        <Zap size={18} className="mr-2" />
                        Analisar Texto
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={clearForm}
                    className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
                  >
                    Limpar
                  </button>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <BarChart3 className="mr-2 text-green-400" size={24} />
                Resultado da Análise
              </h2>
              
              {analysisResult ? (
                <div className="space-y-4">
                  {/* Status Card */}
                  <div className={`p-4 rounded-lg border-2 ${
                    analysisResult.isAIGenerated 
                      ? 'bg-red-900/20 border-red-500/50' 
                      : 'bg-green-900/20 border-green-500/50'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-white">
                        {analysisResult.isAIGenerated ? 'IA Detectada' : 'Conteúdo Humano'}
                      </span>
                      {analysisResult.isAIGenerated ? (
                        <AlertTriangle className="text-red-400" size={24} />
                      ) : (
                        <CheckCircle className="text-green-400" size={24} />
                      )}
                    </div>
                    <div className="text-2xl font-bold mb-1">
                      <span className={getConfidenceColor(analysisResult.confidence)}>
                        {analysisResult.confidence.toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-sm text-gray-400">
                      Confiança da análise
                    </div>
                  </div>

                  {/* Provider */}
                  <div className="bg-slate-700 p-3 rounded-lg">
                    <div className="text-sm text-gray-400">Analisado por</div>
                    <div className="text-white font-medium">{analysisResult.provider}</div>
                  </div>

                  {/* Response */}
                  <div className="bg-slate-700 p-3 rounded-lg">
                    <div className="text-sm text-gray-400 mb-2">Análise Detalhada</div>
                    <div className="text-white text-sm leading-relaxed">
                      {analysisResult.response}
                    </div>
                  </div>

                  {/* Message */}
                  <div className="bg-blue-900/20 p-3 rounded-lg border border-blue-500/30">
                    <div className="text-blue-300 text-sm">
                      {analysisResult.message}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Eye size={48} className="mx-auto text-gray-500 mb-4" />
                  <p className="text-gray-400">
                    Os resultados da análise aparecerão aqui
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Upload de Arquivo */}
        {activeTab === 'upload' && (
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Upload className="mr-2 text-purple-400" size={24} />
              Upload de Arquivo
            </h2>
            <div className="text-center py-12">
              <Upload size={64} className="mx-auto text-gray-500 mb-4" />
              <p className="text-gray-400 mb-2">Funcionalidade em desenvolvimento</p>
              <p className="text-sm text-gray-500">
                Em breve você poderá fazer upload de documentos, imagens e vídeos para análise
              </p>
            </div>
          </div>
        )}

        {/* Histórico */}
        {activeTab === 'history' && (
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <History className="mr-2 text-yellow-400" size={24} />
                Histórico de Análises
              </h2>
              <button
                onClick={loadAnalysisHistory}
                disabled={historyLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg text-sm transition-colors"
              >
                {historyLoading ? 'Carregando...' : 'Atualizar'}
              </button>
            </div>
            
            {historyLoading ? (
              <div className="text-center py-8">
                <Activity size={32} className="mx-auto text-blue-500 animate-spin mb-4" />
                <p className="text-gray-400">Carregando histórico...</p>
              </div>
            ) : analyses.length > 0 ? (
            <div className="space-y-4">
                {analyses.map((analysis) => (
                  <div key={analysis.id} className="bg-slate-700 p-4 rounded-lg border border-slate-600">
                    <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                        {getStatusIcon(analysis.status)}
                    <div>
                          <h3 className="text-white font-medium">
                            {analysis.title || 'Análise sem título'}
                          </h3>
                          <p className="text-xs text-gray-400">
                            {formatDate(analysis.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                    {analysis.status === 'COMPLETED' && (
                      <div className="text-right">
                          <div className={`text-sm font-medium ${getConfidenceColor(analysis.confidence)}`}>
                          {analysis.confidence.toFixed(1)}%
                        </div>
                          <div className="text-xs text-gray-400">
                          {analysis.isAIGenerated ? 'IA Detectada' : 'Humano'}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {analysis.textContent && (
                      <div className="mt-3 p-3 bg-slate-800 rounded text-sm text-gray-300">
                        {analysis.textContent.substring(0, 150)}
                        {analysis.textContent.length > 150 && '...'}
                      </div>
                    )}
                </div>
              ))}
            </div>
            ) : (
              <div className="text-center py-8">
                <History size={48} className="mx-auto text-gray-500 mb-4" />
                <p className="text-gray-400">Nenhuma análise encontrada</p>
                <p className="text-sm text-gray-500 mt-2">
                  Faça sua primeira análise de texto para ver o histórico
                </p>
            </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  )
} 