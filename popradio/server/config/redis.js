const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

redis.on('connect', () => {
  console.log('✅ Redis connected');
});

redis.on('error', (err) => {
  console.error('❌ Redis error:', err);
});

// Helper functions for atomic operations

// Increment counter (atomic)
async function incrementCounter(key) {
  return await redis.incr(key);
}

// Decrement counter (atomic)
async function decrementCounter(key) {
  return await redis.decr(key);
}

// Get counter value
async function getCounter(key) {
  const value = await redis.get(key);
  return parseInt(value) || 0;
}

// Check if user has liked an item
async function hasUserLiked(sessionId, targetType, targetId) {
  const key = `user:${sessionId}:liked:${targetType}s`;
  return await redis.sismember(key, targetId);
}

// Add user like
async function addUserLike(sessionId, targetType, targetId) {
  const key = `user:${sessionId}:liked:${targetType}s`;
  return await redis.sadd(key, targetId);
}

// Remove user like
async function removeUserLike(sessionId, targetType, targetId) {
  const key = `user:${sessionId}:liked:${targetType}s`;
  return await redis.srem(key, targetId);
}

// Rate limiting
async function checkRateLimit(key, max, windowSeconds) {
  const count = await redis.incr(key);
  
  if (count === 1) {
    await redis.expire(key, windowSeconds);
  }
  
  if (count > max) {
    const ttl = await redis.ttl(key);
    return {
      allowed: false,
      retryAfter: ttl
    };
  }
  
  return { allowed: true };
}

// Cache helpers
async function getCached(key) {
  const cached = await redis.get(key);
  return cached ? JSON.parse(cached) : null;
}

async function setCached(key, value, ttl = 300) {
  return await redis.setex(key, ttl, JSON.stringify(value));
}

module.exports = {
  redis,
  incrementCounter,
  decrementCounter,
  getCounter,
  hasUserLiked,
  addUserLike,
  removeUserLike,
  checkRateLimit,
  getCached,
  setCached
};