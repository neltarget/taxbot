import { useState, useCallback } from 'react';
import { sendChatMessage } from '../utils/api';

const MAX_MESSAGE_LENGTH = 500;
const MAX_HISTORY_LENGTH = 10;

/**
 * Construct an error message appropriate to the Axios failure type.
 * Distinguishes network errors, timeouts, and server errors for better UX.
 *
 * @param {import('axios').AxiosError} error
 * @returns {string}
 */
function buildErrorContent(error) {
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return (
      "⚠️ The request timed out. TaxBot may be busy — please try again."
    );
  }

  if (!error.response) {
    return (
      "⚠️ Unable to reach the server. Check your connection and try again."
    );
  }

  const serverDetail = error.response.data?.detail;
  if (serverDetail) {
    return `⚠️ ${serverDetail}`;
  }

  return (
    "⚠️ I'm having trouble connecting right now. Please try again shortly " +
    "or contact GRA directly at 0800-900-110 (toll-free) or visit gra.gov.gh."
  );
}

/**
 * Create a message object with a unique ID and ISO timestamp.
 *
 * @param {'user' | 'assistant'} role
 * @param {string} content
 * @param {boolean} [isError=false]
 * @returns {{ id: string, role: string, content: string, timestamp: string, isError: boolean }}
 */
function createMessage(role, content, isError = false) {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    timestamp: new Date().toISOString(),
    isError,
  };
}

/**
 * Custom hook owning all chat state and API communication.
 * Returns messages, loading state, and action handlers.
 */
export function useChat() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = useCallback(
    async (userInput) => {
      const trimmed = userInput?.trim();
      if (!trimmed || trimmed.length > MAX_MESSAGE_LENGTH || isLoading) {
        return;
      }

      const userMessage = createMessage('user', trimmed);

      // Build history from current messages plus the new user message.
      // Cap at last N messages to prevent context bloat and slow LLM responses.
      const allMessages = [...messages, { role: 'user', content: trimmed }];
      const history = allMessages
        .slice(-MAX_HISTORY_LENGTH)
        .map(({ role, content }) => ({ role, content }));

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      try {
        const reply = await sendChatMessage(trimmed, history);
        const botMessage = createMessage('assistant', reply);
        setMessages((prev) => [...prev, botMessage]);
      } catch (err) {
        const fallbackContent = buildErrorContent(err);
        const errorMessage = createMessage('assistant', fallbackContent, true);
        setMessages((prev) => [...prev, errorMessage]);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, messages],
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isLoading, error, sendMessage, clearChat };
}
