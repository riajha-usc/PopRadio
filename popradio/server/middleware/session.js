const crypto = require('crypto');
const { redis } = require('../config/redis');

const sessionMiddleware = async (req, res, next) => {
  try {
    let sessionId = req.headers['x-session-id'];
    
    // Generate new session if missing
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      res.setHeader('X-Session-Id', sessionId);
    }
    
    // Store session in Redis (track activity)
    const sessionKey = `session:${sessionId}`;
    const sessionData = {
      sessionId,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      ip: req.ip || req.connection.remoteAddress
    };
    
    await redis.setex(
      sessionKey,
      86400 * 30, // 30 days TTL
      JSON.stringify(sessionData)
    );
    
    // Attach to request
    req.sessionId = sessionId;
    req.sessionData = sessionData;
    
    next();
  } catch (error) {
    console.error('Session middleware error:', error);
    next(error);
  }
};

module.exports = sessionMiddleware;