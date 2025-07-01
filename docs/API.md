# API Documentation - AI Content Detector

## Visão Geral

A API do AI Content Detector é uma API RESTful que permite detectar conteúdo gerado por inteligência artificial. A API utiliza autenticação JWT e suporta upload de arquivos, análise de texto e geração de relatórios.

**Base URL:** `https://api.aicontentdetector.com` (produção) ou `http://localhost:3001` (desenvolvimento)

## Autenticação

A API utiliza JWT (JSON Web Tokens) para autenticação. Todos os endpoints protegidos requerem o header `Authorization: Bearer <token>`.

### Fluxo de Autenticação

1. **Registro/Login** → Recebe `accessToken` e `refreshToken`
2. **Requisições** → Usa `accessToken` no header Authorization
3. **Token Expirado** → Usa `refreshToken` para renovar
4. **Logout** → Invalida tokens

## Endpoints

### Autenticação

#### POST /api/auth/register
Registra um novo usuário.

**Request Body:**
```json
{
  "name": "João Silva",
  "email": "joao@exemplo.com",
  "password": "senha123"
}
```

**Response (201):**
```json
{
  "user": {
    "id": "clx123456789",
    "email": "joao@exemplo.com",
    "name": "João Silva",
    "role": "USER",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### POST /api/auth/login
Faz login do usuário.

**Request Body:**
```json
{
  "email": "joao@exemplo.com",
  "password": "senha123"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "clx123456789",
    "email": "joao@exemplo.com",
    "name": "João Silva",
    "role": "USER",
    "plan": {
      "planType": "FREE",
      "maxAnalyses": 10,
      "maxFileSize": 10
    }
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### POST /api/auth/refresh
Renova o access token usando o refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### POST /api/auth/logout
Faz logout do usuário.

**Response (200):**
```json
{
  "message": "Logout realizado com sucesso"
}
```

### Análises

#### POST /api/analysis
Cria uma nova análise de texto.

**Headers:**
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Análise de texto de exemplo",
  "description": "Texto para análise de detecção de IA",
  "textContent": "Este é um texto de exemplo que será analisado para detectar se foi gerado por inteligência artificial..."
}
```

**Response (201):**
```json
{
  "id": "clx987654321",
  "userId": "clx123456789",
  "title": "Análise de texto de exemplo",
  "description": "Texto para análise de detecção de IA",
  "contentType": "TEXT",
  "textContent": "Este é um texto de exemplo...",
  "status": "PENDING",
  "createdAt": "2024-01-15T10:30:00Z",
  "user": {
    "name": "João Silva",
    "email": "joao@exemplo.com"
  }
}
```

#### POST /api/analysis/upload
Faz upload de um arquivo para análise.

**Headers:**
```
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data
```

**Request Body (FormData):**
```
file: [arquivo]
title: "Análise de vídeo"
description: "Vídeo para análise de deepfake"
```

**Response (201):**
```json
{
  "id": "clx987654321",
  "userId": "clx123456789",
  "title": "Análise de vídeo",
  "description": "Vídeo para análise de deepfake",
  "contentType": "VIDEO",
  "fileUrl": "clx123456789/1705312200000-video.mp4",
  "status": "PENDING",
  "createdAt": "2024-01-15T10:30:00Z",
  "user": {
    "name": "João Silva",
    "email": "joao@exemplo.com"
  }
}
```

#### GET /api/analysis
Lista as análises do usuário.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Query Parameters:**
- `page` (number): Página (padrão: 1)
- `limit` (number): Itens por página (padrão: 10)
- `status` (string): Filtrar por status (PENDING, PROCESSING, COMPLETED, FAILED)

**Response (200):**
```json
{
  "analyses": [
    {
      "id": "clx987654321",
      "title": "Análise de texto de exemplo",
      "contentType": "TEXT",
      "status": "COMPLETED",
      "confidence": 85.5,
      "isAIGenerated": true,
      "createdAt": "2024-01-15T10:30:00Z",
      "results": [
        {
          "id": "clx111111111",
          "provider": "GPTZero",
          "confidence": 87.2,
          "isAIGenerated": true,
          "processingTime": 1500,
          "createdAt": "2024-01-15T10:31:30Z"
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

#### GET /api/analysis/:id
Obtém detalhes de uma análise específica.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "id": "clx987654321",
  "title": "Análise de texto de exemplo",
  "description": "Texto para análise de detecção de IA",
  "contentType": "TEXT",
  "textContent": "Este é um texto de exemplo...",
  "status": "COMPLETED",
  "confidence": 85.5,
  "isAIGenerated": true,
  "metadata": {
    "wordCount": 150,
    "language": "pt-BR",
    "processingTime": 5000
  },
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:31:30Z",
  "results": [
    {
      "id": "clx111111111",
      "provider": "GPTZero",
      "confidence": 87.2,
      "isAIGenerated": true,
      "details": {
        "perplexity": 0.15,
        "burstiness": 0.23,
        "markers": ["repetitive_patterns", "low_complexity"]
      },
      "processingTime": 1500,
      "createdAt": "2024-01-15T10:31:30Z"
    },
    {
      "id": "clx222222222",
      "provider": "Hive",
      "confidence": 83.8,
      "isAIGenerated": true,
      "details": {
        "ai_score": 0.838,
        "human_score": 0.162,
        "confidence": "high"
      },
      "processingTime": 2000,
      "createdAt": "2024-01-15T10:31:32Z"
    }
  ],
  "user": {
    "name": "João Silva",
    "email": "joao@exemplo.com"
  }
}
```

#### DELETE /api/analysis/:id
Deleta uma análise.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "message": "Análise deletada com sucesso"
}
```

### Usuários

#### GET /api/user/profile
Obtém o perfil do usuário logado.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "user": {
    "id": "clx123456789",
    "email": "joao@exemplo.com",
    "name": "João Silva",
    "role": "USER",
    "plan": {
      "planType": "FREE",
      "maxAnalyses": 10,
      "maxFileSize": 10,
      "expiresAt": null
    },
    "usage": {
      "analysesCount": 5,
      "reportsCount": 2,
      "storageUsed": 15.5
    }
  }
}
```

#### PUT /api/user/profile
Atualiza o perfil do usuário.

**Headers:**
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "João Silva Santos",
  "email": "joao.santos@exemplo.com"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "clx123456789",
    "email": "joao.santos@exemplo.com",
    "name": "João Silva Santos",
    "role": "USER"
  }
}
```

### Relatórios

#### POST /api/report
Cria um novo relatório.

**Headers:**
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Relatório de Análise",
  "analysisId": "clx987654321",
  "type": "DETAILED_REPORT"
}
```

**Response (201):**
```json
{
  "id": "clx333333333",
  "userId": "clx123456789",
  "title": "Relatório de Análise",
  "type": "DETAILED_REPORT",
  "content": "<html>...</html>",
  "data": {
    "summary": "Análise completa do conteúdo",
    "recommendations": ["Verificar fontes", "Validar informações"]
  },
  "createdAt": "2024-01-15T11:00:00Z"
}
```

#### GET /api/report
Lista os relatórios do usuário.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Query Parameters:**
- `page` (number): Página (padrão: 1)
- `limit` (number): Itens por página (padrão: 10)

**Response (200):**
```json
{
  "reports": [
    {
      "id": "clx333333333",
      "title": "Relatório de Análise",
      "type": "DETAILED_REPORT",
      "createdAt": "2024-01-15T11:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "pages": 1
  }
}
```

#### GET /api/report/:id
Obtém detalhes de um relatório específico.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "id": "clx333333333",
  "title": "Relatório de Análise",
  "type": "DETAILED_REPORT",
  "content": "<html>...</html>",
  "data": {
    "summary": "Análise completa do conteúdo",
    "recommendations": ["Verificar fontes", "Validar informações"],
    "charts": {
      "confidenceDistribution": {...},
      "providerComparison": {...}
    }
  },
  "createdAt": "2024-01-15T11:00:00Z",
  "analysis": {
    "id": "clx987654321",
    "title": "Análise de texto de exemplo",
    "contentType": "TEXT"
  }
}
```

## Códigos de Status HTTP

- **200** - Sucesso
- **201** - Criado com sucesso
- **400** - Requisição inválida
- **401** - Não autorizado
- **403** - Acesso negado
- **404** - Não encontrado
- **429** - Muitas requisições
- **500** - Erro interno do servidor

## Limites e Rate Limiting

### Rate Limiting
- **100 requisições por 15 minutos** por IP
- **1000 requisições por hora** por usuário autenticado

### Limites por Plano

| Plano | Análises/Mês | Tamanho Máx. Arquivo | Armazenamento |
|-------|-------------|---------------------|---------------|
| FREE  | 10          | 10MB                | 100MB         |
| BASIC | 100         | 50MB                | 1GB           |
| PRO   | 1000        | 200MB               | 10GB          |
| ENTERPRISE | Ilimitado | 1GB                 | 100GB         |

## WebSocket Events

Para atualizações em tempo real, a API suporta WebSocket:

### Conectar
```javascript
const socket = io('http://localhost:3001');
```

### Eventos

#### join-analysis
Entra em uma sala de análise específica.
```javascript
socket.emit('join-analysis', 'clx987654321');
```

#### analysis-update
Recebe atualizações de uma análise.
```javascript
socket.on('analysis-update', (data) => {
  console.log('Análise atualizada:', data);
});
```

## Exemplos de Uso

### JavaScript/Node.js
```javascript
const axios = require('axios');

// Login
const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
  email: 'joao@exemplo.com',
  password: 'senha123'
});

const { accessToken } = loginResponse.data;

// Criar análise
const analysisResponse = await axios.post('http://localhost:3001/api/analysis', {
  title: 'Minha análise',
  textContent: 'Texto para análise...'
}, {
  headers: { Authorization: `Bearer ${accessToken}` }
});
```

### Python
```python
import requests

# Login
login_response = requests.post('http://localhost:3001/api/auth/login', json={
    'email': 'joao@exemplo.com',
    'password': 'senha123'
})

access_token = login_response.json()['accessToken']

# Criar análise
headers = {'Authorization': f'Bearer {access_token}'}
analysis_response = requests.post('http://localhost:3001/api/analysis', json={
    'title': 'Minha análise',
    'textContent': 'Texto para análise...'
}, headers=headers)
```

### cURL
```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"joao@exemplo.com","password":"senha123"}'

# Criar análise
curl -X POST http://localhost:3001/api/analysis \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Minha análise","textContent":"Texto para análise..."}'
```

## SDKs e Bibliotecas

### JavaScript/TypeScript
```bash
npm install ai-content-detector-sdk
```

```javascript
import { AIContentDetector } from 'ai-content-detector-sdk';

const client = new AIContentDetector({
  apiKey: 'your-api-key',
  baseURL: 'http://localhost:3001'
});

const analysis = await client.analyzeText({
  text: 'Texto para análise...',
  title: 'Minha análise'
});
```

## Suporte

Para suporte técnico:
- **Email:** support@aicontentdetector.com
- **Documentação:** https://docs.aicontentdetector.com
- **Status:** https://status.aicontentdetector.com 