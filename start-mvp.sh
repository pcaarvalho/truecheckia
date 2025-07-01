#!/bin/bash

echo "🚀 Iniciando TrueCheckIA MVP..."

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 Verificando configuração...${NC}"

# Verificar se os arquivos .env existem
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}⚠️  Configurando backend...${NC}"
    cd backend && ./setup-sqlite.sh && cd ..
fi

if [ ! -f "frontend/.env" ]; then
    echo -e "${YELLOW}⚠️  Configurando frontend...${NC}"
    echo "VITE_API_URL=http://localhost:3001
VITE_APP_NAME=TrueCheckIA
VITE_APP_VERSION=1.0.0
NODE_ENV=development" > frontend/.env
fi

echo -e "${GREEN}✅ Configuração concluída!${NC}"

# Função para iniciar backend
start_backend() {
    echo -e "${BLUE}🔧 Iniciando backend na porta 3001...${NC}"
    cd backend
    npm install > /dev/null 2>&1
    npm run dev:mvp &
    BACKEND_PID=$!
    cd ..
    echo -e "${GREEN}✅ Backend iniciado (PID: $BACKEND_PID)${NC}"
}

# Função para iniciar frontend  
start_frontend() {
    echo -e "${BLUE}🎨 Iniciando frontend na porta 5173...${NC}"
    cd frontend
    npm install > /dev/null 2>&1
    npm run dev &
    FRONTEND_PID=$!
    cd ..
    echo -e "${GREEN}✅ Frontend iniciado (PID: $FRONTEND_PID)${NC}"
}

# Iniciar serviços
start_backend
sleep 3
start_frontend

echo ""
echo -e "${GREEN}🎯 MVP DO TRUECHECKIA INICIADO COM SUCESSO!${NC}"
echo ""
echo -e "${BLUE}📱 Acessos:${NC}"
echo -e "   • Frontend: ${YELLOW}http://localhost:5173${NC}"
echo -e "   • Backend:  ${YELLOW}http://localhost:3001${NC}"
echo -e "   • Health:   ${YELLOW}http://localhost:3001/health${NC}"
echo ""
echo -e "${BLUE}🔑 Para análise real de IA:${NC}"
echo -e "   1. Vá para: ${YELLOW}https://console.anthropic.com/${NC}"
echo -e "   2. Obtenha sua API key"
echo -e "   3. Edite ${YELLOW}backend/.env${NC}"
echo -e "   4. Substitua: ${YELLOW}ANTHROPIC_API_KEY=\"your-anthropic-api-key-here\"${NC}"
echo ""
echo -e "${RED}⚠️  Para parar os serviços: kill $BACKEND_PID $FRONTEND_PID${NC}"
echo ""
echo -e "${GREEN}🚀 Bom desenvolvimento!${NC}"

# Manter script ativo
wait 