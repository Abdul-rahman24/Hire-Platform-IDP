import axios from 'axios';

const API_BASE_URL = 'https://utmtbogmaf.execute-api.ap-southeast-1.amazonaws.com';

const testApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

testApi.interceptors.response.use(
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
      } else if (status === 400) {
        errorMessage = 'Invalid request payload (400).';
      } else if (status === 404) {
        errorMessage = 'Resource not found (404).';
      } else if (status === 500) {
        errorMessage = 'Internal server error (500).';
      }
    } else if (error.request) {
      errorMessage = 'Network error. Please check your connection to the Test Configuration backend.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    return Promise.reject(new Error(errorMessage));
  }
);

export default testApi;
