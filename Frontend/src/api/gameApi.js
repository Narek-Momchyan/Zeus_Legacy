import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const spinRequest = async (payload = {}) => {
  try {
    const response = await apiClient.post('/api/spin/', payload);
    return response.data;
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    throw error;
  }
};

export const fetchGameConfig = async () => {
  try {
    const response = await apiClient.get('/api/game-config/');
    return response.data;
  } catch (error) {
    console.error('API Error fetching game config:', error.response?.data || error.message);
    return null;
  }
};

export const resetWallet = async () => {
  try {
    const response = await apiClient.post('/api/reset-wallet/');
    return response.data;
  } catch (error) {
    console.error('API Error resetting wallet:', error.response?.data || error.message);
    return null;
  }
};

export default {
  spinRequest,
  fetchGameConfig,
  resetWallet,
};
