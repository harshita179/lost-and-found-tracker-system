// Mobile and production builds should set REACT_APP_API_URL explicitly.
// The localhost fallback is kept for local web development only.
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

if (!process.env.REACT_APP_API_URL && typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
  console.warn('REACT_APP_API_URL is not set. Mobile/production builds should point to a deployed backend API.');
}

export default API_BASE_URL;
