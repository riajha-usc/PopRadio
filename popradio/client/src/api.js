import axios from 'axios';

// Create axios instance
const apiClient = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Session management
const getSessionId = () => {
  let sessionId = localStorage.getItem('popradio_session');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('popradio_session', sessionId);
  }
  return sessionId;
};

// Add session ID to all requests
apiClient.interceptors.request.use((config) => {
  config.headers['X-Session-Id'] = getSessionId();
  return config;
});

// Handle responses
apiClient.interceptors.response.use(
  (response) => response.data.data,
  (error) => {
    const message = error.response?.data?.error || 'Something went wrong';
    console.error('API Error:', message);
    throw new Error(message);
  }
);

// API methods
const api = {
  // Radio
  getRadioStream: () => apiClient.get('/radio/stream'),
  skipToNext: () => apiClient.post('/radio/next'),

  // Songs
  getSongs: (params = {}) => apiClient.get('/songs', { params }),
  getSongById: (songId) => apiClient.get(`/songs/${songId}`),
  playSong: (songId) => apiClient.post(`/songs/${songId}/play`),
  likeSong: (songId) => apiClient.post(`/songs/${songId}/like`),
  unlikeSong: (songId) => apiClient.delete(`/songs/${songId}/like`),
  getSongComments: (songId, cursor) => apiClient.get(`/songs/${songId}/comments`, { 
    params: { cursor } 
  }),
  addSongComment: (songId, text) => apiClient.post(`/songs/${songId}/comments`, { text }),
  getPopularSongs: () => apiClient.get('/songs/popular'),

  // Playlists
  getPlaylists: (params = {}) => apiClient.get('/playlists', { params }),
  getPlaylistById: (playlistId) => apiClient.get(`/playlists/${playlistId}`),
  likePlaylist: (playlistId) => apiClient.post(`/playlists/${playlistId}/like`),
  unlikePlaylist: (playlistId) => apiClient.delete(`/playlists/${playlistId}/like`),
  getPlaylistComments: (playlistId, cursor) => apiClient.get(`/playlists/${playlistId}/comments`, {
    params: { cursor }
  }),
  addPlaylistComment: (playlistId, text) => apiClient.post(`/playlists/${playlistId}/comments`, { text }),
  getFeaturedPlaylists: () => apiClient.get('/playlists/featured')
};

export default api;