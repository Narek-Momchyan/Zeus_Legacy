import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

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

export const fetchBalance = async () => {
  try {
    const response = await apiClient.get('/api/balance/');
    return response.data.balance;
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    throw error;
  }
};

export default {
  spinRequest,
  fetchBalance,
};
