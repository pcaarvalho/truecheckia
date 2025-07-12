import { CreditCard, TrendingUp, AlertCircle, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export const PlanStatusCard = () => {
  const { user } = useAuth()
  
  const plan = user?.subscription?.plan?.name || 'FREE'
  const isTrialActive = user?.subscription?.isTrial
  const trialEndsAt = user?.subscription?.trialEndsAt
  const currentPeriodEnd = user?.subscription?.currentPeriodEnd
  
  const getPlanDetails = () => {
    switch (plan) {
      case 'FREE':
        return {
          color: 'from-gray-600 to-gray-700',
          icon: Zap,
          limits: '10 análises/mês',
          features: ['Análise de texto básica', 'Histórico limitado']
        }
      case 'PRO':
        return {
          color: 'from-blue-600 to-purple-600',
          icon: TrendingUp,
          limits: '100 análises/mês',
          features: ['Análise avançada', 'Upload de arquivos', 'API access', 'Suporte prioritário']
        }
      case 'PREMIUM':
        return {
          color: 'from-yellow-600 to-orange-600',
          icon: CreditCard,
          limits: 'Análises ilimitadas',
          features: ['Todas as funcionalidades', 'Análise em tempo real', 'Integração completa', 'Suporte 24/7']
        }
      default:
        return {
          color: 'from-gray-600 to-gray-700',
          icon: Zap,
          limits: '10 análises/mês',
          features: ['Análise de texto básica']
        }
    }
  }
  
  const planDetails = getPlanDetails()
  const Icon = planDetails.icon
  
  const getDaysRemaining = (dateString?: string) => {
    if (!dateString) return null
    const endDate = new Date(dateString)
    const today = new Date()
    const diffTime = endDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }
  
  const trialDaysRemaining = isTrialActive ? getDaysRemaining(trialEndsAt) : null
  const subscriptionDaysRemaining = getDaysRemaining(currentPeriodEnd)
  
  return (
    <div className={`bg-gradient-to-r ${planDetails.color} rounded-xl p-6 text-white`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-2xl font-bold mb-1">
            Plano {plan}
            {isTrialActive && (
              <span className="ml-2 text-sm bg-white/20 px-2 py-1 rounded-full">
                TRIAL
              </span>
            )}
          </h3>
          <p className="text-white/80">{planDetails.limits}</p>
        </div>
        <Icon size={32} className="text-white/80" />
      </div>
      
      {isTrialActive && trialDaysRemaining !== null && (
        <div className="mb-4 p-3 bg-white/10 rounded-lg flex items-center space-x-2">
          <AlertCircle size={16} />
          <span className="text-sm">
            Trial expira em {trialDaysRemaining} {trialDaysRemaining === 1 ? 'dia' : 'dias'}
          </span>
        </div>
      )}
      
      <div className="space-y-2 mb-4">
        {planDetails.features.map((feature, index) => (
          <div key={index} className="flex items-center space-x-2 text-sm text-white/90">
            <div className="w-1.5 h-1.5 bg-white/60 rounded-full" />
            <span>{feature}</span>
          </div>
        ))}
      </div>
      
      <div className="flex space-x-3">
        <Link
          to="/subscription"
          className="flex-1 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-center transition-colors text-sm font-medium"
        >
          Gerenciar Plano
        </Link>
        {(plan === 'FREE' || isTrialActive) && (
          <Link
            to="/select-plan"
            className="flex-1 bg-white hover:bg-white/90 text-gray-800 px-4 py-2 rounded-lg text-center transition-colors text-sm font-medium"
          >
            Fazer Upgrade
          </Link>
        )}
      </div>
    </div>
  )
}