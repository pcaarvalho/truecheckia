import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export const useOnboarding = () => {
  const [showOnboarding, setShowOnboarding] = useState(false)
  const { user } = useAuth()
  
  useEffect(() => {
    if (!user) return
    
    // Verificar se o usuário já viu o onboarding
    const hasSeenOnboarding = localStorage.getItem('onboarding_completed')
    
    // Verificar se é um usuário novo (consideramos novo se criado nos últimos 1 dia)
    const userCreatedAt = new Date(user.createdAt)
    const now = new Date()
    const daysSinceCreation = Math.floor((now.getTime() - userCreatedAt.getTime()) / (1000 * 60 * 60 * 24))
    
    const isNewUser = daysSinceCreation <= 1
    
    // Mostrar onboarding se:
    // 1. É um usuário novo E não viu o onboarding ainda
    // 2. OU se forçar via query parameter (?onboarding=true)
    const urlParams = new URLSearchParams(window.location.search)
    const forceOnboarding = urlParams.get('onboarding') === 'true'
    
    if ((isNewUser && !hasSeenOnboarding) || forceOnboarding) {
      // Aguardar um pouco antes de mostrar o modal para dar tempo da página carregar
      const timer = setTimeout(() => {
        setShowOnboarding(true)
      }, 1500)
      
      return () => clearTimeout(timer)
    }
  }, [user])
  
  const closeOnboarding = () => {
    setShowOnboarding(false)
  }
  
  const resetOnboarding = () => {
    localStorage.removeItem('onboarding_completed')
    setShowOnboarding(true)
  }
  
  return {
    showOnboarding,
    closeOnboarding,
    resetOnboarding
  }
}