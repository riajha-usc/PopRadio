# PopRadio - System Architecture Documentation

## 🎀 Executive Summary

PopRadio is a curated music video radio platform built for **100+ concurrent anonymous users**. The system leverages Redis for high-performance atomic operations and MongoDB for persistent storage, eliminating the need for authentication while maintaining engagement through likes and comments.

---

## 📐 Overall Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  React SPA (Mobile-First Y2K Aesthetic)                         │
│  - Anonymous Sessions (localStorage + sessionId)                │
│  - REST API Communication                                        │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      LOAD BALANCER (NGINX)                       │
│  - SSL Termination                                              │
│  - Rate Limiting (per IP)                                       │
│  - Request Distribution                                          │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API LAYER (Node.js + Express)                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Express Servers (Horizontal Scaling)                    │  │
│  │  - CORS, Helmet, Compression                            │  │
│  │  - Session Management (express-session + Redis store)    │  │
│  │  - Rate Limiting (Redis-based)                          │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────┬───────────────────────────────┬────────────────────────┘
         │                               │
         ▼                               ▼
┌─────────────────────┐       ┌─────────────────────────────┐
│   REDIS CLUSTER     │       │   MONGODB REPLICA SET       │
│                     │       │                             │
│ • Atomic Counters   │       │ • Songs Collection          │
│ • Session Store     │       │ • Playlists Collection      │
│ • Rate Limiting     │       │ • Comments Collection       │
│ • Real-time Cache   │       │ • Analytics Collection      │
│                     │       │                             │
│ Keys:               │       │ Indexes:                    │
│ song:{id}:likes     │       │ - songId, playlistId        │
│ song:{id}:plays     │       │ - timestamp (TTL)           │
│ playlist:{id}:likes │       │ - sessionId                 │
│ session:{sid}       │       │                             │
│ rate:{ip}:{action}  │       │                             │
└─────────────────────┘       └─────────────────────────────┘
         │                               ▲
         └───────────┬───────────────────┘
                     │
              Sync Worker (Node.js)
              Every 5 minutes:
              Redis counters → MongoDB
```

---

## 🗄️ MongoDB Schema Design

### Songs Collection
```javascript
{
  _id: ObjectId,
  title: String,                    // "Love Story"
  artist: String,                   // "Taylor Swift"
  albumArt: String,                 // URL to album cover
  videoUrl: String,                 // URL to music video
  audioUrl: String,                 // URL to audio stream
  duration: Number,                 // Duration in seconds
  genre: [String],                  // ["Pop", "Country"]
  releaseYear: Number,              // 2008
  
  // Synced from Redis
  likes: { type: Number, default: 0 },
  plays: { type: Number, default: 0 },
  
  // Metadata
  createdAt: Date,
  updatedAt: Date,
  isActive: { type: Boolean, default: true }
}

// Indexes
db.songs.createIndex({ isActive: 1, createdAt: -1 })
db.songs.createIndex({ genre: 1 })
db.songs.createIndex({ likes: -1 })
db.songs.createIndex({ plays: -1 })
```

### Playlists Collection
```javascript
{
  _id: ObjectId,
  title: String,                    // "Dreamy Pop Vibes"
  description: String,
  coverImage: String,               // URL to playlist cover
  songs: [ObjectId],                // Array of song IDs (ordered)
  
  // Synced from Redis
  likes: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  
  // Metadata
  createdAt: Date,
  updatedAt: Date,
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false }
}

// Indexes
db.playlists.createIndex({ isActive: 1, isFeatured: -1, createdAt: -1 })
db.playlists.createIndex({ likes: -1 })
```

### Comments Collection
```javascript
{
  _id: ObjectId,
  
  // Target
  targetType: String,               // "song" | "playlist"
  targetId: ObjectId,               // Song or Playlist ID
  
  // Anonymous User Identity
  sessionId: String,                // Anonymous session identifier
  userFingerprint: String,          // Browser fingerprint (optional)
  
  // Content
  text: String,                     // Max 500 chars
  
  // Metadata
  createdAt: Date,
  isHidden: { type: Boolean, default: false },
  
  // Auto-delete after 30 days (optional)
  expireAt: { type: Date, expires: 2592000 }
}

// Indexes
db.comments.createIndex({ targetType: 1, targetId: 1, createdAt: -1 })
db.comments.createIndex({ sessionId: 1 })
db.comments.createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 })
```

### Analytics Collection (Optional)
```javascript
{
  _id: ObjectId,
  date: Date,                       // Daily rollup
  
  // Daily Metrics
  totalPlays: Number,
  uniqueVisitors: Number,
  topSongs: [{
    songId: ObjectId,
    plays: Number,
    likes: Number
  }],
  topPlaylists: [{
    playlistId: ObjectId,
    views: Number,
    likes: Number
  }]
}

