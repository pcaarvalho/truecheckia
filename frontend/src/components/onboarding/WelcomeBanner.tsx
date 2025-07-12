import { useState } from 'react'
import { X, Rocket, ArrowRight, PlayCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

interface WelcomeBannerProps {
  onStartTour?: () => void
}

export const WelcomeBanner = ({ onStartTour }: WelcomeBannerProps) => {
  const [isVisible, setIsVisible] = useState(true)
  
  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem('welcome_banner_dismissed', 'true')
  }
  
  // Verificar se o banner já foi dispensado
  const wasDismissed = localStorage.getItem('welcome_banner_dismissed')
  
  if (wasDismissed || !isVisible) {
    return null
  }
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="relative bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 border border-blue-500/30 rounded-xl p-6 mb-6"
      >
        {/* Background Pattern */}
        <div 
          className="absolute inset-0 opacity-10 rounded-xl"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E")`
          }}
        />
        
        <div className="relative flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Rocket className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">
                🎉 Bem-vindo ao TrueCheckIA!
              </h3>
            </div>
            
            <p className="text-blue-100 mb-4 max-w-2xl">
              Você agora tem acesso à tecnologia mais avançada de detecção de IA. 
              Pronto para começar sua primeira análise? Vamos te mostrar como usar a plataforma!
            </p>
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={onStartTour}
                className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors border border-white/20"
              >
                <PlayCircle size={16} />
                <span>Começar Tour</span>
              </button>
              
              <Link
                to="/dashboard?tab=analyze"
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <span>Fazer Primeira Análise</span>
                <ArrowRight size={16} />
              </Link>
              
              <Link
                to="/select-plan"
                className="flex items-center space-x-2 text-blue-200 hover:text-white transition-colors"
              >
                <span>Ver Planos</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            className="text-blue-200 hover:text-white transition-colors ml-4"
          >
            <X size={20} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}