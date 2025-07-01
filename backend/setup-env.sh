#!/bin/bash

# Script para configurar variáveis de ambiente do TrueCheckIA Backend

echo "🔧 Configurando variáveis de ambiente para o TrueCheckIA Backend..."

# Verificar se o arquivo .env já existe
if [ -f ".env" ]; then
    echo "⚠️  Arquivo .env já existe. Fazendo backup..."
    cp .env .env.backup
fi

# Gerar chaves JWT seguras
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)

# Criar arquivo .env
cat > .env << EOF
# Configuração do Ambiente
NODE_ENV=development

# Configuração do Banco de Dados (PostgreSQL)
DATABASE_URL="postgresql://postgres:password@localhost:5432/truecheckia?schema=public"

# Configuração do Redis
REDIS_URL="redis://localhost:6379"

# Configuração de JWT
JWT_SECRET="${JWT_SECRET}"
JWT_REFRESH_SECRET="${JWT_REFRESH_SECRET}"

# Configuração da API Anthropic (Claude)
ANTHROPIC_API_KEY="sua-chave-api-anthropic-aqui"

# Configuração do MinIO (Storage)
MINIO_ENDPOINT="localhost"
MINIO_PORT=9000
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_BUCKET="truecheckia"

# Configuração do Servidor
PORT=3001
HOST="0.0.0.0"

# Configuração de Logs
LOG_LEVEL="info"
LOG_FILE="logs/app.log"

# Configuração de Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Configuração de Upload
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES="image/jpeg,image/png,image/gif,video/mp4,video/avi,video/mov"

# Configuração de Email (opcional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="seu-email@gmail.com"
SMTP_PASS="sua-senha-de-app"

# Configuração de CORS
CORS_ORIGIN="http://localhost:5173,http://localhost:3000"

# Configuração de Segurança
BCRYPT_ROUNDS=12
SESSION_SECRET="${SESSION_SECRET}"
EOF

echo "✅ Arquivo .env criado com sucesso!"
echo ""
echo "📝 IMPORTANTE: Você precisa configurar as seguintes variáveis:"
echo "   - DATABASE_URL: URL de conexão com seu banco PostgreSQL"
echo "   - REDIS_URL: URL de conexão com Redis (se estiver usando)"
echo "   - ANTHROPIC_API_KEY: Sua chave da API Anthropic"
echo ""
echo "🔗 Para obter uma chave da Anthropic:"
echo "   https://console.anthropic.com/"
echo ""
echo "🚀 Para rodar o backend:"
echo "   npm start"
echo ""
echo "📚 Para mais informações, consulte o README.md" 