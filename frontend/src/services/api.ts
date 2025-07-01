import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token de autorização
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar erros de resposta
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Se o erro for 401 e não for uma tentativa de refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(
            `${API_BASE_URL}/api/auth/refresh`,
            { refreshToken }
          );

          const { accessToken } = response.data;
          localStorage.setItem('accessToken', accessToken);
          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;

          return api(originalRequest);
        }
      } catch (refreshError) {
        // Se o refresh falhar, remove os tokens e redireciona para login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Tipos para as respostas da API
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface AnalysisResult {
  message: string;
  provider: string;
  confidence: number;
  isAIGenerated: boolean;
  response: string;
  analysisId: string;
}

// Serviços específicos
export const authService = {
  login: (email: string, password: string) =>
    api.post('/api/auth/login', { email, password }),
  
  register: (name: string, email: string, password: string) =>
    api.post('/api/auth/register', { name, email, password }),
  
  refresh: (refreshToken: string) =>
    api.post('/api/auth/refresh', { refreshToken }),
  
  logout: () => api.post('/api/auth/logout'),

  me: () => api.get('/api/auth/me'),

  getProfile: () => api.get('/api/user/profile'),

  // Métodos genéricos para facilitar uso
  get: (url: string, config?: any) => api.get(url, config),
  
  post: (url: string, data?: any, config?: any) => api.post(url, data, config),
  
  put: (url: string, data?: any, config?: any) => api.put(url, data, config),
  
  delete: (url: string, config?: any) => api.delete(url, config),
};

export const analysisService = {
  // Análise direta de texto (síncrona)
  analyzeText: (data: { textContent: string; title?: string; description?: string }): Promise<{ data: AnalysisResult }> =>
    api.post('/api/analysis/text', data),

  // Análise assíncrona (para uploads)
  create: (data: { title?: string; description?: string; textContent?: string }) =>
    api.post('/api/analysis', data),
  
  upload: (file: File, data: { title?: string; description?: string }) => {
    const formData = new FormData();
    formData.append('file', file);
    if (data.title) formData.append('title', data.title);
    if (data.description) formData.append('description', data.description);
    
    return api.post('/api/analysis/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  list: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get('/api/analysis', { params }),
  
  get: (id: string) => api.get(`/api/analysis/${id}`),
  
  delete: (id: string) => api.delete(`/api/analysis/${id}`),
};

export const userService = {
  getProfile: () => api.get('/api/user/profile'),
  
  updateProfile: (data: { name?: string; email?: string }) =>
    api.put('/api/user/profile', data),
  
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/api/user/password', data),

  getStats: () => api.get('/api/user/stats'),
};

export const reportService = {
  create: (data: { title: string; analysisId?: string; type: string }) =>
    api.post('/api/reports', data),
  
  list: (params?: { page?: number; limit?: number }) =>
    api.get('/api/reports', { params }),
  
  get: (id: string) => api.get(`/api/reports/${id}`),
  
  delete: (id: string) => api.delete(`/api/reports/${id}`),

  export: (id: string, format: string = 'pdf') => 
    api.get(`/api/reports/${id}/export`, { params: { format } }),
}; 