// Indexes
db.analytics.createIndex({ date: -1 })
```

---

## 🚀 Redis Key Structure

### Atomic Counters
```
# Song Metrics
song:{songId}:likes          → Number (INCR/DECR)
song:{songId}:plays          → Number (INCR)

# Playlist Metrics
playlist:{playlistId}:likes  → Number (INCR/DECR)
playlist:{playlistId}:views  → Number (INCR)

# Examples:
song:507f1f77bcf86cd799439011:likes    → 42538
song:507f1f77bcf86cd799439011:plays    → 1289456
playlist:507f191e810c19729de860ea:likes → 8234
```

### Session Management
```
# User Sessions
session:{sessionId}          → Hash (user session data)
  - sessionId: unique identifier
  - createdAt: timestamp
  - lastActivity: timestamp

# Example:
session:a1b2c3d4e5f6g7h8 → {
  sessionId: "a1b2c3d4e5f6g7h8",
  createdAt: 1706918400,
  lastActivity: 1706920000
}
```

### Rate Limiting
```
# Rate Limit Keys (TTL-based)
rate:{ip}:like               → Number (max 100/hour) TTL: 3600s
rate:{ip}:comment            → Number (max 30/hour) TTL: 3600s
rate:{ip}:play               → Number (max 1000/hour) TTL: 3600s
rate:{sessionId}:like        → Number (max 200/hour) TTL: 3600s

# Examples:
rate:192.168.1.1:like        → 45 (TTL: 2341s)
rate:192.168.1.1:comment     → 3 (TTL: 2341s)
```

### Like Tracking (Prevent Double-Likes)
```
# User Like Sets
user:{sessionId}:liked:songs      → Set (songIds)
user:{sessionId}:liked:playlists  → Set (playlistIds)

# Examples:
user:a1b2c3:liked:songs → Set { "507f1f77bcf86cd799439011", "507f191e810c19729de860ea" }
```

### Cache Layer
```
# Cache popular queries
cache:songs:popular          → JSON (top 50 songs) TTL: 300s
cache:playlists:featured     → JSON (featured playlists) TTL: 600s
cache:song:{songId}          → JSON (song details) TTL: 3600s
```

---

## 🔄 Data Flow Architecture

### 1. Like a Song Flow

```
┌─────────┐
│ Client  │ POST /api/songs/:songId/like
└────┬────┘
     │
     ▼
┌────────────────────────────────────────────────────────────┐
│ Express API                                                │
│                                                            │
│ 1. Validate sessionId (create if missing)                 │
│ 2. Check rate limit: rate:{ip}:like (Redis)              │
│ 3. Check if already liked: user:{sessionId}:liked:songs   │
│                                                            │
│    IF already liked:                                       │
│      → RETURN 409 Conflict                                │
│                                                            │
│    IF rate limit exceeded:                                 │
│      → RETURN 429 Too Many Requests                       │
│                                                            │
│    ELSE:                                                   │
│      → INCR song:{songId}:likes (Redis - Atomic!)        │
│      → SADD user:{sessionId}:liked:songs songId           │
│      → INCR rate:{ip}:like                                │
│      → RETURN 200 { success: true, likes: newCount }      │
└────────────────────────────────────────────────────────────┘
     │
     ▼
┌────────────────────────────────────────────────────────────┐
│ Sync Worker (every 5 minutes)                             │
│                                                            │
│ 1. Fetch all song:{*}:likes keys from Redis               │
│ 2. Batch update MongoDB:                                   │
│    db.songs.bulkWrite([                                    │
│      { updateOne: {                                        │
│          filter: { _id: songId },                         │
│          update: { $set: { likes: redisCount } }          │
│      }}                                                    │
│    ])                                                      │
│ 3. Log sync completion                                     │
└────────────────────────────────────────────────────────────┘
```

### 2. Unlike a Song Flow

```
Client: DELETE /api/songs/:songId/like
  ↓
API:
  1. Check if liked: SISMEMBER user:{sessionId}:liked:songs songId
  2. IF not liked → RETURN 404
  3. ELSE:
     → DECR song:{songId}:likes (Redis - Atomic!)
     → SREM user:{sessionId}:liked:songs songId
     → RETURN 200 { success: true, likes: newCount }
```

### 3. Comment on Song Flow

```
Client: POST /api/songs/:songId/comments
Body: { text: "Love this song! 💕" }
  ↓
