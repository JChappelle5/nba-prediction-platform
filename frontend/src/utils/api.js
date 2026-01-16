import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create(
    {
        baseURL: API_BASE_URL,
        headers:
        {
            'Content-Type': 'application/json',
        },
    }
);

// Add token to requests if it exists
api.interceptors.request.use(
    (config) =>
    {
        const token = localStorage.getItem('token');
        if (token)
        {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) =>
    {
        return Promise.reject(error);
    }
);

// Auth API calls
export const authAPI =
{
    register: (userData) => api.post('/auth/register', userData),
    login: (credentials) => api.post('/auth/login', credentials),
};

// Games API calls
export const gamesAPI =
{
    getAll: (params) => api.get('/games', { params }),
    getUpcoming: () => api.get('/games/upcoming'),
    getToday: () => api.get('/games/today'),
    getById: (id) => api.get(`/games/${id}`),
};

// Predictions API calls
export const predictionsAPI =
{
    create: (predictionsData) => api.post('/predictions', predictionsData),
    getAll: () => api.get('/predictions'),
    getById: (id) => api.get(`/predictions/${id}`),
    getForGame: (gameId) => api.get(`/predictions/game/${gameId}`),
};


// Leaderboard API calls
export const leaderboardAPI =
{
    getLeaderboard: (limit) => api.get('/leaderboard', { params: { limit } }),
    getUserStats: () => api.get('/leaderboard/me'),
};

export default api;