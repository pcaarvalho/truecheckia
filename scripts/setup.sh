#!/bin/bash

echo "🚀 Configurando AI Content Detector SaaS..."

# Verifica se o Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não está instalado. Por favor, instale o Docker primeiro."
    exit 1
fi

# Verifica se o Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose não está instalado. Por favor, instale o Docker Compose primeiro."
    exit 1
fi

# Cria arquivo .env se não existir
if [ ! -f .env ]; then
    echo "📝 Criando arquivo .env..."
    cp .env.example .env
    echo "✅ Arquivo .env criado. Por favor, configure as variáveis de ambiente."
fi

# Cria diretórios necessários
echo "📁 Criando diretórios..."
mkdir -p backend/logs
mkdir -p frontend/build
mkdir -p docker/nginx/ssl

# Instala dependências do backend
echo "📦 Instalando dependências do backend..."
cd backend
npm install

# Gera o cliente Prisma
echo "🔧 Gerando cliente Prisma..."
npx prisma generate

cd ..

# Instala dependências do frontend
echo "📦 Instalando dependências do frontend..."
cd frontend
npm install

cd ..

# Constrói as imagens Docker
echo "🐳 Construindo imagens Docker..."
docker-compose build

echo "✅ Configuração concluída!"
echo ""
echo "📋 Próximos passos:"
echo "1. Configure as variáveis de ambiente no arquivo .env"
echo "2. Obtenha as chaves das APIs de detecção de IA:"
echo "   - GPTZero: https://gptzero.me/"
echo "   - Hive: https://hivemoderation.com/"
echo "   - OpenAI: https://platform.openai.com/"
echo "3. Execute: docker-compose up"
echo "4. Acesse: http://localhost:3000"
echo ""
echo "📚 Documentação:"
echo "- Arquitetura: docs/ARCHITECTURE.md"
echo "- API: docs/API.md"
echo "- README: README.md" 