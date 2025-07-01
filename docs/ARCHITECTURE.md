# Arquitetura do Sistema - AI Content Detector

## Visão Geral

O AI Content Detector é um SaaS completo para detecção de conteúdo gerado por inteligência artificial. O sistema utiliza uma arquitetura moderna com microserviços, processamento assíncrono e interface responsiva.

## Diagrama da Arquitetura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Worker        │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (Bull Queue)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │   Redis Cache   │    │   MinIO Storage │
│   (Database)    │    │   (Session)     │    │   (Files)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   GPTZero API   │    │   Hive API      │    │   OpenAI API    │
│   (Text)        │    │   (Multimodal)  │    │   (Analysis)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Componentes Principais

### 1. Frontend (React + TypeScript)

**Tecnologias:**
- React 18 com TypeScript
- Tailwind CSS para estilização
- React Query para gerenciamento de estado
- React Router para navegação
- React Hook Form para formulários
- React Dropzone para upload de arquivos

**Funcionalidades:**
- Interface responsiva e moderna
- Upload drag & drop de arquivos
- Dashboard com métricas em tempo real
- Histórico de análises com filtros
- Geração de relatórios
- Sistema de autenticação

**Estrutura:**
```
frontend/
├── src/
│   ├── components/     # Componentes reutilizáveis
│   ├── pages/         # Páginas da aplicação
│   ├── contexts/      # Contextos React (Auth, etc.)
│   ├── services/      # Serviços de API
│   ├── hooks/         # Custom hooks
│   ├── utils/         # Utilitários
│   └── types/         # Definições de tipos TypeScript
```

### 2. Backend API (Node.js + Express)

**Tecnologias:**
- Node.js com TypeScript
- Express.js como framework web
- Prisma ORM para banco de dados
- JWT para autenticação
- Multer para upload de arquivos
- Bull Queue para processamento assíncrono
- Winston para logging

**Funcionalidades:**
- API RESTful com documentação Swagger
- Autenticação JWT com refresh tokens
- Upload e validação de arquivos
- Integração com APIs de detecção de IA
- Sistema de filas para processamento
- Rate limiting e segurança

**Estrutura:**
```
backend/
├── src/
│   ├── routes/        # Rotas da API
│   ├── middleware/    # Middlewares (auth, validation)
│   ├── services/      # Lógica de negócio
│   ├── config/        # Configurações (DB, Redis, etc.)
│   ├── utils/         # Utilitários
│   └── types/         # Definições de tipos
├── prisma/            # Schema e migrações do banco
└── logs/              # Logs da aplicação
```

### 3. Banco de Dados (PostgreSQL)

**Schema Principal:**
- **Users**: Usuários e autenticação
- **UserPlans**: Planos e limites de uso
- **Analyses**: Análises de conteúdo
- **AnalysisResults**: Resultados de cada provedor
- **Reports**: Relatórios gerados
- **UsageLogs**: Logs de uso para analytics

**Relacionamentos:**
- User → UserPlan (1:1)
- User → Analyses (1:N)
- User → Reports (1:N)
- Analysis → AnalysisResults (1:N)
- Analysis → Reports (1:N)

### 4. Cache (Redis)

**Uso:**
- Sessões de usuário
- Cache de resultados de análise
- Rate limiting
- Filas de processamento (Bull Queue)

### 5. Armazenamento (MinIO)

**Funcionalidades:**
- Upload de arquivos de análise
- Backup de dados
- Versionamento de arquivos
- Política de retenção

### 6. Sistema de Filas (Bull Queue)

**Processos:**
- Análise de texto com múltiplos provedores
- Processamento de vídeos
- Geração de relatórios
- Notificações em tempo real

## Fluxo de Processamento

### 1. Upload de Conteúdo

```
1. Usuário faz upload via frontend
2. Backend valida arquivo e salva no MinIO
3. Cria registro de análise no PostgreSQL
4. Adiciona job na fila de processamento
5. Retorna ID da análise para o frontend
```

### 2. Análise de Conteúdo

```
1. Worker pega job da fila
2. Atualiza status para "PROCESSING"
3. Envia conteúdo para APIs de detecção:
   - GPTZero (texto)
   - Hive (multimodal)
   - OpenAI (análise complementar)
4. Agrega resultados
5. Salva resultados no banco
6. Atualiza status para "COMPLETED"
7. Notifica frontend via WebSocket
```

### 3. Geração de Relatórios

```
1. Usuário solicita relatório
2. Sistema coleta dados de análise
3. Gera relatório em HTML/PDF
4. Salva no banco de dados
5. Disponibiliza para download
```

## Segurança

### 1. Autenticação
- JWT tokens com expiração
- Refresh tokens para renovação automática
- Rate limiting por usuário
- Validação de entrada em todas as rotas

### 2. Upload de Arquivos
- Validação de tipo MIME
- Limite de tamanho por plano
- Sanitização de nomes de arquivo
- Armazenamento seguro no MinIO

### 3. API Security
- CORS configurado
- Helmet.js para headers de segurança
- Validação de entrada com express-validator
- Logs de auditoria

## Escalabilidade

### 1. Horizontal
- Múltiplas instâncias do backend
- Load balancer com Nginx
- Redis cluster para cache
- PostgreSQL com replicação

### 2. Vertical
- Processamento assíncrono com filas
- Cache de resultados
- Paginação de resultados
- Lazy loading de dados

## Monitoramento

### 1. Logs
- Winston para logging estruturado
- Logs de erro e performance
- Integração com sistemas de monitoramento

### 2. Métricas
- Tempo de resposta da API
- Taxa de sucesso das análises
- Uso de recursos por usuário
- Performance do banco de dados

### 3. Alertas
- Falhas de processamento
- Limite de uso atingido
- Erros de integração com APIs externas

## Deployment

### 1. Docker
- Containers para cada serviço
- Docker Compose para desenvolvimento
- Volumes persistentes para dados

### 2. CI/CD
- GitHub Actions para automação
- Testes automatizados
- Deploy automático em staging/production

### 3. Infraestrutura
- Kubernetes para orquestração
- Ingress para roteamento
- Secrets management
- Backup automático

## Considerações de Performance

### 1. Otimizações
- Cache Redis para consultas frequentes
- Índices no banco de dados
- Compressão de respostas
- CDN para arquivos estáticos

### 2. Limites
- Rate limiting por usuário
- Tamanho máximo de arquivo por plano
- Número de análises simultâneas
- Timeout para processamento

## Roadmap Técnico

### Fase 1 (Atual)
- MVP com funcionalidades básicas
- Integração com APIs principais
- Interface responsiva

### Fase 2
- Machine Learning customizado
- Análise de áudio
- API GraphQL
- Webhooks

### Fase 3
- Análise em lote
- White-label solution
- Mobile app
- Integração com LMS 