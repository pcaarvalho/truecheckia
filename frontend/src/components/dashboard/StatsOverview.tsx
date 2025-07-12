import { useState, useEffect } from 'react'
import { TrendingUp, FileCheck, AlertTriangle, Clock } from 'lucide-react'
import { authService } from '@/services/api'

interface Stats {
  totalAnalyses: number
  aiDetected: number
  humanContent: number
  averageConfidence: number
  recentAnalyses: number
  pendingAnalyses: number
}

export const StatsOverview = () => {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchStats()
  }, [])
  
  const fetchStats = async () => {
    try {
      const response = await authService.get('/api/user/stats')
      setStats(response.data)
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const statCards = [
    {
      title: 'Total de Análises',
      value: stats?.totalAnalyses || 0,
      icon: FileCheck,
      color: 'text-blue-400',
      bgColor: 'bg-blue-900/20'
    },
    {
      title: 'IA Detectada',
      value: stats?.aiDetected || 0,
      icon: AlertTriangle,
      color: 'text-red-400',
      bgColor: 'bg-red-900/20',
      percentage: stats ? ((stats.aiDetected / stats.totalAnalyses) * 100).toFixed(1) : '0'
    },
    {
      title: 'Conteúdo Humano',
      value: stats?.humanContent || 0,
      icon: TrendingUp,
      color: 'text-green-400',
      bgColor: 'bg-green-900/20',
      percentage: stats ? ((stats.humanContent / stats.totalAnalyses) * 100).toFixed(1) : '0'
    },
    {
      title: 'Confiança Média',
      value: `${stats?.averageConfidence?.toFixed(1) || '0.0'}%`,
      icon: TrendingUp,
      color: 'text-purple-400',
      bgColor: 'bg-purple-900/20'
    }
  ]
  
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-slate-800 rounded-xl p-6 border border-slate-700 animate-pulse">
            <div className="h-4 bg-slate-700 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-slate-700 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div
              key={index}
              className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-slate-600 transition-colors"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon size={20} className={stat.color} />
                </div>
                {stat.percentage && (
                  <span className="text-xs text-gray-400">
                    {stat.percentage}%
                  </span>
                )}
              </div>
              <p className="text-gray-400 text-sm mb-1">{stat.title}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          )
        })}
      </div>
      
      {stats && stats.recentAnalyses > 0 && (
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 flex items-center space-x-3">
          <Clock size={20} className="text-blue-400" />
          <p className="text-blue-300 text-sm">
            Você realizou {stats.recentAnalyses} análises nas últimas 24 horas
          </p>
        </div>
      )}
    </div>
  )
}