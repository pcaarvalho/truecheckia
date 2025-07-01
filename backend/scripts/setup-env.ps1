# Script para configurar o arquivo .env com a chave da API da Anthropic
Write-Host "Configurando arquivo .env..." -ForegroundColor Green

# Verifica se o arquivo .env ja existe
if (Test-Path .env) {
    Write-Host "Arquivo .env ja existe. Fazendo backup..." -ForegroundColor Yellow
    Copy-Item .env .env.backup
    Write-Host "Backup criado: .env.backup" -ForegroundColor Green
}

# Cria o arquivo .env com a chave da API da Anthropic
$envContent = @"
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

# Anthropic API
ANTHROPIC_API_KEY="<ANTHROPIC_API_KEY_REDACTED>"

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
"@

# Salva o conteudo no arquivo .env
$envContent | Out-File -FilePath .env -Encoding UTF8

Write-Host "Arquivo .env criado com sucesso!" -ForegroundColor Green
Write-Host "Chave da API da Anthropic configurada" -ForegroundColor Green
Write-Host ""
Write-Host "Proximos passos:" -ForegroundColor Cyan
Write-Host "1. Execute 'npm install' para instalar dependencias"
Write-Host "2. Execute 'npm run dev' para iniciar o servidor"
Write-Host "3. Teste a API em: POST http://localhost:5000/api/analysis/text"
Write-Host ""
Write-Host "IMPORTANTE: Nunca commite o arquivo .env no Git!" -ForegroundColor Red 