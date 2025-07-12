#!/bin/bash

echo "🔍 Procurando processos nas portas 3000 e 3001..."

# Finalizar processos na porta 3001 (backend)
if lsof -i :3001 >/dev/null 2>&1; then
    echo "📡 Finalizando processo na porta 3001..."
    lsof -ti :3001 | xargs kill -9 2>/dev/null || true
    echo "✅ Porta 3001 liberada"
else
    echo "✅ Porta 3001 já está livre"
fi

# Finalizar processos na porta 3000 (frontend)
if lsof -i :3000 >/dev/null 2>&1; then
    echo "🌐 Finalizando processo na porta 3000..."
    lsof -ti :3000 | xargs kill -9 2>/dev/null || true
    echo "✅ Porta 3000 liberada"
else
    echo "✅ Porta 3000 já está livre"
fi

# Finalizar processos Node relacionados ao projeto
echo "🧹 Limpando processos Node do projeto..."
pkill -f "ts-node.*server.ts" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

echo "🎉 Todas as portas foram liberadas!"