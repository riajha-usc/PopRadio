# PopRadio
A curated music video radio platform built with MERN stack, Redis, and a dreamy Y2K aesthetic.

## Features
- **Radio Stream** - Continuous music video playback
- **Anonymous Likes** - No login required
- **Comments** - Engage with the community
- **Y2K Aesthetic** - Dreamy pastel design with soft animations
- **High Performance** - Redis atomic counters for scalability
- **Session-based** - Anonymous user identity
- **Curated Content** - Admin-controlled songs and playlists

## Architecture
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

## Tech Stack
- **Frontend** - React 18, Vite, Framer Motion, Axios
- **Backend** - Node.js, Express.js, Mongoose
- **Database** - MongoDB (persistent storage), Redis (caching & atomic ops)
- **Infrastructure** - Docker

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 7+
- Redis 7+

### Option 1: Docker (Recommended)
```bash
docker-compose up -d
```
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

### Option 2: Manual Setup

**Backend**
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your config
npm run dev
```

**Frontend**
```bash
cd client
npm install
npm run dev
```

## Configuration

```bash
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/popradio
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
ALLOWED_ORIGINS=http://localhost:5173
MAX_LIKES_PER_HOUR=100
MAX_COMMENTS_PER_HOUR=30
MAX_PLAYS_PER_HOUR=1000
SYNC_INTERVAL_MINUTES=5
```

## Seed Data
```bash
cd server
node scripts/SeedData.js
```

## Redis-MongoDB Sync
The sync worker runs periodically to flush Redis counters to MongoDB:
```bash
npm run sync
```

## API Endpoints

### Songs
```
GET    /api/songs                  - Get all songs
GET    /api/songs/:id              - Get single song
POST   /api/songs/:id/play         - Increment play count
POST   /api/songs/:id/like         - Like song
DELETE /api/songs/:id/like         - Unlike song
GET    /api/songs/:id/comments     - Get comments
POST   /api/songs/:id/comments     - Add comment
GET    /api/songs/popular          - Get popular songs
```

### Playlists
```
GET    /api/playlists              - Get all playlists
GET    /api/playlists/:id          - Get single playlist
POST   /api/playlists/:id/like     - Like playlist
DELETE /api/playlists/:id/like     - Unlike playlist
GET    /api/playlists/:id/comments - Get comments
POST   /api/playlists/:id/comments - Add comment
GET    /api/playlists/featured     - Get featured playlists
```

### Radio
```
GET    /api/radio/stream           - Get current stream
POST   /api/radio/next             - Skip to next song
```

## Performance
- **Atomic counters** - Redis `INCR`/`DECR` prevent race conditions on likes/plays
- **Connection pooling** - MongoDB (`maxPoolSize: 50`) and persistent Redis connections
- **Caching** - Popular songs (5 min), featured playlists (10 min)

## Security
- Rate limiting per IP (via Redis)
- Input validation on all user inputs
- Helmet.js security headers
- CORS with configured origins
- UUID-based anonymous sessions

## Health Check
```bash
curl http://localhost:3000/health
```
```json
{
  "status": "ok",
  "services": {
    "mongodb": "connected",
    "redis": "connected"
  }
}
```

## Troubleshooting

**MongoDB won't connect**
```bash
mongosh  # verify it's running
```

**Redis won't connect**
```bash
redis-cli ping  # should return PONG
```

**Port in use**
```bash
lsof -ti:3000 | xargs kill -9
```

## Frontend Customization

Theme colors are defined as CSS variables in `client/src/App.css`:
```css
:root {
  --pink-light: #ffc0e5;
  --lavender:   #e6d5f5;
  --purple-soft: #d4b5f0;
}
```
Fonts: **Comfortaa** (body) · **Fredoka** (headings) via Google Fonts.

---

## License
MIT

Built with 💕 by Ria
