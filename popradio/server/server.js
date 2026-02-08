require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const connectDB = require('./config/database');
const sessionMiddleware = require('./middleware/session');
const { initializeRadio } = require('./controllers/radioController');

// Initialize Express app
const app = express();

// Connect to databases
connectDB();

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Adjust for production
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));

app.use(compression());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Session management
app.use(sessionMiddleware);

// Request logging (development)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Health check
app.get('/health', async (req, res) => {
  const mongoose = require('mongoose');
  const { redis } = require('./config/redis');
  
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {}
  };
  
  try {
    await mongoose.connection.db.admin().ping();
    health.services.mongodb = 'connected';
  } catch (err) {
    health.services.mongodb = 'disconnected';
    health.status = 'degraded';
  }
  
  try {
    await redis.ping();
    health.services.redis = 'connected';
  } catch (err) {
    health.services.redis = 'disconnected';
    health.status = 'degraded';
  }
  
  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

// API Routes
app.use('/api/songs', require('./routes/songs'));
app.use('/api/playlists', require('./routes/playlists'));
app.use('/api/radio', require('./routes/radio'));

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'PopRadio API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      songs: '/api/songs',
      playlists: '/api/playlists',
      radio: '/api/radio',
      health: '/health'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 
    ? 'Something went wrong. Please try again.' 
    : err.message;
  
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`
╔════════════════════════════════════════════╗
║                                            ║
║           🎵 PopRadio Server 🎵            ║
║                                            ║
║  Status: Running                           ║
║  Port: ${PORT}                              ║
║  Environment: ${process.env.NODE_ENV || 'development'}              ║
║                                            ║
╚════════════════════════════════════════════╝
  `);
  
  // Initialize radio stream
  await initializeRadio();
  
  console.log('\n✅ Server ready to accept connections\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('⚠️ SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n⚠️ SIGINT received, shutting down gracefully...');
  process.exit(0);
});