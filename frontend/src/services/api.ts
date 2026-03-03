import axios from 'axios';
import { DebateRequest, DebateSummary, DebateStartResponse } from '../types';

// Base URL from Vercel environment variable
const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/debates`;

// Create axios instance
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Optional: Log error globally (helpful for debugging production)
apiClient.interceptors.response.use(
    response => response,
    error => {
        console.error('API Error:', error?.response || error.message);
        return Promise.reject(error);
    }
);

export const debateApi = {

    startDebate: async (request: DebateRequest): Promise<DebateStartResponse> => {
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
