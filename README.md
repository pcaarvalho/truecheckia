# TrueCheck AI - AI-Generated Content Detection

A complete platform for detecting AI-generated content, including text, videos, and images.

## 🚀 Features

- **Advanced Detection**: State-of-the-art algorithms to identify AI-generated content
- **Multiple Formats**: Support for text, video, and image
- **Real-time Analysis**: Fast results with asynchronous processing
- **Interactive Dashboard**: Modern interface with charts and statistics
- **RESTful API**: Easy integration with other systems
- **WebSocket**: Real-time updates
- **Queue System**: Asynchronous and scalable processing
- **JWT Authentication**: Secure login and registration system

## 🏗️ Architecture

### Backend (Node.js + Express)
- **REST API**: Endpoints for upload, analysis, and reports
- **Authentication**: JWT with refresh tokens
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis for sessions and queues
- **Queues**: Bull for asynchronous processing
- **Upload**: MinIO for file storage
- **WebSocket**: Socket.IO for real-time updates
- **Logs**: Winston for structured logging

### Frontend (React + TypeScript)
- **Modern Interface**: Responsive design with Tailwind CSS
- **Animations**: Framer Motion for smooth transitions
- **Drag & Drop Upload**: Intuitive interface for file uploads
- **Dashboard**: Real-time charts and statistics
- **Routing**: React Router for navigation
- **State**: React Query for state management
- **Notifications**: Toast notifications with react-hot-toast

### Infrastructure
- **Docker**: Complete containerization
- **Nginx**: Reverse proxy and load balancing
- **PostgreSQL**: Main database
- **Redis**: Cache and queues
- **MinIO**: Object storage

## 📦 Installation

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Git

### 1. Clone the repository
```bash
git clone https://github.com/your-username/truecheck-ai.git
cd truecheck-ai
```

### 2. Configure environment variables
```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```

### 3. Configure API keys (optional)
To use real detection, add your API keys in the `backend/.env` file:
```env
GPTZERO_API_KEY=your_gptzero_key
HIVE_API_KEY=your_hive_key
OPENAI_API_KEY=your_openai_key
```

### 4. Run with Docker
```bash
docker-compose up -d
```

### 5. Access the application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Documentation**: http://localhost:5000/api-docs

## 🛠️ Development

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

### Database
```bash
# Apply migrations
cd backend
npx prisma migrate dev

# Generate Prisma client
npx prisma generate
```

## 📊 Project Structure

```
truecheck-ai/
├── backend/                 # Node.js API
│   ├── src/
│   │   ├── controllers/     # API controllers
│   │   ├── middleware/      # Middleware
│   │   ├── models/          # Prisma models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business services
│   │   └── utils/           # Utilities
│   ├── prisma/              # Schema and migrations
│   └── package.json
├── frontend/                # React application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── contexts/        # Contexts (Auth, Socket)
│   │   ├── pages/           # Application pages
│   │   ├── hooks/           # Custom hooks
│   │   └── utils/           # Utilities
│   └── package.json
├── docker-compose.yml       # Docker configuration
├── nginx/                   # Nginx configuration
└── README.md
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/truecheck_ai"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET=your_secret_jwt_key
JWT_REFRESH_SECRET=your_refresh_secret_key

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=your_access_key
MINIO_SECRET_KEY=your_secret_key
MINIO_BUCKET=uploads

# Detection APIs
GPTZERO_API_KEY=your_gptzero_key
HIVE_API_KEY=your_hive_key
OPENAI_API_KEY=your_openai_key
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

## 🚀 Deploy

### Production with Docker
```bash
# Build images
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

### VPS/Cloud
1. Set up a server with Docker
2. Clone the repository
3. Configure environment variables
4. Run `docker-compose -f docker-compose.prod.yml up -d`

## 📈 Monitoring

### Logs
```bash
# Backend logs
docker-compose logs -f backend

# Frontend logs
docker-compose logs -f frontend

# Database logs
docker-compose logs -f postgres
```

### Metrics
- **Backend**: Winston structured logs
- **Frontend**: Console logs and error tracking
- **Database**: Prisma query logs
- **Redis**: Performance monitoring

## 🔒 Security

- **JWT Authentication**: Secure tokens with refresh
- **Rate Limiting**: Protection against attacks
- **File Validation**: Type and size verification
- **CORS**: Secure cross-origin configuration
- **Security Headers**: Protection against common attacks
- **Audit Logs**: Record of all actions

## 🤝 Contributing

1. Fork the project
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.

## 🆘 Support

- **Documentation**: [docs.truecheck-ai.com](https://docs.truecheck-ai.com)
- **Issues**: [GitHub Issues](https://github.com/your-username/truecheck-ai/issues)
- **Email**: support@truecheck-ai.com

## 🎯 Roadmap

- [ ] Support for more languages
- [ ] GraphQL API
- [ ] Integration with more AI providers
- [ ] Advanced dashboard with more metrics
- [ ] Email notification system
- [ ] Webhooks API
- [ ] SDKs for different languages
- [ ] Native mobile interface

---

Developed with ❤️ by the TrueCheck AI team 