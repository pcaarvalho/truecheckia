import React, { useEffect } from 'react';
import { checkEnvironment, debug } from '../utils/debug';

const TestPage = () => {
  useEffect(() => {
    debug.info('TestPage carregada');
    checkEnvironment();
  }, []);

  const handleTestClick = () => {
    debug.log('Botão de teste clicado');
    alert('Botão funcionando! React está operacional.');
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#1e293b', 
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem', textAlign: 'center' }}>
        🧪 Teste TrueCheckIA
      </h1>
      
      <p style={{ fontSize: '1.2rem', textAlign: 'center', maxWidth: '600px', marginBottom: '2rem' }}>
        Se você está vendo esta página, o React está funcionando corretamente!
      </p>
      
      <div style={{ 
        backgroundColor: '#334155', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '2rem',
        maxWidth: '500px',
        width: '100%'
      }}>
        <h3 style={{ marginBottom: '1rem' }}>Informações do Sistema:</h3>
        <ul style={{ textAlign: 'left', lineHeight: '1.6' }}>
          <li>✅ React funcionando</li>
          <li>✅ Roteamento funcionando</li>
          <li>✅ Página carregada</li>
          <li>✅ JavaScript ativo</li>
        </ul>
      </div>
      
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button 
          style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onClick={handleTestClick}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
        >
          🎯 Testar Interação
        </button>
        
        <button 
          style={{
            backgroundColor: '#10b981',
            color: 'white',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onClick={() => {
            debug.log('Verificando console...');
            console.log('✅ Console funcionando!');
            alert('Verifique o console do navegador (F12) para mais informações de debug.');
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#059669'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
        >
          🔍 Verificar Console
        </button>
      </div>
      
      <div style={{ 
        marginTop: '2rem', 
        fontSize: '0.9rem', 
        color: '#94a3b8',
        textAlign: 'center'
      }}>
        <p>Abra o console do navegador (F12) para ver logs de debug detalhados</p>
        <p>Se esta página carrega, o problema pode estar em outros componentes</p>
      </div>
    </div>
  );
};

export default TestPage; 