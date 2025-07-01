# TrueCheck AI - Detecção de Conteúdo Gerado por IA

Uma plataforma completa para detectar conteúdo gerado por inteligência artificial, incluindo textos, vídeos e imagens.

## 🚀 Funcionalidades

- **Detecção Avançada**: Algoritmos de última geração para identificar conteúdo gerado por IA
- **Múltiplos Formatos**: Suporte para texto, vídeo e imagem
- **Análise em Tempo Real**: Resultados rápidos com processamento assíncrono
- **Dashboard Interativo**: Interface moderna com gráficos e estatísticas
- **API RESTful**: Integração fácil com outros sistemas
- **WebSocket**: Atualizações em tempo real
- **Sistema de Filas**: Processamento assíncrono e escalável
- **Autenticação JWT**: Sistema seguro de login e registro

## 🏗️ Arquitetura

### Backend (Node.js + Express)
- **API REST**: Endpoints para upload, análise e relatórios
- **Autenticação**: JWT com refresh tokens
- **Banco de Dados**: PostgreSQL com Prisma ORM
- **Cache**: Redis para sessões e filas
- **Filas**: Bull para processamento assíncrono
- **Upload**: MinIO para armazenamento de arquivos
- **WebSocket**: Socket.IO para atualizações em tempo real
- **Logs**: Winston para logging estruturado

### Frontend (React + TypeScript)
- **Interface Moderna**: Design responsivo com Tailwind CSS
- **Animações**: Framer Motion para transições suaves
- **Upload Drag & Drop**: Interface intuitiva para upload de arquivos
- **Dashboard**: Gráficos e estatísticas em tempo real
- **Roteamento**: React Router para navegação
- **Estado**: React Query para gerenciamento de estado
- **Notificações**: Toast notifications com react-hot-toast

### Infraestrutura
- **Docker**: Containerização completa
- **Nginx**: Reverse proxy e load balancing
- **PostgreSQL**: Banco de dados principal
- **Redis**: Cache e filas
- **MinIO**: Armazenamento de objetos

## 📦 Instalação

### Pré-requisitos
- Docker e Docker Compose
- Node.js 18+ (para desenvolvimento local)
- Git

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/truecheck-ai.git
cd truecheck-ai
```

### 2. Configure as variáveis de ambiente
```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```

### 3. Configure as chaves de API (opcional)
Para usar detecção real, adicione suas chaves de API no arquivo `backend/.env`:
```env
GPTZERO_API_KEY=sua_chave_gptzero
HIVE_API_KEY=sua_chave_hive
OPENAI_API_KEY=sua_chave_openai
```

### 4. Execute com Docker
```bash
docker-compose up -d
```

### 5. Acesse a aplicação
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Documentação API**: http://localhost:5000/api-docs

## 🛠️ Desenvolvimento

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Banco de Dados
```bash
# Aplicar migrações
cd backend
npx prisma migrate dev

# Gerar cliente Prisma
npx prisma generate
```

## 📊 Estrutura do Projeto

```
truecheck-ai/
├── backend/                 # API Node.js
│   ├── src/
│   │   ├── controllers/     # Controladores da API
│   │   ├── middleware/      # Middlewares
│   │   ├── models/          # Modelos Prisma
│   │   ├── routes/          # Rotas da API
│   │   ├── services/        # Serviços de negócio
│   │   └── utils/           # Utilitários
│   ├── prisma/              # Schema e migrações
│   └── package.json
├── frontend/                # Aplicação React
│   ├── src/
│   │   ├── components/      # Componentes React
│   │   ├── contexts/        # Contextos (Auth, Socket)
│   │   ├── pages/           # Páginas da aplicação
│   │   ├── hooks/           # Custom hooks
│   │   └── utils/           # Utilitários
│   └── package.json
├── docker-compose.yml       # Configuração Docker
├── nginx/                   # Configuração Nginx
└── README.md
```

## 🔧 Configuração

### Variáveis de Ambiente

#### Backend (.env)
```env
# Servidor
PORT=5000
NODE_ENV=development

# Banco de Dados
DATABASE_URL="postgresql://user:password@localhost:5432/truecheck_ai"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET=sua_chave_jwt_secreta
JWT_REFRESH_SECRET=sua_chave_refresh_secreta

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=sua_access_key
MINIO_SECRET_KEY=sua_secret_key
MINIO_BUCKET=uploads

# APIs de Detecção
GPTZERO_API_KEY=sua_chave_gptzero
HIVE_API_KEY=sua_chave_hive
OPENAI_API_KEY=sua_chave_openai
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

## 🚀 Deploy

### Produção com Docker
```bash
# Build das imagens
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

### VPS/Cloud
1. Configure um servidor com Docker
2. Clone o repositório
3. Configure as variáveis de ambiente
4. Execute `docker-compose -f docker-compose.prod.yml up -d`

## 📈 Monitoramento

### Logs
```bash
# Logs do backend
docker-compose logs -f backend

# Logs do frontend
docker-compose logs -f frontend

# Logs do banco de dados
docker-compose logs -f postgres
```

### Métricas
- **Backend**: Winston logs estruturados
- **Frontend**: Console logs e error tracking
- **Banco**: Prisma query logs
- **Redis**: Monitor de performance

## 🔒 Segurança

- **Autenticação JWT**: Tokens seguros com refresh
- **Rate Limiting**: Proteção contra ataques
- **Validação de Arquivos**: Verificação de tipos e tamanhos
- **CORS**: Configuração segura para cross-origin
- **Headers de Segurança**: Proteção contra ataques comuns
- **Audit Logs**: Registro de todas as ações

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🆘 Suporte

- **Documentação**: [docs.truecheck-ai.com](https://docs.truecheck-ai.com)
- **Issues**: [GitHub Issues](https://github.com/seu-usuario/truecheck-ai/issues)
- **Email**: suporte@truecheck-ai.com

## 🎯 Roadmap

- [ ] Suporte para mais idiomas
- [ ] API GraphQL
- [ ] Integração com mais provedores de IA
- [ ] Dashboard avançado com mais métricas
- [ ] Sistema de notificações por email
- [ ] API para webhooks
- [ ] SDK para diferentes linguagens
- [ ] Interface mobile nativa

---

Desenvolvido com ❤️ pela equipe TrueCheck AI 