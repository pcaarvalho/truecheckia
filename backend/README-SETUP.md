# 🚀 Configuração do TrueCheckIA Backend

Este guia te ajudará a configurar e rodar o backend do TrueCheckIA rapidamente.

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Git

## 🛠️ Configuração Rápida

### Opção 1: Desenvolvimento Simples (Recomendado para começar)

```bash
# 1. Instalar dependências
npm install

# 2. Configurar ambiente com SQLite
./setup-sqlite.sh

# 3. Rodar o backend
npm start
```

### Opção 2: Desenvolvimento Completo

```bash
# 1. Instalar dependências
npm install

# 2. Configurar ambiente completo
./setup-env.sh

# 3. Configurar banco PostgreSQL
npx prisma migrate dev

# 4. Rodar o backend
npm start
```

## 🔧 Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `./setup-sqlite.sh` | Configura ambiente com SQLite (mais simples) |
| `./setup-dev.sh` | Configura ambiente de desenvolvimento |
| `./setup-env.sh` | Configura ambiente completo |

## 📁 Estrutura de Arquivos

```
backend/
├── .env                    # Variáveis de ambiente (criado automaticamente)
├── setup-sqlite.sh        # Script para SQLite
├── setup-dev.sh           # Script para desenvolvimento
├── setup-env.sh           # Script para produção
├── prisma/
│   ├── schema.prisma      # Schema PostgreSQL
│   └── schema-sqlite.prisma # Schema SQLite
└── src/                   # Código fonte
```

## 🌐 URLs de Acesso

- **Backend API**: http://localhost:3001
- **Documentação Swagger**: http://localhost:3001/api-docs
- **Prisma Studio** (banco): http://localhost:5555

## 🔑 Variáveis de Ambiente

### Obrigatórias
- `NODE_ENV`: Ambiente (development/production)
- `DATABASE_URL`: URL do banco de dados
- `JWT_SECRET`: Chave secreta para JWT
- `JWT_REFRESH_SECRET`: Chave para refresh tokens

### Opcionais
- `ANTHROPIC_API_KEY`: Chave da API Anthropic
- `REDIS_URL`: URL do Redis
- `PORT`: Porta do servidor (padrão: 3001)

## 🗄️ Banco de Dados

### SQLite (Desenvolvimento)
```bash
# Usar SQLite local
DATABASE_URL="file:./dev.db"
```

### PostgreSQL (Produção)
```bash
# Usar PostgreSQL
DATABASE_URL="postgresql://user:pass@localhost:5432/truecheckia"
```

## 🚀 Comandos Úteis

```bash
# Rodar em desenvolvimento
npm run dev

# Rodar em produção
npm start

# Compilar TypeScript
npx tsc

# Gerar cliente Prisma
npx prisma generate

# Aplicar migrações
npx prisma migrate dev

# Visualizar banco
npx prisma studio

# Resetar banco
npx prisma migrate reset
```

## 🔍 Troubleshooting

### Erro: "Missing script: dev"
```bash
# Use o script correto
npm start
```

### Erro: "ZodError: Required"
```bash
# Execute o script de configuração
./setup-sqlite.sh
```

### Erro: "Database connection failed"
```bash
# Verifique a DATABASE_URL no .env
# Para SQLite: DATABASE_URL="file:./dev.db"
```

## 📞 Suporte

Se encontrar problemas:

1. Verifique se todas as dependências estão instaladas
2. Confirme que o arquivo `.env` foi criado
3. Teste com SQLite primeiro
4. Consulte os logs em `logs/app.log`

## 🎯 Próximos Passos

1. ✅ Configurar backend
2. 🔄 Configurar frontend
3. 🔗 Integrar frontend e backend
4. 🧪 Testar funcionalidades
5. 🚀 Deploy

---

**Happy Coding! 🎉** 