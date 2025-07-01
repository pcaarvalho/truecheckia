import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from './AuthContext'

interface SocketContextType {
  socket: Socket | null
  connected: boolean
  connect: () => void
  disconnect: () => void
  isConnecting: boolean
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

interface SocketProviderProps {
  children: ReactNode
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const { user, loading: authLoading } = useAuth()
  const socketRef = useRef<Socket | null>(null)
  const connectionAttempts = useRef(0)
  const maxRetries = 3

  const disconnect = () => {
    if (socketRef.current) {
      console.log('🔌 Desconectando socket...')
      socketRef.current.removeAllListeners()
      socketRef.current.disconnect()
      socketRef.current = null
      setSocket(null)
      setConnected(false)
      setIsConnecting(false)
      connectionAttempts.current = 0
    }
  }

  const connect = () => {
    if (isConnecting || !user || authLoading || socketRef.current?.connected) {
      return
    }

    if (connectionAttempts.current >= maxRetries) {
      console.error('❌ Máximo de tentativas de conexão atingido')
      return
    }

    console.log('🔄 Conectando socket...')
    setIsConnecting(true)
    connectionAttempts.current++

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    
    const newSocket = io(API_URL, {
      transports: ['websocket'],
      autoConnect: false,
      timeout: 5000,
      reconnection: false,
    })

    newSocket.on('connect', () => {
      console.log('✅ Socket conectado com sucesso')
      setConnected(true)
      setIsConnecting(false)
      connectionAttempts.current = 0
      
      const token = localStorage.getItem('accessToken')
      if (token) {
        newSocket.emit('authenticate', token)
      }
    })

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 Socket desconectado:', reason)
      setConnected(false)
      setIsConnecting(false)
    })

    newSocket.on('authenticated', (data) => {
      console.log('🔐 Socket autenticado:', data)
    })

    newSocket.on('auth_error', (error) => {
      console.error('❌ Erro de autenticação do socket:', error)
      setIsConnecting(false)
    })

    newSocket.on('connect_error', (error) => {
      console.error('❌ Erro de conexão do socket:', error)
      setIsConnecting(false)
    })

    newSocket.connect()
    socketRef.current = newSocket
    setSocket(newSocket)
  }

  useEffect(() => {
    if (authLoading) {
      return
    }

    if (user && !connected && !isConnecting) {
      const timer = setTimeout(() => {
        connect()
      }, 1000)
      
      return () => clearTimeout(timer)
    } else if (!user && socketRef.current) {
      disconnect()
    }
  }, [user, authLoading, connected, isConnecting])

  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [])

  const value: SocketContextType = {
    socket,
    connected,
    connect,
    disconnect,
    isConnecting,
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
} 