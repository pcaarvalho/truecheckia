# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TrueCheckIA is a SaaS platform for AI content detection supporting text, video, and image analysis. It uses a microservices architecture with:
- **Backend**: Node.js/Express/TypeScript API with PostgreSQL, Redis, Bull queues, and MinIO storage
- **Frontend**: React/TypeScript SPA with Vite, Tailwind CSS, and React Query
- **Infrastructure**: Docker Compose setup with Nginx, PostgreSQL, Redis, and MinIO

## Key Commands

### Development
```bash
# Install dependencies (from root)
npm install

# Run both frontend and backend
npm run dev

# Run with Docker (includes all services)
npm run docker:up
npm run docker:down

# Run individual services
cd backend && npm run dev
cd frontend && npm run dev
```

### Database Management
```bash
cd backend

# Run migrations
npm run prisma:migrate

# Open Prisma Studio
npm run prisma:studio

# Generate Prisma client
npm run prisma:generate
```

### Testing & Quality
```bash
# From root - runs all tests
npm run test

# Backend specific
cd backend
npm run test
npm run lint

# Frontend specific  
cd frontend
npm run lint
```

### Building
```bash
# From root - builds everything
npm run build

# Individual builds
cd backend && npm run build
cd frontend && npm run build
```

## Architecture Overview

### Backend Structure
- **src/routes/**: API endpoints organized by feature (auth, analysis, files, reports)
- **src/services/**: Business logic for AI detection integrations (GPTZero, Hive, OpenAI)
- **src/workers/**: Bull queue processors for async tasks
- **src/middleware/**: Authentication, validation, error handling
- **src/config/**: Environment and service configurations
- **prisma/**: Database schema and migrations

### Frontend Structure
- **src/pages/**: Route components (Dashboard, Analysis, Reports, etc.)
- **src/components/**: Reusable UI components organized by feature
- **src/services/**: API client and service integrations
- **src/hooks/**: Custom React hooks
- **src/contexts/**: React contexts for global state

### Key Integration Points
1. **Authentication**: JWT-based with refresh tokens, managed via AuthContext
2. **File Processing**: Upload → Queue → Worker → Detection API → Result storage
3. **Real-time Updates**: Socket.IO for live analysis progress
4. **API Communication**: Axios client with interceptors for auth and error handling

### Environment Configuration
Both frontend and backend use .env files. Key variables:
- **Backend**: Database URLs, API keys, JWT secrets, Redis/MinIO configs
- **Frontend**: API URL, WebSocket URL, feature flags

### Important Patterns
1. **Error Handling**: Centralized error middleware in backend, toast notifications in frontend
2. **Validation**: Zod schemas for request validation
3. **Queue Processing**: Bull for async tasks with retry logic
4. **File Storage**: MinIO for secure file storage with presigned URLs
5. **Logging**: Winston logger with daily rotation in backend

### Development Notes
- The project supports both PostgreSQL (production) and SQLite (development)
- API documentation available at `/api-docs` when backend is running
- Frontend uses Vite proxy for API calls in development
- Docker Compose includes all required services for local development