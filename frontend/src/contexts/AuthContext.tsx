import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authService } from '../services/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  plan?: any;
  requiresPlanSelection?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Restaurar usuário autenticado ao carregar a aplicação
  useEffect(() => {
    const restoreUser = async () => {
      const accessToken = localStorage.getItem('accessToken');
      
      if (!accessToken) {
        setLoading(false);
        return;
      }
      
      try {
        console.log('🔄 Restaurando usuário...');
        const response = await authService.me();
        console.log('✅ Usuário restaurado:', response.data.user);
        setUser(response.data.user);
      } catch (error) {
        console.error('❌ Erro ao restaurar usuário:', error);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    restoreUser();
  }, []);

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    navigate('/');
    toast.success('Logout realizado com sucesso!');
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('🔄 Tentando fazer login...', { email });
      
      const response = await authService.login(email, password);
      console.log('✅ Resposta do login:', response.data);

      const { accessToken, refreshToken, user } = response.data;

      if (!accessToken || !refreshToken || !user) {
        throw new Error('Resposta inválida do servidor');
      }

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      setUser(user);

      toast.success('Login realizado com sucesso!');
      
      // Verifica se o usuário precisa selecionar um plano
      if (user.requiresPlanSelection) {
        navigate('/select-plan');
      } else {
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('❌ Erro no login:', error);
      
      let message = 'Erro ao fazer login';
      
      if (error.response) {
        const serverError = error.response.data;
        message = serverError.error || serverError.message || 'Credenciais inválidas';
        
        if (error.response.status === 401) {
          message = 'Email ou senha incorretos';
        } else if (error.response.status === 400) {
          message = 'Dados inválidos';
        } else if (error.response.status >= 500) {
          message = 'Erro interno do servidor';
        }
      } else if (error.request) {
        message = 'Erro de conexão. Verifique sua internet.';
      } else {
        message = error.message || 'Erro desconhecido';
      }
      
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      setLoading(true);
      
      const response = await authService.register(name, email, password);

      const { accessToken, refreshToken, user } = response.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      setUser(user);

      toast.success(response.data.message || 'Conta criada com sucesso!');
      
      // Usuários novos sempre precisam selecionar um plano
      navigate('/select-plan');
    } catch (error: any) {
      console.error('❌ Erro no registro:', error);
      
      let message = 'Erro ao criar conta';
      
      if (error.response) {
        const serverError = error.response.data;
        message = serverError.error || serverError.message || 'Erro no registro';
        
        if (error.response.status === 409) {
          message = 'Email já cadastrado';
        } else if (error.response.status === 400) {
          message = 'Dados inválidos';
        }
      } else if (error.request) {
        message = 'Erro de conexão. Verifique sua internet.';
      } else {
        message = error.message || 'Erro desconhecido';
      }
      
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateUser = (data: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...data } : null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 