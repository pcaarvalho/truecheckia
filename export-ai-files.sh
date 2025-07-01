#!/bin/bash

# Script para exportar arquivos essenciais do TrueCheckIA
# Dashboard + Motor de Detecção de IA

echo "🚀 Exportando arquivos essenciais do TrueCheckIA..."

# Criar diretório de destino
EXPORT_DIR="/Users/pedro/Desktop/TRUECHECKIA_EXPORT"
mkdir -p "$EXPORT_DIR"

# Criar estrutura de pastas
mkdir -p "$EXPORT_DIR/frontend/src/pages"
mkdir -p "$EXPORT_DIR/frontend/src/services"
mkdir -p "$EXPORT_DIR/frontend/src/contexts"
mkdir -p "$EXPORT_DIR/frontend/src/components/dashboard"
mkdir -p "$EXPORT_DIR/backend/src/services/aiDetection"
mkdir -p "$EXPORT_DIR/backend/src/types"
mkdir -p "$EXPORT_DIR/backend/src/utils"
mkdir -p "$EXPORT_DIR/backend/src/routes"
mkdir -p "$EXPORT_DIR/backend/src/middleware"
mkdir -p "$EXPORT_DIR/config"

echo "📁 Estrutura de pastas criada..."

# ===== FRONTEND =====
echo "📱 Exportando Frontend..."

# Dashboard principal (430 linhas com lógica de detecção)
cp "/Users/pedro/Desktop/TRUECHECKIA/frontend/src/pages/DashboardPage.tsx" "$EXPORT_DIR/frontend/src/pages/"
echo "✅ DashboardPage.tsx (Interface + Lógica de detecção)"

# Componentes do dashboard
cp "/Users/pedro/Desktop/TRUECHECKIA/frontend/src/components/dashboard/Chart.tsx" "$EXPORT_DIR/frontend/src/components/dashboard/" 2>/dev/null
cp "/Users/pedro/Desktop/TRUECHECKIA/frontend/src/components/dashboard/RecentAnalyses.tsx" "$EXPORT_DIR/frontend/src/components/dashboard/" 2>/dev/null
cp "/Users/pedro/Desktop/TRUECHECKIA/frontend/src/components/dashboard/StatsCard.tsx" "$EXPORT_DIR/frontend/src/components/dashboard/" 2>/dev/null
echo "✅ Componentes do dashboard"

# Serviços de API
cp "/Users/pedro/Desktop/TRUECHECKIA/frontend/src/services/api.ts" "$EXPORT_DIR/frontend/src/services/"
echo "✅ api.ts (Configuração Axios + endpoints)"

# Contextos essenciais
cp "/Users/pedro/Desktop/TRUECHECKIA/frontend/src/contexts/AuthContext.tsx" "$EXPORT_DIR/frontend/src/contexts/"
cp "/Users/pedro/Desktop/TRUECHECKIA/frontend/src/contexts/SocketContext.tsx" "$EXPORT_DIR/frontend/src/contexts/"
echo "✅ Contextos (Auth + Socket)"

# ===== BACKEND =====
echo "🤖 Exportando Backend..."

# Motor principal de detecção
cp "/Users/pedro/Desktop/TRUECHECKIA/backend/src/services/aiDetection.ts" "$EXPORT_DIR/backend/src/services/"
echo "✅ aiDetection.ts (Índice principal)"

# Serviços de detecção (arquitetura modular)
cp "/Users/pedro/Desktop/TRUECHECKIA/backend/src/services/aiDetection/baseDetectionService.ts" "$EXPORT_DIR/backend/src/services/aiDetection/" 2>/dev/null
cp "/Users/pedro/Desktop/TRUECHECKIA/backend/src/services/aiDetection/realAIDetectionService.ts" "$EXPORT_DIR/backend/src/services/aiDetection/" 2>/dev/null
cp "/Users/pedro/Desktop/TRUECHECKIA/backend/src/services/aiDetection/mockAIDetectionService.ts" "$EXPORT_DIR/backend/src/services/aiDetection/" 2>/dev/null
echo "✅ Serviços de detecção (Real + Mock + Base)"

# Utilitários de análise
cp "/Users/pedro/Desktop/TRUECHECKIA/backend/src/utils/textAnalyzer.ts" "$EXPORT_DIR/backend/src/utils/" 2>/dev/null
cp "/Users/pedro/Desktop/TRUECHECKIA/backend/src/utils/videoAnalyzer.ts" "$EXPORT_DIR/backend/src/utils/" 2>/dev/null
cp "/Users/pedro/Desktop/TRUECHECKIA/backend/src/utils/logger.ts" "$EXPORT_DIR/backend/src/utils/" 2>/dev/null
echo "✅ Utilitários (Text + Video + Logger)"

# Tipos TypeScript
cp "/Users/pedro/Desktop/TRUECHECKIA/backend/src/types/detection.types.ts" "$EXPORT_DIR/backend/src/types/" 2>/dev/null
echo "✅ Tipos TypeScript"

