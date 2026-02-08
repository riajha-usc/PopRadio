require('dotenv').config();
const mongoose = require('mongoose');
const { redis } = require('../config/redis');
const Song = require('../models/Song');
const Playlist = require('../models/Playlist');

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      minPoolSize: 2
    });
    console.log('✅ Sync worker connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Sync Redis counters to MongoDB
async function syncRedisToMongoDB() {
  console.log('🔄 Starting sync:', new Date().toISOString());
  
  try {
    // 1. Sync song likes
    const songLikeKeys = await redis.keys('song:*:likes');
    if (songLikeKeys.length > 0) {
      const songLikeUpdates = [];
      
      for (const key of songLikeKeys) {
        const songId = key.split(':')[1];
        const likes = await redis.get(key);
        
        songLikeUpdates.push({
          updateOne: {
            filter: { _id: new mongoose.Types.ObjectId(songId) },
            update: { 
              $set: { 
                likes: parseInt(likes) || 0,
                updatedAt: new Date()
              } 
            }
          }
        });
      }
      
      if (songLikeUpdates.length > 0) {
        const result = await Song.bulkWrite(songLikeUpdates);
        console.log(`✅ Synced ${result.modifiedCount} song likes`);
      }
    }
    
    // 2. Sync song plays
    const songPlayKeys = await redis.keys('song:*:plays');
    if (songPlayKeys.length > 0) {
      const songPlayUpdates = [];
      
      for (const key of songPlayKeys) {
        const songId = key.split(':')[1];
        const plays = await redis.get(key);
        
        songPlayUpdates.push({
          updateOne: {
            filter: { _id: new mongoose.Types.ObjectId(songId) },
            update: { 
              $set: { 
                plays: parseInt(plays) || 0,
                updatedAt: new Date()
              } 
            }
          }
        });
      }
      
      if (songPlayUpdates.length > 0) {
        const result = await Song.bulkWrite(songPlayUpdates);
        console.log(`✅ Synced ${result.modifiedCount} song plays`);
      }
    }
    
    // 3. Sync playlist likes
    const playlistLikeKeys = await redis.keys('playlist:*:likes');
    if (playlistLikeKeys.length > 0) {
      const playlistLikeUpdates = [];
      
      for (const key of playlistLikeKeys) {
        const playlistId = key.split(':')[1];
        const likes = await redis.get(key);
        
        playlistLikeUpdates.push({
          updateOne: {
            filter: { _id: new mongoose.Types.ObjectId(playlistId) },
            update: { 
              $set: { 
                likes: parseInt(likes) || 0,
                updatedAt: new Date()
              } 
            }
          }
        });
      }
      
      if (playlistLikeUpdates.length > 0) {
        const result = await Playlist.bulkWrite(playlistLikeUpdates);
        console.log(`✅ Synced ${result.modifiedCount} playlist likes`);
      }
    }
    
    // 4. Sync playlist views
    const playlistViewKeys = await redis.keys('playlist:*:views');
    if (playlistViewKeys.length > 0) {
      const playlistViewUpdates = [];
      
      for (const key of playlistViewKeys) {
        const playlistId = key.split(':')[1];
        const views = await redis.get(key);
        
        playlistViewUpdates.push({
          updateOne: {
            filter: { _id: new mongoose.Types.ObjectId(playlistId) },
            update: { 
              $set: { 
                views: parseInt(views) || 0,
                updatedAt: new Date()
              } 
            }
          }
        });
      }
      
      if (playlistViewUpdates.length > 0) {
        const result = await Playlist.bulkWrite(playlistViewUpdates);
        console.log(`✅ Synced ${result.modifiedCount} playlist views`);
      }
    }
    
    console.log('✅ Sync completed:', new Date().toISOString());
    
  } catch (error) {
    console.error('❌ Sync failed:', error);
  }
}

// Initialize on first run (populate Redis from MongoDB)
async function initializeRedisFromMongoDB() {
  try {
    console.log('🔄 Initializing Redis counters from MongoDB...');
    
    // Get all songs and set Redis counters
    const songs = await Song.find({ isActive: true }).select('_id likes plays');
    for (const song of songs) {
      await redis.set(`song:${song._id}:likes`, song.likes || 0);
      await redis.set(`song:${song._id}:plays`, song.plays || 0);
    }
    console.log(`✅ Initialized ${songs.length} song counters`);
    
    // Get all playlists and set Redis counters
    const playlists = await Playlist.find({ isActive: true }).select('_id likes views');
    for (const playlist of playlists) {
      await redis.set(`playlist:${playlist._id}:likes`, playlist.likes || 0);
      await redis.set(`playlist:${playlist._id}:views`, playlist.views || 0);
    }
    console.log(`✅ Initialized ${playlists.length} playlist counters`);
    
  } catch (error) {
    console.error('❌ Redis initialization failed:', error);
  }
}

// Main function
async function main() {
  await connectDB();
  
  // Check if this is first run
  const redisKeys = await redis.keys('song:*');
  if (redisKeys.length === 0) {
    console.log('⚠️ Redis is empty, initializing from MongoDB...');
    await initializeRedisFromMongoDB();
  }
  
  // Run sync immediately
  await syncRedisToMongoDB();
  
  // Schedule periodic sync
  const intervalMinutes = parseInt(process.env.SYNC_INTERVAL_MINUTES) || 5;
  const intervalMs = intervalMinutes * 60 * 1000;
  
  console.log(`⏰ Scheduling sync every ${intervalMinutes} minutes`);
  setInterval(syncRedisToMongoDB, intervalMs);
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⚠️ Shutting down sync worker...');
  await mongoose.connection.close();
  redis.disconnect();
  process.exit(0);
});

// Run
main().catch(error => {
  console.error('❌ Sync worker error:', error);
  process.exit(1);
});