#!/bin/bash

# Script para configurar ambiente de desenvolvimento simples do TrueCheckIA Backend

echo "🔧 Configurando ambiente de desenvolvimento simples..."

# Verificar se o arquivo .env já existe
if [ -f ".env" ]; then
    echo "⚠️  Arquivo .env já existe. Fazendo backup..."
    cp .env .env.backup
fi

# Gerar chaves JWT seguras
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)

# Criar arquivo .env para desenvolvimento simples
cat > .env << EOF
# Configuração do Ambiente
NODE_ENV=development

# Configuração do Banco de Dados (SQLite para desenvolvimento)
DATABASE_URL="file:./dev.db"

# Configuração do Redis (desabilitado para desenvolvimento simples)
REDIS_URL="redis://localhost:6379"

# Configuração de JWT
JWT_SECRET="${JWT_SECRET}"
JWT_REFRESH_SECRET="${JWT_REFRESH_SECRET}"

# Configuração da API Anthropic (Claude) - OPCIONAL para testes
ANTHROPIC_API_KEY="demo-key-for-testing"

# Configuração do MinIO (Storage) - desabilitado para desenvolvimento simples
MINIO_ENDPOINT="localhost"
MINIO_PORT=9000
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_BUCKET="truecheckia"

# Configuração do Servidor
PORT=3001
HOST="0.0.0.0"

# Configuração de Logs
LOG_LEVEL="debug"
LOG_FILE="logs/app.log"

# Configuração de Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# Configuração de Upload
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES="image/jpeg,image/png,image/gif,video/mp4,video/avi,video/mov"

# Configuração de Email (desabilitado para desenvolvimento)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER=""
SMTP_PASS=""

# Configuração de CORS
CORS_ORIGIN="http://localhost:5173,http://localhost:3000"

# Configuração de Segurança
BCRYPT_ROUNDS=10
SESSION_SECRET="${SESSION_SECRET}"

# Configurações de Desenvolvimento
SKIP_AI_DETECTION=true
SKIP_REDIS=true
SKIP_MINIO=true
EOF

echo "✅ Arquivo .env para desenvolvimento criado com sucesso!"
echo ""
echo "📝 Configurações aplicadas:"
echo "   - Banco SQLite local (dev.db)"
echo "   - Redis desabilitado"
echo "   - MinIO desabilitado"
echo "   - Detecção de IA em modo simulado"
echo "   - Rate limiting aumentado para desenvolvimento"
echo ""
echo "🚀 Para rodar o backend:"
echo "   npm start"
echo ""
echo "🔧 Para configurar o banco:"
echo "   npx prisma migrate dev"
echo ""
echo "📚 Para mais informações, consulte o README.md" 