#!/bin/bash

# Script para configurar ambiente de desenvolvimento com SQLite

echo "🔧 Configurando ambiente de desenvolvimento com SQLite..."

# Verificar se o arquivo .env já existe
if [ -f ".env" ]; then
    echo "⚠️  Arquivo .env já existe. Fazendo backup..."
    cp .env .env.backup
fi

# Gerar chaves JWT seguras
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)

# Criar arquivo .env para desenvolvimento com SQLite
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

echo "✅ Arquivo .env criado com sucesso!"

# Copiar schema SQLite
echo "📋 Configurando schema SQLite..."
cp prisma/schema-sqlite.prisma prisma/schema.prisma

# Gerar cliente Prisma
echo "🔧 Gerando cliente Prisma..."
npx prisma generate

# Criar banco e aplicar migrações
echo "🗄️  Criando banco de dados..."
npx prisma migrate dev --name init

echo ""
echo "✅ Ambiente de desenvolvimento configurado com sucesso!"
echo ""
echo "📝 Configurações aplicadas:"
echo "   - Banco SQLite local (dev.db)"
echo "   - Schema adaptado para SQLite"
echo "   - Redis desabilitado"
echo "   - MinIO desabilitado"
echo "   - Detecção de IA em modo simulado"
echo ""
echo "🚀 Para rodar o backend:"
echo "   npm start"
echo ""
echo "🔧 Para acessar o banco:"
echo "   npx prisma studio"
echo ""
echo "📚 Para mais informações, consulte o README.md" 