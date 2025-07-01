#!/bin/bash

# Script de setup para o TrueCheckIA Backend
echo "🚀 Configurando TrueCheckIA Backend..."

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Por favor, instale o Node.js 18+"
    exit 1
fi

# Verificar se o npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm não encontrado. Por favor, instale o npm"
    exit 1
fi

# Verificar versão do Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js versão 18+ é necessária. Versão atual: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) encontrado"

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Verificar se o Docker está instalado
if command -v docker &> /dev/null; then
    echo "🐳 Docker encontrado. Iniciando serviços..."
    docker-compose -f docker-compose.dev.yml up -d
    
    echo "⏳ Aguardando serviços ficarem prontos..."
    sleep 10
else
    echo "⚠️  Docker não encontrado. Certifique-se de ter PostgreSQL e Redis rodando localmente"
fi

# Copiar arquivo de ambiente se não existir
if [ ! -f .env ]; then
    echo "📝 Criando arquivo .env..."
    cat > .env << EOF
# Ambiente
NODE_ENV=development

# Servidor
PORT=5000

# Banco de Dados
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/truecheckia_dev"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters-long"
JWT_REFRESH_SECRET="your-super-secret-jwt-refresh-key-minimum-32-characters-long"
JWT_EXPIRES_IN="1h"
JWT_REFRESH_EXPIRES_IN="7d"

# MinIO
MINIO_ENDPOINT="localhost"
MINIO_PORT=9000
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_BUCKET="truecheckia"
MINIO_USE_SSL=false

# CORS
CORS_ORIGIN="*"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
EOF
    echo "✅ Arquivo .env criado"
else
    echo "✅ Arquivo .env já existe"
fi

# Gerar cliente Prisma
echo "🔧 Gerando cliente Prisma..."
npm run prisma:generate

# Executar migrações
echo "🗄️  Executando migrações..."
npm run prisma:migrate

# Instalar Husky
echo "🐕 Configurando Husky..."
npm run prepare

echo "✅ Setup concluído!"
echo ""
echo "📋 Próximos passos:"
echo "1. Edite o arquivo .env com suas configurações"
echo "2. Execute 'npm run dev' para iniciar o servidor"
echo "3. Acesse http://localhost:5000/api-docs para ver a documentação"
echo ""
echo "🔧 Scripts úteis:"
echo "- npm run dev: Iniciar servidor de desenvolvimento"
echo "- npm run test: Executar testes"
echo "- npm run lint: Verificar código"
echo "- npm run db:studio: Abrir Prisma Studio" 