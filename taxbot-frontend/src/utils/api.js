import axios from 'axios';

const API_TIMEOUT_MS = 60_000;

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: API_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Send a user message and conversation history to the TaxBot backend.
 *
 * @param {string} message - The current user input.
 * @param {Array<{role: string, content: string}>} history - Prior conversation turns.
 * @returns {Promise<{reply: string, sources: Array<{source: string, category: string}>}>}
 */
export const sendChatMessage = async (message, history) => {
  const response = await apiClient.post('/api/chat', { message, history });
  return response.data;
};

export default apiClient;
