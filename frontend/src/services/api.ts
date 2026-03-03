import axios from 'axios';
import {
  DebateRequest,
  DebateSummary,
  DebateStartResponse,
} from '../types';

/**
 * Backend Base URL
 * - Uses Vercel environment variable if available
 * - Falls back to Render production URL
 */
const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  'https://stock-arena.onrender.com';

console.info(`[API] Base URL configured as: ${API_BASE}`);

/**
 * Axios instance
 * Final base URL becomes:
 * https://stock-arena.onrender.com/api/debates
 */
const apiClient = axios.create({
  baseURL: `${API_BASE}/api/debates`,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Global error interceptor
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error?.response || error.message);
    return Promise.reject(error);
  }
);

/**
 * Debate API methods
 */
export const debateApi = {
  startDebate: async (
    request: DebateRequest
  ): Promise<DebateStartResponse> => {
    const response = await apiClient.post('/start', request);
    return response.data;
  },

  getHistory: async (): Promise<DebateSummary[]> => {
    const response = await apiClient.get('/history');
    return response.data;
  },

  getDebate: async (id: number) => {
    const response = await apiClient.get(`/${id}`);
    return response.data;
  },

  getMarketIndices: async (): Promise<any[]> => {
    const response = await apiClient.get('/market-indices');
    return response.data;
  },
};
