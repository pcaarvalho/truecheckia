const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001';

async function testAuth() {
  console.log('🧪 Testando sistema de autenticação...\n');

  try {
    // Teste 1: Health check
    console.log('1. Testando health check...');
    const healthResponse = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ Health check OK:', healthResponse.data);
    console.log('');

    // Teste 2: Registro de usuário
    console.log('2. Testando registro de usuário...');
    const testUser = {
      name: 'Teste Usuário',
      email: `teste${Date.now()}@example.com`,
      password: '123456'
    };

    const registerResponse = await axios.post(`${API_BASE_URL}/api/auth/register`, testUser);
    console.log('✅ Registro OK:', {
      user: registerResponse.data.user,
      hasToken: !!registerResponse.data.accessToken,
      hasRefreshToken: !!registerResponse.data.refreshToken
    });
    console.log('');

    // Teste 3: Login
    console.log('3. Testando login...');
    const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    console.log('✅ Login OK:', {
      user: loginResponse.data.user,
      hasToken: !!loginResponse.data.accessToken,
      hasRefreshToken: !!loginResponse.data.refreshToken
    });
    console.log('');

    // Teste 4: Acesso a rota protegida
    console.log('4. Testando acesso a rota protegida...');
    const token = loginResponse.data.accessToken;
    const profileResponse = await axios.get(`${API_BASE_URL}/api/user/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Acesso protegido OK:', profileResponse.data);
    console.log('');

    // Teste 5: Login com credenciais inválidas
    console.log('5. Testando login com credenciais inválidas...');
    try {
      await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email: testUser.email,
        password: 'senhaerrada'
      });
      console.log('❌ Erro: Login deveria ter falhado');
    } catch (error) {
      console.log('✅ Login inválido tratado corretamente:', error.response.data.error);
    }
    console.log('');

    console.log('🎉 Todos os testes passaram!');

  } catch (error) {
    console.error('❌ Erro nos testes:', error.response?.data || error.message);
  }
}

// Executar testes
testAuth(); 