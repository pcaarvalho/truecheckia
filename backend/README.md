# TrueCheckIA Backend

Backend da aplicação TrueCheckIA para detecção de conteúdo gerado por IA.

## 🚀 Configuração de Desenvolvimento

### Pré-requisitos

- Node.js 18+
- PostgreSQL 14+
- Redis 7+
- Docker (opcional)

### Instalação

1. Clone o repositório
2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

4. Execute as migrações do banco:
```bash
npm run prisma:migrate
```

5. Gere o cliente Prisma:
```bash
npm run prisma:generate
```

### Scripts Disponíveis

- `npm run dev` - Inicia o servidor em modo desenvolvimento
- `npm run dev:debug` - Inicia o servidor com debug habilitado
- `npm run build` - Compila o projeto TypeScript
- `npm run start` - Inicia o servidor em produção
- `npm run test` - Executa os testes
- `npm run test:watch` - Executa os testes em modo watch
- `npm run lint` - Executa o ESLint
- `npm run lint:fix` - Corrige automaticamente problemas do ESLint
- `npm run lint:staged` - Executa lint apenas nos arquivos staged
- `npm run type-check` - Verifica tipos TypeScript
- `npm run prisma:studio` - Abre o Prisma Studio
- `npm run db:studio` - Abre o Prisma Studio (alias)
- `npm run migration:create` - Cria uma nova migração
- `npm run db:reset` - Reseta o banco de dados

### Configurações de Qualidade de Código

O projeto utiliza:

- **ESLint** - Linting com regras rigorosas para TypeScript
- **Prettier** - Formatação automática de código
- **Husky** - Git hooks para validação
- **lint-staged** - Linting apenas em arquivos modificados
- **commitlint** - Validação de mensagens de commit

### Testes

- **Jest** - Framework de testes
- **Cobertura** - Mínimo de 80% de cobertura
- **TypeScript** - Suporte completo a tipos

### Docker

Para executar com Docker:

```bash
# Build da imagem
docker build -t truecheckia-backend .

# Executar container
docker run -p 5000:5000 truecheckia-backend
```

### CI/CD

O projeto inclui pipeline de CI/CD com GitHub Actions que:

- Executa linting
- Verifica tipos TypeScript
- Executa testes com cobertura
- Faz upload dos relatórios de cobertura

### Health Check

Endpoint disponível em `/health` que verifica:

- Status do banco de dados
- Status do Redis
- Uso de memória
- Uptime do servidor

### Rate Limiting

Diferentes limitadores configurados:

- **Auth**: 5 requests por 15 minutos
- **API**: 100 requests por 15 minutos
- **Upload**: 10 requests por hora

### Variáveis de Ambiente

Todas as variáveis são validadas usando Zod:

- `NODE_ENV` - Ambiente (development/test/production)
- `PORT` - Porta do servidor (padrão: 5000)
- `DATABASE_URL` - URL do PostgreSQL
- `REDIS_URL` - URL do Redis
- `JWT_SECRET` - Chave secreta JWT (mínimo 32 caracteres)
- `JWT_REFRESH_SECRET` - Chave secreta JWT refresh (mínimo 32 caracteres)

## 📁 Estrutura do Projeto

```
src/
├── config/          # Configurações
├── middleware/      # Middlewares Express
├── routes/          # Rotas da API
├── services/        # Lógica de negócio
├── utils/           # Utilitários
└── __tests__/       # Testes
```

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças seguindo o padrão conventional commits
4. Push para a branch
5. Abra um Pull Request

### Padrão de Commits

Use conventional commits:

- `feat:` - Nova funcionalidade
- `fix:` - Correção de bug
- `docs:` - Documentação
- `style:` - Formatação
- `refactor:` - Refatoração
- `test:` - Testes
- `chore:` - Manutenção

## 📄 Licença

MIT 