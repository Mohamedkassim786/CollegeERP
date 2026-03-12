/**
 * axios.js
 * Centralised Axios instance for all API calls.
 *
 * Request interceptor:  Attaches JWT token from localStorage to every request.
 * Response interceptor: Redirects to login on 401 (expired/invalid token).
 *
 * Usage:
 *   import api from '../api/axios';
 *   const response = await api.get('/faculty/stats');
 */

import axios from 'axios';

/**
 * Determine the API base URL.
 * - In development: auto-detects LAN IP so the app works from other devices.
 * - In production: uses VITE_API_URL environment variable.
 */
const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    `http://${window.location.hostname}:3000/api`;

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000, // 30 second timeout
});

// ─── Request Interceptor ──────────────────────────────────────────────────────
// Attaches the JWT Bearer token to every request automatically.
api.interceptors.request.use(
    (config) => {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            if (user?.accessToken) {
                config.headers['Authorization'] = `Bearer ${user.accessToken}`;
            }
        } catch (_) {
            // Malformed JSON in localStorage — ignore
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ─── Response Interceptor ─────────────────────────────────────────────────────
// Handles 401 Unauthorized globally: clears session and redirects to login.
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid — clear session
            localStorage.removeItem('user');
            // Redirect to login if not already there
            if (window.location.pathname !== '/') {
                window.location.href = '/';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
