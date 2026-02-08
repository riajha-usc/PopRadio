# 🎵 PopRadio - Y2K Music Video Radio Platform

A curated music video radio platform built with MERN stack, Redis, and a dreamy Y2K aesthetic. Built for 100k+ concurrent anonymous users with high-performance atomic operations.

![PopRadio](https://img.shields.io/badge/Stack-MERN-pink?style=for-the-badge)
![Redis](https://img.shields.io/badge/Cache-Redis-red?style=for-the-badge)
![Y2K](https://img.shields.io/badge/Aesthetic-Y2K-purple?style=for-the-badge)

## ✨ Features

- 📻 **Radio Stream** - Continuous music video playback
- 💕 **Anonymous Likes** - No login required
- 💬 **Comments** - Engage with the community
- 🎨 **Y2K Aesthetic** - Dreamy pastel design with soft animations
- ⚡ **High Performance** - Redis atomic counters for scalability
- 🔐 **Session-based** - Anonymous user identity
- 🎵 **Curated Content** - Admin-controlled songs and playlists

## 🏗️ Architecture

```
┌─────────────┐
│   Client    │  React + Framer Motion (Y2K UI)
│  (Vite)     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Express   │  Node.js API Server
│     API     │  - Session Management
└──────┬──────┘  - Rate Limiting
       │         - Business Logic
       ▼
┌──────┬──────┐
│      │      │
│Redis │ Mongo│  Redis: Atomic counters, cache, sessions
│      │  DB  │  MongoDB: Persistent storage
└──────┴──────┘
```

## 📦 Tech Stack

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **MongoDB** - Primary database
- **Mongoose** - ODM
- **Redis** - Caching & atomic operations
- **ioredis** - Redis client

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **Framer Motion** - Animations
- **Axios** - HTTP client

### Infrastructure
- **Docker** - Containerization
- **NGINX** - Load balancing (production)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB 7+
- Redis 7+
- npm or yarn

### 1. Clone Repository

```bash
git clone <repository-url>
cd popradio
```

### 2. Backend Setup

```bash
cd server

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
nano .env

# Start MongoDB and Redis (if not running)
# MongoDB: mongod
# Redis: redis-server

# Run server
npm run dev
```

### 3. Frontend Setup

```bash
cd client

# Install dependencies
npm install

# Start development server
npm run dev
```

### 4. Access Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Health Check: http://localhost:3000/health

## 🔧 Configuration

### Backend Environment Variables

```bash
# Server
NODE_ENV=development
PORT=3000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/popradio

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# CORS
ALLOWED_ORIGINS=http://localhost:5173

# Rate Limiting
MAX_LIKES_PER_HOUR=100
MAX_COMMENTS_PER_HOUR=30
MAX_PLAYS_PER_HOUR=1000

# Sync Worker
SYNC_INTERVAL_MINUTES=5
```

## 📊 Database Setup

### Initialize MongoDB

```javascript
// Connect to MongoDB
mongosh

// Create database
use popradio

// Indexes are created automatically on server start
```

### Seed Data (Optional)

Create a seed script to populate initial songs and playlists:

## 🔄 Redis-MongoDB Sync

The sync worker runs periodically to sync Redis counters to MongoDB:

```bash
# Run sync worker separately
npm run sync

# Or use PM2 for production
pm2 start server.js --name popradio-api
pm2 start workers/syncWorker.js --name popradio-sync
```

## 🎨 Frontend Customization

### Y2K Theme Colors

The app uses CSS custom properties for easy theming:

```css
/* src/App.css */
:root {
  --pink-light: #ffc0e5;
  --lavender: #e6d5f5;
  --purple-soft: #d4b5f0;
  /* ... */
}
```

### Fonts

Uses Google Fonts:
- **Comfortaa** - Body text
- **Fredoka** - Headings

## 📡 API Endpoints

### Songs

```
GET    /api/songs                 - Get all songs
GET    /api/songs/:id             - Get single song
POST   /api/songs/:id/play        - Increment play count
POST   /api/songs/:id/like        - Like song
DELETE /api/songs/:id/like        - Unlike song
GET    /api/songs/:id/comments    - Get comments
POST   /api/songs/:id/comments    - Add comment
GET    /api/songs/popular         - Get popular songs
```

### Playlists

```
GET    /api/playlists             - Get all playlists
GET    /api/playlists/:id         - Get single playlist
POST   /api/playlists/:id/like    - Like playlist
DELETE /api/playlists/:id/like    - Unlike playlist
GET    /api/playlists/:id/comments - Get comments
POST   /api/playlists/:id/comments - Add comment
GET    /api/playlists/featured    - Get featured playlists
```

### Radio

```
GET    /api/radio/stream          - Get current stream
POST   /api/radio/next            - Skip to next song
```

## 🐳 Docker Deployment

### Development

```bash
# Using docker-compose
docker-compose up -d

# Rebuild after changes
docker-compose up -d --build
```

### Production

```bash
# Build images
docker build -t popradio-api ./server
docker build -t popradio-client ./client

# Run containers
docker run -d --name popradio-api \
  -e MONGODB_URI=mongodb://mongo:27017/popradio \
  -e REDIS_HOST=redis \
  -p 3000:3000 \
  popradio-api

docker run -d --name popradio-client \
  -p 80:80 \
  popradio-client
```

## 📈 Performance Optimization

### Redis Atomic Counters

All likes and plays use Redis atomic operations:

```javascript
// Atomic increment (no race conditions)
await redis.incr(`song:${songId}:likes`);
```

### Connection Pooling

```javascript
// MongoDB
maxPoolSize: 50
minPoolSize: 10

// Redis persistent connections
```

### Caching Strategy

- Popular songs: 5 min cache
- Featured playlists: 10 min cache
- Song details: 1 hour cache

## 🔒 Security

- **Rate Limiting** - Per IP and session
- **Input Validation** - All user inputs sanitized
- **Helmet.js** - Security headers
- **CORS** - Configured origins
- **Session Management** - UUID-based anonymous sessions

## 📊 Monitoring

### Health Check

```bash
curl http://localhost:3000/health

# Response
{
  "status": "ok",
  "services": {
    "mongodb": "connected",
    "redis": "connected"
  }
}
```

### Metrics to Monitor

- API response times
- Redis memory usage
- MongoDB connection pool
- Rate limit hits
- Error rates

## 🧪 Testing

```bash
# Backend tests (TODO)
cd server
npm test

# Frontend tests (TODO)
cd client
npm test
```

## 🚀 Production Deployment

### 1. Environment Setup

```bash
# Set production environment
export NODE_ENV=production

# Use production MongoDB (Atlas, etc.)
export MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/popradio

# Use production Redis (AWS ElastiCache, etc.)
export REDIS_HOST=redis-cluster.cache.amazonaws.com
```

### 2. Build Frontend

```bash
cd client
npm run build

# Serve static files from Express or NGINX
```

### 3. Process Management

```bash
# Using PM2
pm2 start server/server.js --name popradio-api -i max
pm2 start server/workers/syncWorker.js --name popradio-sync

# Save PM2 config
pm2 save
pm2 startup
```

### 4. NGINX Configuration

```nginx
upstream popradio_backend {
    server localhost:3000;
    server localhost:3001;
}

server {
    listen 80;
    server_name popradio.com;

    # Frontend
    location / {
        root /var/www/popradio/client/dist;
        try_files $uri /index.html;
    }

    # API
    location /api {
        proxy_pass http://popradio_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🎯 Scaling to 100+ Users

### Horizontal Scaling

```bash
# Run multiple API instances
pm2 start server.js -i 4

# Load balancer (NGINX or AWS ALB)
```

### Database Optimization

```javascript
// MongoDB replica set
mongodb://primary:27017,secondary:27017/popradio?replicaSet=rs0

// Redis cluster
const Redis = require('ioredis');
const cluster = new Redis.Cluster([
  { host: 'redis-1', port: 6379 },
  { host: 'redis-2', port: 6379 }
]);
```

### CDN for Static Assets

- Upload album art, videos to S3/CloudFront
- Update `albumArt` and `videoUrl` fields with CDN URLs

## 🐛 Troubleshooting

### MongoDB Connection Issues

```bash
# Check if MongoDB is running
mongosh

# Check network connectivity
telnet localhost 27017
```

### Redis Connection Issues

```bash
# Check if Redis is running
redis-cli ping

# Should return: PONG
```

### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

## 📧 Support

For issues and questions, please open a GitHub issue.

---

Built with 💕 by the PopRadio team