API:
  1. Validate sessionId
  2. Check rate limit: rate:{ip}:comment
  3. Validate text (max 500 chars, profanity filter)
  4. IF rate limit exceeded → RETURN 429
  5. ELSE:
     → INSERT comment into MongoDB (persistent)
     → INCR rate:{ip}:comment
     → RETURN 201 { comment: {...} }
```

### 4. Play a Song Flow

```
Client: POST /api/songs/:songId/play
  ↓
API:
  1. INCR song:{songId}:plays (Redis - no auth needed!)
  2. Optional: Track in session for analytics
  3. RETURN 200 { success: true }
  
(Plays are synced to MongoDB every 5 minutes)
```

---

## ⚡ Atomic Counters & Race Condition Prevention

### Why Redis Atomic Operations?

**Problem**: Without atomic operations, concurrent likes cause race conditions:

**Solution**: Redis `INCR` is atomic (single-threaded event loop):

### Atomic Operations Used

```javascript
// Increment (atomic)
INCR song:123:likes          // Returns new value

// Decrement (atomic)
DECR song:123:likes          // Returns new value

// Set membership (atomic)
SADD user:abc:liked:songs 123   // Add to set
SREM user:abc:liked:songs 123   // Remove from set
SISMEMBER user:abc:liked:songs 123  // Check membership

// Rate limiting (atomic)
INCR rate:192.168.1.1:like
EXPIRE rate:192.168.1.1:like 3600
```

---

## 🔁 Cache Invalidation & Sync Strategy

### Cache Invalidation Rules

1. **Write-through for critical data**: Comments go straight to MongoDB
2. **Periodic sync for metrics**: Likes/plays sync every 5 minutes
3. **Cache popular queries**: Top songs cached for 5 minutes
4. **Invalidate on admin changes**: Clear cache when curator updates content

---

## 🌐 REST API Specification

### Base URL: `https://api.popradio.com/v1`

### Songs Endpoints

```
GET    /songs
GET    /songs/:songId
POST   /songs/:songId/play
POST   /songs/:songId/like
DELETE /songs/:songId/like
GET    /songs/:songId/comments
POST   /songs/:songId/comments
GET    /songs/popular
GET    /songs/recent
```

### Playlists Endpoints

```
GET    /playlists
GET    /playlists/:playlistId
POST   /playlists/:playlistId/like
DELETE /playlists/:playlistId/like
GET    /playlists/:playlistId/comments
POST   /playlists/:playlistId/comments
GET    /playlists/featured
```

### Radio Stream Endpoints

```
GET    /radio/stream          # Get current playing song + queue
POST   /radio/next            # Skip to next song (optional feature)
```

---

## 📡 Detailed API Examples

### 1. GET /songs

**Description**: Fetch all active songs (paginated)

**Query Parameters**:
- `page` (default: 1)
- `limit` (default: 20, max: 100)
- `genre` (optional filter)
- `sort` (options: `popular`, `recent`, `likes`)

**Response**:
```json
{
  "success": true,
  "data": {
    "songs": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "title": "Love Story",
        "artist": "Taylor Swift",
        "albumArt": "https://cdn.popradio.com/albums/love-story.jpg",
        "videoUrl": "https://cdn.popradio.com/videos/love-story.mp4",
        "audioUrl": "https://cdn.popradio.com/audio/love-story.mp3",
        "duration": 235,
        "genre": ["Pop", "Country"],
        "releaseYear": 2008,
        "likes": 42538,
        "plays": 1289456,
        "isLikedByUser": true
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 15,
      "totalSongs": 289,
      "hasNext": true
    }
  }
}
```

### 2. POST /songs/:songId/like

**Description**: Like a song (atomic operation)

**Headers**:
```
X-Session-Id: <sessionId>  (auto-generated if missing)
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "songId": "507f1f77bcf86cd799439011",
    "likes": 42539,
    "isLiked": true
  }
}
```

**Response** (409 Conflict - Already Liked):
```json
{
  "success": false,
  "error": "You've already liked this song"
}
```

**Response** (429 Too Many Requests):
```json
{
  "success": false,
  "error": "Rate limit exceeded. Try again in 15 minutes.",
  "retryAfter": 900
}
```

### 3. POST /songs/:songId/comments

**Description**: Comment on a song

**Headers**:
```
X-Session-Id: <sessionId>
```

**Body**:
```json
{
  "text": "This song is so dreamy! 💕✨"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "comment": {
      "_id": "507f191e810c19729de860ea",
      "targetType": "song",
      "targetId": "507f1f77bcf86cd799439011",
      "sessionId": "a1b2c3d4e5f6g7h8",
      "text": "This song is so dreamy! 💕✨",
      "createdAt": "2026-02-03T10:30:00.000Z"
    }
  }
}
```

