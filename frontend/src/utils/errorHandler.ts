import toast from 'react-hot-toast';
import { AxiosError } from 'axios';

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

export const handleApiError = (error: unknown): ApiError => {
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.response?.data?.error || error.message;
    const code = error.response?.data?.code || error.code;

    // Log do erro para debugging
    console.error('API Error:', {
      status,
      message,
      code,
      url: error.config?.url,
      method: error.config?.method,
    });

    return {
      message: getErrorMessage(status, message),
      code,
      status,
    };
  }

  if (error instanceof Error) {
    console.error('General Error:', error.message);
    return {
      message: error.message,
    };
  }

  console.error('Unknown Error:', error);
  return {
    message: 'Ocorreu um erro inesperado',
  };
};

const getErrorMessage = (status?: number, originalMessage?: string): string => {
  switch (status) {
    case 400:
      return originalMessage || 'Dados inválidos enviados';
    case 401:
      return 'Sessão expirada. Faça login novamente';
    case 403:
      return 'Você não tem permissão para esta ação';
    case 404:
      return 'Recurso não encontrado';
    case 422:
      return originalMessage || 'Dados de entrada inválidos';
    case 429:
      return 'Muitas tentativas. Tente novamente em alguns minutos';
    case 500:
      return 'Erro interno do servidor. Tente novamente';
    case 502:
    case 503:
    case 504:
      return 'Serviço temporariamente indisponível';
    default:
      return originalMessage || 'Ocorreu um erro inesperado';
  }
};

export const showErrorToast = (error: unknown) => {
  const apiError = handleApiError(error);
  toast.error(apiError.message);
};

export const showSuccessToast = (message: string) => {
  toast.success(message);
};

export const showInfoToast = (message: string) => {
  toast(message, {
    icon: 'ℹ️',
  });
}; 