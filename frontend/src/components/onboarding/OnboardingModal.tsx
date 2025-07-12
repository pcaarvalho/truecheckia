import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  FileText, 
  Upload, 
  BarChart3, 
  Settings,
  Crown,
  Sparkles,
  CheckCircle
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ComponentType<any>
  color: string
  bgColor: string
  action?: {
    label: string
    onClick: () => void
  }
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Bem-vindo ao TrueCheckIA!',
    description: 'Você está pronto para detectar conteúdo gerado por IA com nossa tecnologia avançada. Vamos conhecer os recursos principais!',
    icon: Sparkles,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-900/20'
  },
  {
    id: 'text-analysis',
    title: 'Análise de Texto',
    description: 'Cole qualquer texto e nossa IA irá detectar se foi gerado artificialmente. Perfeito para artigos, ensaios e conteúdo web.',
    icon: FileText,
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/20'
  },
  {
    id: 'file-upload',
    title: 'Upload de Arquivos',
    description: 'Em breve você poderá analisar imagens, vídeos e documentos diretamente. Mantenha-se atento às atualizações!',
    icon: Upload,
    color: 'text-purple-400',
    bgColor: 'bg-purple-900/20'
  },
  {
    id: 'reports',
    title: 'Relatórios e Histórico',
    description: 'Acompanhe todas as suas análises, veja estatísticas detalhadas e exporte relatórios profissionais.',
    icon: BarChart3,
    color: 'text-green-400',
    bgColor: 'bg-green-900/20'
  },
  {
    id: 'plans',
    title: 'Planos e Upgrade',
    description: 'Desbloqueie recursos avançados com nossos planos pagos. Comece com 7 dias grátis, sem necessidade de cartão!',
    icon: Crown,
    color: 'text-orange-400',
    bgColor: 'bg-orange-900/20',
    action: {
      label: 'Ver Planos',
      onClick: () => window.location.href = '/select-plan'
    }
  }
]

interface OnboardingModalProps {
  isOpen: boolean
  onClose: () => void
}

export const OnboardingModal = ({ isOpen, onClose }: OnboardingModalProps) => {
  const [currentStep, setCurrentStep] = useState(0)
  const { user } = useAuth()
  
  const nextStep = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }
  
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }
  
  const handleComplete = () => {
    // Marcar onboarding como completo no localStorage
    localStorage.setItem('onboarding_completed', 'true')
    onClose()
  }
  
  const handleSkip = () => {
    localStorage.setItem('onboarding_completed', 'true')
    onClose()
  }
  
  const step = onboardingSteps[currentStep]
  const Icon = step.icon
  
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl max-w-md w-full overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-white">
                Guia Rápido ({currentStep + 1}/{onboardingSteps.length})
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Progress bar */}
            <div className="h-1 bg-slate-800">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / onboardingSteps.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            
            {/* Content */}
            <div className="p-6">
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="text-center"
              >
                <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl ${step.bgColor} flex items-center justify-center`}>
                  <Icon size={32} className={step.color} />
                </div>
                
                <h3 className="text-xl font-bold text-white mb-3">
                  {step.title}
                </h3>
                
                <p className="text-gray-300 text-sm leading-relaxed mb-6">
                  {step.description}
                </p>
                
                {step.action && (
                  <button
                    onClick={step.action.onClick}
                    className="mb-4 w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-2 px-4 rounded-lg transition-colors text-sm font-medium"
                  >
                    {step.action.label}
                  </button>
                )}
              </motion.div>
            </div>
            
            {/* Footer */}
            <div className="flex items-center justify-between p-6 bg-slate-800/50">
              <button
                onClick={handleSkip}
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Pular Tutorial
              </button>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className="p-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                
                <button
                  onClick={nextStep}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                >
                  {currentStep === onboardingSteps.length - 1 ? (
                    <>
                      <CheckCircle size={16} />
                      <span>Concluir</span>
                    </>
                  ) : (
                    <>
                      <span>Próximo</span>
                      <ChevronRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}