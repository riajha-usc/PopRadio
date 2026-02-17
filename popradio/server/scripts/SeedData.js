require('dotenv').config();
const mongoose = require('mongoose');
const Song = require('../models/Song');
const Playlist = require('../models/Playlist');

async function seedData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Clear existing data
    await Song.deleteMany({});
    await Playlist.deleteMany({});
    console.log('🗑️  Cleared existing data');
    
    // Create sample songs
    const songs = await Song.create([
      {
        title: "Love Story",
        artist: "Taylor Swift",
        albumArt: "https://upload.wikimedia.org/wikipedia/en/8/86/Taylor_Swift_-_Fearless.png",
        videoUrl: "https://www.youtube.com/watch?v=8xg3vE8Ie_E",
        audioUrl: "https://example.com/audio/love-story.mp3",
        duration: 235,
        genre: ["Pop", "Country"],
        releaseYear: 2008,
        isActive: true,
        likes: 0,
        plays: 0
      },
      {
        title: "Blank Space",
        artist: "Taylor Swift",
        albumArt: "https://upload.wikimedia.org/wikipedia/en/f/f6/Taylor_Swift_-_1989.png",
        videoUrl: "https://www.youtube.com/watch?v=e-ORhEE9VVg",
        audioUrl: "https://example.com/audio/blank-space.mp3",
        duration: 231,
        genre: ["Pop"],
        releaseYear: 2014,
        isActive: true,
        likes: 0,
        plays: 0
      },
      {
        title: "Anti-Hero",
        artist: "Taylor Swift",
        albumArt: "https://upload.wikimedia.org/wikipedia/en/0/0c/Taylor_Swift_-_Midnights.png",
        videoUrl: "https://www.youtube.com/watch?v=b1kbLwvqugk",
        audioUrl: "https://example.com/audio/anti-hero.mp3",
        duration: 200,
        genre: ["Pop", "Synth-pop"],
        releaseYear: 2022,
        isActive: true,
        likes: 0,
        plays: 0
      },
      {
        title: "Cruel Summer",
        artist: "Taylor Swift",
        albumArt: "https://upload.wikimedia.org/wikipedia/en/c/cd/Taylor_Swift_-_Lover.png",
        videoUrl: "https://www.youtube.com/watch?v=ic8j13piAhQ",
        audioUrl: "https://example.com/audio/cruel-summer.mp3",
        duration: 178,
        genre: ["Pop"],
        releaseYear: 2019,
        isActive: true,
        likes: 0,
        plays: 0
      },
      {
        title: "Shake It Off",
        artist: "Taylor Swift",
        albumArt: "https://upload.wikimedia.org/wikipedia/en/f/f6/Taylor_Swift_-_1989.png",
        videoUrl: "https://www.youtube.com/watch?v=nfWlot6h_JM",
        audioUrl: "https://example.com/audio/shake-it-off.mp3",
        duration: 219,
        genre: ["Pop"],
        releaseYear: 2014,
        isActive: true,
        likes: 0,
        plays: 0
      }
    ]);
    
    console.log(`✅ Created ${songs.length} sample songs`);
    
    // Create sample playlists
    const playlists = await Playlist.create([
      {
        title: "Dreamy Pop Vibes",
        description: "Soft and ethereal pop songs for a dreamy mood 💕✨",
        coverImage: "https://images.unsplash.com/photo-1614854262340-ab1ca7d079c7?w=400",
        songs: songs.map(s => s._id),
        isFeatured: true,
        isActive: true,
        likes: 0,
        views: 0
      },
      {
        title: "Y2K Throwback",
        description: "Early 2000s nostalgia playlist 🌸💖",
        coverImage: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400",
        songs: [songs[0]._id, songs[1]._id, songs[4]._id],
        isFeatured: false,
        isActive: true,
        likes: 0,
        views: 0
      }
    ]);
    
    console.log(`✅ Created ${playlists.length} sample playlists`);
    
    console.log('\n🎉 Sample data seeded successfully!\n');
    console.log('You can now start the server and see:');
    console.log(`- ${songs.length} songs`);
    console.log(`- ${playlists.length} playlists`);
    console.log('\nRun: npm run dev');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

// Run seed
seedData();