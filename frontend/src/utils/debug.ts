import React from 'react';

// Utilitário de debug para diagnosticar problemas
export const debug = {
  log: (message: string, data?: any) => {
    console.log(`[DEBUG] ${message}`, data || '');
  },

  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error || '');
  },

  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data || '');
  },

  info: (message: string, data?: any) => {
    console.info(`[INFO] ${message}`, data || '');
  },
};

// Função para verificar se o ambiente está funcionando
export const checkEnvironment = () => {
  debug.info('Verificando ambiente...');

  // Verificar se o React está funcionando
  if (typeof React !== 'undefined') {
    debug.log('React está disponível');
  } else {
    debug.error('React não está disponível');
  }

  // Verificar se o DOM está funcionando
  if (typeof document !== 'undefined') {
    debug.log('DOM está disponível');
    debug.log('Elemento root:', document.getElementById('root'));
  } else {
    debug.error('DOM não está disponível');
  }

  // Verificar variáveis de ambiente
  debug.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
  debug.log('NODE_ENV:', import.meta.env.NODE_ENV);
  debug.log('MODE:', import.meta.env.MODE);

  // Verificar se o Tailwind está funcionando
  const testElement = document.createElement('div');
  testElement.className = 'bg-blue-500 text-white p-4';
  testElement.textContent = 'Teste Tailwind';
  document.body.appendChild(testElement);

  setTimeout(() => {
    const computedStyle = window.getComputedStyle(testElement);
    if (computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)') {
      debug.log('Tailwind CSS está funcionando');
    } else {
      debug.warn('Tailwind CSS pode não estar funcionando');
    }
    document.body.removeChild(testElement);
  }, 100);
};

// Função para testar componentes
export const testComponent = (componentName: string, component: any) => {
  debug.info(`Testando componente: ${componentName}`);

  if (component && typeof component === 'function') {
    debug.log(`${componentName} é uma função válida`);
  } else {
    debug.error(`${componentName} não é uma função válida`);
  }
};
