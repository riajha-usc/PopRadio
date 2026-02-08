const { checkRateLimit } = require('../config/redis');

const createRateLimiter = (action, maxRequests, windowSeconds) => {
  return async (req, res, next) => {
    try {
      const ip = req.ip || req.connection.remoteAddress;
      const key = `rate:${ip}:${action}`;
      
      const result = await checkRateLimit(key, maxRequests, windowSeconds);
      
      if (!result.allowed) {
        return res.status(429).json({
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: result.retryAfter
        });
      }
      
      next();
    } catch (error) {
      console.error('Rate limit error:', error);
      // Fail open - allow request if rate limiting fails
      next();
    }
  };
};

// Predefined rate limiters
const rateLimiters = {
  like: createRateLimiter('like', parseInt(process.env.MAX_LIKES_PER_HOUR) || 100, 3600),
  comment: createRateLimiter('comment', parseInt(process.env.MAX_COMMENTS_PER_HOUR) || 30, 3600),
  play: createRateLimiter('play', parseInt(process.env.MAX_PLAYS_PER_HOUR) || 1000, 3600),
  api: createRateLimiter('api', 1000, 3600)
};

module.exports = rateLimiters;