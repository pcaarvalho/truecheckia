# Script de setup para o TrueCheckIA Backend (PowerShell)
Write-Host "🚀 Configurando TrueCheckIA Backend..." -ForegroundColor Green

# Verificar se o Node.js está instalado
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js não encontrado. Por favor, instale o Node.js 18+" -ForegroundColor Red
    exit 1
}

# Verificar se o npm está instalado
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ npm não encontrado. Por favor, instale o npm" -ForegroundColor Red
    exit 1
}

# Verificar versão do Node.js
$nodeVersion = (node -v) -replace 'v', ''
$majorVersion = $nodeVersion.Split('.')[0]
if ([int]$majorVersion -lt 18) {
    Write-Host "❌ Node.js versão 18+ é necessária. Versão atual: $(node -v)" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Node.js $(node -v) encontrado" -ForegroundColor Green

# Instalar dependências
Write-Host "📦 Instalando dependências..." -ForegroundColor Yellow
npm install

# Verificar se o Docker está instalado
if (Get-Command docker -ErrorAction SilentlyContinue) {
    Write-Host "🐳 Docker encontrado. Iniciando serviços..." -ForegroundColor Yellow
    docker-compose -f docker-compose.dev.yml up -d
    
    Write-Host "⏳ Aguardando serviços ficarem prontos..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
} else {
    Write-Host "⚠️  Docker não encontrado. Certifique-se de ter PostgreSQL e Redis rodando localmente" -ForegroundColor Yellow
}

# Copiar arquivo de ambiente se não existir
if (-not (Test-Path .env)) {
    Write-Host "📝 Criando arquivo .env..." -ForegroundColor Yellow
    @"
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
"@ | Out-File -FilePath .env -Encoding UTF8
    Write-Host "✅ Arquivo .env criado" -ForegroundColor Green
} else {
    Write-Host "✅ Arquivo .env já existe" -ForegroundColor Green
}

# Gerar cliente Prisma
Write-Host "🔧 Gerando cliente Prisma..." -ForegroundColor Yellow
npm run prisma:generate

# Executar migrações
Write-Host "🗄️  Executando migrações..." -ForegroundColor Yellow
npm run prisma:migrate

# Instalar Husky
Write-Host "🐕 Configurando Husky..." -ForegroundColor Yellow
npm run prepare

Write-Host "✅ Setup concluído!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Cyan
Write-Host "1. Edite o arquivo .env com suas configurações"
Write-Host "2. Execute 'npm run dev' para iniciar o servidor"
Write-Host "3. Acesse http://localhost:5000/api-docs para ver a documentação"
Write-Host ""
Write-Host "🔧 Scripts úteis:" -ForegroundColor Cyan
Write-Host "- npm run dev: Iniciar servidor de desenvolvimento"
Write-Host "- npm run test: Executar testes"
Write-Host "- npm run lint: Verificar código"
Write-Host "- npm run db:studio: Abrir Prisma Studio" 