import { useState, useRef, useEffect } from 'react'
import { Bell, Search, Wifi, WifiOff, ChevronDown, LogOut, Settings, CreditCard, BarChart, FileText, Home } from 'lucide-react'
import { useSocket } from '@/contexts/SocketContext'
import { useAuth } from '@/contexts/AuthContext'
import { Link, useNavigate, useLocation } from 'react-router-dom'

export const Header = () => {
  const { connected } = useSocket()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navigationItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/analysis', label: 'Análises', icon: BarChart },
    { path: '/reports', label: 'Relatórios', icon: FileText },
  ]

  const getPlanBadge = () => {
    const plan = user?.subscription?.plan?.name || 'FREE'
    const isTrialActive = user?.subscription?.isTrial
    
    let bgColor = 'bg-gray-600'
    let textColor = 'text-gray-100'
    
    if (plan === 'PRO') {
      bgColor = 'bg-gradient-to-r from-primary-500 to-secondary-500'
      textColor = 'text-white'
    } else if (plan === 'PREMIUM') {
      bgColor = 'bg-gradient-to-r from-yellow-500 to-orange-500'
      textColor = 'text-white'
    }
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${bgColor} ${textColor}`}>
        {plan} {isTrialActive && '(Trial)'}
      </span>
    )
  }

  return (
    <header className="h-16 bg-dark-900 border-b border-dark-700 flex items-center justify-between px-6">
      {/* Left side */}
      <div className="flex items-center space-x-8">
        <Link to="/dashboard" className="flex items-center space-x-2">
          <h1 className="text-xl font-bold text-white">TrueCheckIA</h1>
        </Link>
        
        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-2 text-sm font-medium transition-colors ${
                  isActive 
                    ? 'text-primary-400' 
                    : 'text-dark-400 hover:text-white'
                }`}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center space-x-2">
          {connected ? (
            <Wifi size={16} className="text-success-500" />
          ) : (
            <WifiOff size={16} className="text-error-500" />
          )}
          <span className="text-xs text-dark-400">
            {connected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center space-x-4">
        {/* Search */}
        <div className="relative hidden lg:block">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400" />
          <input
            type="text"
            placeholder="Buscar análises..."
            className="pl-10 pr-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-sm text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-64"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-dark-400 hover:text-white transition-colors">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-error-500 rounded-full"></span>
        </button>

        {/* User menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-3 hover:bg-dark-800 rounded-lg px-3 py-2 transition-colors"
          >
            <div className="text-right">
              <p className="text-sm font-medium text-white">{user?.name}</p>
              <div className="flex items-center justify-end space-x-2">
                {getPlanBadge()}
              </div>
            </div>
            <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <ChevronDown size={16} className="text-dark-400" />
          </button>

          {/* Dropdown menu */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-dark-800 border border-dark-700 rounded-lg shadow-lg py-2 z-50">
              <div className="px-4 py-3 border-b border-dark-700">
                <p className="text-sm text-white font-medium">{user?.name}</p>
                <p className="text-xs text-dark-400">{user?.email}</p>
              </div>

              <Link
                to="/subscription"
                className="flex items-center space-x-3 px-4 py-2 text-sm text-dark-400 hover:text-white hover:bg-dark-700 transition-colors"
              >
                <CreditCard size={16} />
                <span>Gerenciar Assinatura</span>
              </Link>

              <Link
                to="/settings"
                className="flex items-center space-x-3 px-4 py-2 text-sm text-dark-400 hover:text-white hover:bg-dark-700 transition-colors"
              >
                <Settings size={16} />
                <span>Configurações</span>
              </Link>

              <div className="border-t border-dark-700 mt-2 pt-2">
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-3 px-4 py-2 text-sm text-error-400 hover:text-error-300 hover:bg-dark-700 transition-colors w-full text-left"
                >
                  <LogOut size={16} />
                  <span>Sair</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
} 