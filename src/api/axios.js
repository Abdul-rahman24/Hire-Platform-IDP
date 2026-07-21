import axios from 'axios';

// Use /api local proxy in development to bypass browser CORS preflight errors
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Response interceptor for unified error formatting
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let errorMessage = 'An unexpected error occurred.';
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      if (typeof data === 'string') {
        errorMessage = data;
      } else if (data && data.message) {
        errorMessage = data.message;
      } else if (data && data.error) {
        errorMessage = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
      } else if (data && data.detail) {
        errorMessage = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
      } else if (status === 422) {
        errorMessage = 'Unprocessable Entity (422): Please check payload format and required fields.';
      } else if (status === 400) {
        errorMessage = 'Invalid request payload (400).';
      } else if (status === 404) {
        errorMessage = 'Resource not found (404).';
      } else if (status === 409) {
        errorMessage = 'Resource conflict or duplicate ID (409).';
      } else if (status === 500) {
        errorMessage = 'Internal server error (500).';
      }
    } else if (error.request) {
      errorMessage = 'Network error / CORS issue. Please verify backend API access.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    return Promise.reject(new Error(errorMessage));
  }
);

export default api;