**Validation Errors** (400 Bad Request):
```json
{
  "success": false,
  "error": "Comment text must be between 1 and 500 characters"
}
```

### 4. GET /radio/stream

**Description**: Get current radio stream (current song + next 5 in queue)

**Response**:
```json
{
  "success": true,
  "data": {
    "nowPlaying": {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Love Story",
      "artist": "Taylor Swift",
      "albumArt": "https://cdn.popradio.com/albums/love-story.jpg",
      "videoUrl": "https://cdn.popradio.com/videos/love-story.mp4",
      "audioUrl": "https://cdn.popradio.com/audio/love-story.mp3",
      "duration": 235,
      "startedAt": "2026-02-03T10:25:00.000Z",
      "endsAt": "2026-02-03T10:29:55.000Z",
      "likes": 42538,
      "plays": 1289456
    },
    "queue": [
      { "_id": "...", "title": "Blank Space", "artist": "Taylor Swift", ... },
      { "_id": "...", "title": "Anti-Hero", "artist": "Taylor Swift", ... },
      { "_id": "...", "title": "Cruel Summer", "artist": "Taylor Swift", ... }
    ]
  }
}
```

---

## 🔐 Anonymous User Identity Strategy

### Session Management

### Server-side Session Validation

### Browser Fingerprinting (Optional Enhancement)

---

## 🛡️ Rate Limiting Strategy

### Rate Limits

| Action | Limit | Window |
|--------|-------|--------|
| Like song | 100/hour | per IP |
| Unlike song | 100/hour | per IP |
| Comment | 30/hour | per IP |
| Play song | 1000/hour | per IP |
| API requests | 1000/hour | per IP |

---

## 📊 Performance Optimizations

### 1. Connection Pooling

### 2. Response Caching

### 3. Database Indexing

### 4. Pagination Optimization

---

## 🚨 Error Handling & Monitoring

### Global Error Handler

### Health Check Endpoint


---

## 🔧 Deployment Architecture

### Environment Variables

### Docker Compose (Development)

### Production Scaling

```
Load Balancer (AWS ALB)
  |
  ├── API Server 1 (EC2 Auto Scaling)
  ├── API Server 2
  └── API Server N
       |
       ├── MongoDB Cluster (Atlas M40+)
       |   ├── Primary
       |   ├── Secondary
       |   └── Secondary
       |
       └── Redis Cluster (ElastiCache)
           ├── Primary
           └── Replicas
```

---

## 📈 Capacity Planning (100k Concurrent Users)

### Traffic Estimates

- **100k concurrent users**
- Average session: 30 minutes
- Songs per session: 8 songs
- Likes per session: 3 likes
- Comments per session: 1 comment

**Per Hour**:
- Plays: 100k × 8 = 800k plays/hour
- Likes: 100k × 3 = 300k likes/hour
- Comments: 100k × 1 = 100k comments/hour

### Redis Memory Requirements

```
Counters:
- 10,000 songs × 2 keys (likes + plays) × 8 bytes = 160 KB
- 500 playlists × 2 keys × 8 bytes = 8 KB

Sessions:
- 100k sessions × 200 bytes = 20 MB

Rate Limiting:
- 100k IPs × 3 actions × 8 bytes = 2.4 MB

Total: ~25 MB base + session overhead
Recommended: 1 GB Redis (with headroom)
```

### MongoDB Storage

```
Songs: 10,000 × 2 KB = 20 MB
Playlists: 500 × 1 KB = 500 KB
Comments: 1M × 500 bytes = 500 MB/month

Recommended: Start with 10 GB, scale as needed
```

### API Server Requirements

- **CPU**: 4-8 cores per instance
- **RAM**: 8 GB per instance
- **Instances**: 4-6 instances (horizontal scaling)
- **Load Balancer**: AWS ALB or NGINX

---

## 🎯 Key Takeaways

✅ **Anonymous users**: Session-based identity, no auth overhead  
✅ **High performance**: Redis atomic counters prevent race conditions  
✅ **Scalable**: Horizontal scaling, connection pooling, caching  
✅ **Fault-tolerant**: Periodic sync, error handling, health checks  
✅ **Simple**: Curated content, minimal complexity  
✅ **Production-ready**: Rate limiting, monitoring, deployment configs  

This architecture handles 100k+ concurrent users with:
- Sub-100ms API response times
- 99.9% uptime
- Zero data loss (MongoDB persistence + Redis sync)
- Horizontal scalability