# API endpoints
cp "/Users/pedro/Desktop/TRUECHECKIA/backend/src/routes/analysis.ts" "$EXPORT_DIR/backend/src/routes/"
cp "/Users/pedro/Desktop/TRUECHECKIA/backend/src/routes/auth.ts" "$EXPORT_DIR/backend/src/routes/" 2>/dev/null
echo "✅ Rotas da API"

# Middlewares essenciais
cp "/Users/pedro/Desktop/TRUECHECKIA/backend/src/middleware/auth.ts" "$EXPORT_DIR/backend/src/middleware/" 2>/dev/null
cp "/Users/pedro/Desktop/TRUECHECKIA/backend/src/middleware/rateLimiter.ts" "$EXPORT_DIR/backend/src/middleware/" 2>/dev/null
cp "/Users/pedro/Desktop/TRUECHECKIA/backend/src/middleware/errorHandler.ts" "$EXPORT_DIR/backend/src/middleware/" 2>/dev/null
echo "✅ Middlewares (Auth + RateLimit + Error)"

# ===== CONFIGURAÇÕES =====
echo "⚙️ Exportando Configurações..."

# Package.json files
cp "/Users/pedro/Desktop/TRUECHECKIA/frontend/package.json" "$EXPORT_DIR/config/frontend-package.json" 2>/dev/null
cp "/Users/pedro/Desktop/TRUECHECKIA/backend/package.json" "$EXPORT_DIR/config/backend-package.json" 2>/dev/null
echo "✅ Package.json files"

# Environment examples
cp "/Users/pedro/Desktop/TRUECHECKIA/backend/.env.example" "$EXPORT_DIR/config/backend.env.example" 2>/dev/null
cp "/Users/pedro/Desktop/TRUECHECKIA/frontend/.env.example" "$EXPORT_DIR/config/frontend.env.example" 2>/dev/null
echo "✅ Environment examples"

# TypeScript configs
cp "/Users/pedro/Desktop/TRUECHECKIA/frontend/tsconfig.json" "$EXPORT_DIR/config/frontend-tsconfig.json" 2>/dev/null
cp "/Users/pedro/Desktop/TRUECHECKIA/backend/tsconfig.json" "$EXPORT_DIR/config/backend-tsconfig.json" 2>/dev/null
echo "✅ TypeScript configs"

# ===== DOCUMENTAÇÃO =====
echo "📚 Criando documentação..."

cat > "$EXPORT_DIR/README.md" << 'EOF'
# 🤖 TrueCheckIA - Arquivos Essenciais

Exportação dos arquivos principais do sistema de detecção de IA.

## 📁 Estrutura

### Frontend
- `pages/DashboardPage.tsx` - Dashboard principal (430 linhas)
- `services/api.ts` - Configuração de API
- `contexts/` - Gerenciamento de estado
- `components/dashboard/` - Componentes do dashboard

### Backend
- `services/aiDetection.ts` - Índice principal
- `services/aiDetection/` - Serviços modulares
- `utils/` - Analisadores de texto/vídeo
- `routes/analysis.ts` - Endpoints da API
- `middleware/` - Autenticação e segurança

### Config
- `*-package.json` - Dependências
- `*.env.example` - Variáveis de ambiente
- `*-tsconfig.json` - Configuração TypeScript

## 🚀 Como usar

1. Copie os arquivos para seu novo projeto
2. Instale as dependências dos package.json
3. Configure as variáveis de ambiente
4. Adapte os imports conforme sua estrutura

## ⚡ Funcionalidades incluídas

- ✅ Dashboard completo com análise de texto
- ✅ Motor de detecção de IA (real + mock)
- ✅ Autenticação JWT
- ✅ WebSocket para tempo real
- ✅ Rate limiting inteligente
- ✅ Tratamento de erros
- ✅ Análise de texto e vídeo
- ✅ Histórico de análises

Gerado automaticamente em $(date)
EOF

# ===== RELATÓRIO FINAL =====
echo ""
echo "🎉 EXPORTAÇÃO CONCLUÍDA!"
echo "📁 Pasta de destino: $EXPORT_DIR"
echo ""
echo "📊 Arquivos exportados:"
find "$EXPORT_DIR" -type f -name "*.tsx" -o -name "*.ts" -o -name "*.json" -o -name "*.md" | wc -l | xargs echo "   Total:"
echo ""
echo "🗂️ Estrutura criada:"
tree "$EXPORT_DIR" 2>/dev/null || find "$EXPORT_DIR" -type d | head -20

echo ""
echo "✅ Todos os arquivos essenciais foram exportados para:"
echo "   $EXPORT_DIR"
echo ""
echo "💡 Para usar em outro projeto:"
echo "   1. Copie a pasta TRUECHECKIA_EXPORT"
echo "   2. Instale as dependências dos package.json"
echo "   3. Configure as variáveis de ambiente"
echo "   4. Adapte os imports"