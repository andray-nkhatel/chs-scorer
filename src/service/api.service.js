// src/services/api.service.js
import axios from 'axios';

// Create axios instance with the correct base URL
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5046/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Flag to prevent multiple refresh requests
let isRefreshing = false;
// Store pending requests that should be retried after token refresh
let refreshSubscribers = [];

// Helper function to subscribe requests to the token refresh
const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

// Helper function to notify subscribers that token is refreshed
const onTokenRefreshed = (newToken) => {
  refreshSubscribers.forEach(callback => callback(newToken));
  refreshSubscribers = [];
};

// Helper function to refresh the access token
const refreshToken = async () => {
  if (isRefreshing) {
    return new Promise((resolve) => {
      subscribeTokenRefresh(newToken => {
        resolve(newToken);
      });
    });
  }

  isRefreshing = true;
  
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      // Return a rejected promise with a more descriptive error
      return Promise.reject(new Error('Authentication failed: No refresh token available'));
    }
    
    const response = await axios.post(
      `${apiClient.defaults.baseURL}/auth/refresh`, 
      { refreshToken }
    );
    
    // Store the new tokens
    const { token, refreshToken: newRefreshToken } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', newRefreshToken);
    
    isRefreshing = false;
    onTokenRefreshed(token);
    return token;
  } catch (error) {
    isRefreshing = false;
    // Clear tokens on refresh failure - user will need to log in again
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    // Redirect to login page or dispatch logout action
    window.location.href = '/login';
    return Promise.reject(error);
  }
};

// Define a proper post method for the apiClient
const originalPost = apiClient.post;
apiClient.post = function(url, data, config = {}) {
  console.log('Request URL:', url);
  console.log('Full request URL:', this.defaults.baseURL + url);
  console.log('Request headers:', this.defaults.headers);
  console.log('Request data:', data);
  
  // Skip refresh token logic for auth endpoints
  if (url.includes('/auth/login') || url.includes('/auth/register')) {
    return originalPost.call(this, url, data, config)
      .catch(error => {
        console.error('Login/register error:', error);
        // Don't attempt to refresh token for auth endpoints
        throw error;
      });
  }
  
  // Standard handling for other endpoints
  return originalPost.call(this, url, data, config);
};

// Add request interceptor with detailed logging
apiClient.interceptors.request.use(
  config => {
    console.log('Request URL:', config.url);
    console.log('Full request URL:', config.baseURL + config.url);
    console.log('Request headers:', config.headers);
    console.log('Request data:', config.data);
    
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor with detailed logging and token refresh
apiClient.interceptors.response.use(
  response => {
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    console.log('Response data:', response.data);
    return response;
  },
  async error => {
    console.error('Response error:', error.message);
    
    const originalRequest = error.config;
    
    if (error.response) {
      console.error('Error status:', error.response.status);
      console.error('Error headers:', error.response.headers);
      console.error('Error data:', error.response.data);
      
      // Skip token refresh for login/register endpoints
      if (originalRequest.url.includes('/auth/login') || 
          originalRequest.url.includes('/auth/register')) {
        return Promise.reject(error);
      }
      
      // If the error is 401 Unauthorized and the request hasn't been retried yet
      if (error.response.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        
        try {
          // Refresh the token
          const newToken = await refreshToken();
          
          // Update the authorization header
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          
          // Retry the original request with the new token
          return apiClient(originalRequest);
        } catch (refreshError) {
          // If token refresh fails, reject with the refresh error
          console.error('Token refresh failed:', refreshError);
          return Promise.reject(refreshError);
        }
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Request setup error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Add a method to explicitly refresh the token
apiClient.refreshAuthToken = refreshToken;

export default apiClient;