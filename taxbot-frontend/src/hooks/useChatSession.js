import { useState, useCallback, useMemo } from 'react';
import { sendChatMessage } from '../utils/api';
import {
  loadSessions,
  saveSessions,
  loadActiveSessionId,
  saveActiveSessionId,
  createSession,
  refreshSessionTitle,
} from '../utils/storage';

const MAX_MESSAGE_LENGTH = 500;
const MAX_HISTORY_LENGTH = 10;

/**
 * Initialize sessions state from localStorage.
 * Uses lazy initializer so localStorage is only read once.
 */
function initSessions() {
  const stored = loadSessions();
  if (stored.length > 0) return stored;
  const fresh = createSession();
  saveSessions([fresh]);
  return [fresh];
}

/**
 * Initialize active session ID from localStorage.
 * Uses lazy initializer so localStorage is only read once.
 */
function initActiveId(sessions) {
  const storedActiveId = loadActiveSessionId();
  const exists = sessions.find((s) => s.id === storedActiveId);
  const id = exists ? storedActiveId : sessions[0].id;
  saveActiveSessionId(id);
  return id;
}

/**
 * Construct an error message appropriate to the Axios failure type.
 */
function buildErrorContent(error) {
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return 'The request timed out. TaxBot may be busy — please try again.';
  }
  if (!error.response) {
    return 'Unable to reach the server. Check your connection and try again.';
  }
  const serverDetail = error.response.data?.detail;
  if (serverDetail) return serverDetail;
  return (
    "I'm having trouble connecting right now. Please try again shortly " +
    'or contact GRA directly at 0800-900-110 (toll-free) or visit gra.gov.gh.'
  );
}

/**
 * Create a message object with a unique ID and ISO timestamp.
 */
function createMessage(role, content, isError = false, sources = [], retryPayload = null) {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    timestamp: new Date().toISOString(),
    isError,
    sources,
    retryPayload,
  };
}

/**
 * Session-aware chat hook. Manages multiple conversations persisted
 * to localStorage, with session switching, creation, and deletion.
 *
 * Returns the same API shape as the original useChat plus session controls.
 */
export function useChatSession() {
  const [sessions, setSessions] = useState(initSessions);
  const [activeSessionId, setActiveSessionId] = useState(() => initActiveId(sessions));
  const [isLoading, setIsLoading] = useState(false);

  // Derived: the active session's messages (stable reference via useMemo)
  const messages = useMemo(() => {
    const active = sessions.find((s) => s.id === activeSessionId);
    return active ? active.messages : [];
  }, [sessions, activeSessionId]);

  /**
   * Persist sessions and update active ID atomically.
   */
  const persist = useCallback((nextSessions, nextActiveId) => {
    setSessions(nextSessions);
    if (nextActiveId) {
      setActiveSessionId(nextActiveId);
      saveActiveSessionId(nextActiveId);
    }
    saveSessions(nextSessions);
  }, []);

  /**
   * Send a user message and get a bot response.
   */
  const sendMessage = useCallback(
    async (userInput) => {
      const trimmed = userInput?.trim();
      if (!trimmed || trimmed.length > MAX_MESSAGE_LENGTH || isLoading) return;

      const userMessage = createMessage('user', trimmed);

      // Build LLM history from current messages + new user message
      const allMessages = [...messages, { role: 'user', content: trimmed }];
      const history = allMessages
        .slice(-MAX_HISTORY_LENGTH)
        .map(({ role, content }) => ({ role, content }));

      // Add user message to active session
      let updatedSessions = sessions.map((s) => {
        if (s.id !== activeSessionId) return s;
        const nextMessages = [...s.messages, userMessage];
        return refreshSessionTitle({ ...s, messages: nextMessages, updatedAt: new Date().toISOString() });
      });

      persist(updatedSessions, activeSessionId);
      setIsLoading(true);

      try {
        const { reply, sources } = await sendChatMessage(trimmed, history);
        const botMessage = createMessage('assistant', reply, false, sources);

        updatedSessions = updatedSessions.map((s) => {
          if (s.id !== activeSessionId) return s;
          return { ...s, messages: [...s.messages, botMessage], updatedAt: new Date().toISOString() };
        });

        persist(updatedSessions, activeSessionId);
      } catch (err) {
        const fallbackContent = buildErrorContent(err);
        const errorMessage = createMessage('assistant', fallbackContent, true, [], trimmed);

        updatedSessions = updatedSessions.map((s) => {
          if (s.id !== activeSessionId) return s;
          return { ...s, messages: [...s.messages, errorMessage], updatedAt: new Date().toISOString() };
        });

        persist(updatedSessions, activeSessionId);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, messages, sessions, activeSessionId, persist],
  );

  /**
   * Retry the last error message.
   */
  const retryMessage = useCallback(
    async (retryPayload) => {
      if (!retryPayload || isLoading) return;

      // Remove the last error message from active session
      const updatedSessions = sessions.map((s) => {
        if (s.id !== activeSessionId) return s;
        const msgs = s.messages.slice(0, -1);
        return { ...s, messages: msgs, updatedAt: new Date().toISOString() };
      });

      persist(updatedSessions, activeSessionId);

      // Inline the send logic with corrected messages (state hasn't re-rendered yet)
      const session = updatedSessions.find((s) => s.id === activeSessionId);
      const currentMessages = session ? session.messages : [];

      const userMessage = createMessage('user', retryPayload);
      const allMessages = [...currentMessages, { role: 'user', content: retryPayload }];
      const history = allMessages
        .slice(-MAX_HISTORY_LENGTH)
        .map(({ role, content }) => ({ role, content }));

      let finalSessions = updatedSessions.map((s) => {
        if (s.id !== activeSessionId) return s;
        return { ...s, messages: [...s.messages, userMessage], updatedAt: new Date().toISOString() };
      });

      persist(finalSessions, activeSessionId);
      setIsLoading(true);

      try {
        const { reply, sources } = await sendChatMessage(retryPayload, history);
        const botMessage = createMessage('assistant', reply, false, sources);

        finalSessions = finalSessions.map((s) => {
          if (s.id !== activeSessionId) return s;
          return { ...s, messages: [...s.messages, botMessage], updatedAt: new Date().toISOString() };
        });

        persist(finalSessions, activeSessionId);
      } catch (err) {
        const fallbackContent = buildErrorContent(err);
        const errorMessage = createMessage('assistant', fallbackContent, true, [], retryPayload);

        finalSessions = finalSessions.map((s) => {
          if (s.id !== activeSessionId) return s;
          return { ...s, messages: [...s.messages, errorMessage], updatedAt: new Date().toISOString() };
        });

        persist(finalSessions, activeSessionId);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, sessions, activeSessionId, persist],
  );

  /**
   * Clear the active chat (create a new session).
   */
  const clearChat = useCallback(() => {
    const fresh = createSession();
    const next = [fresh, ...sessions].slice(0, 10);
    persist(next, fresh.id);
  }, [sessions, persist]);

  /**
   * Switch to a different session by ID.
   */
  const switchSession = useCallback(
    (id) => {
      if (id === activeSessionId) return;
      const exists = sessions.find((s) => s.id === id);
      if (!exists) return;
      setActiveSessionId(id);
      saveActiveSessionId(id);
    },
    [activeSessionId, sessions],
  );

  /**
   * Delete a session by ID. If deleting the active session,
   * switch to the most recent remaining session (or create a new one).
   */
  const deleteSession = useCallback(
    (id) => {
      const remaining = sessions.filter((s) => s.id !== id);
      if (remaining.length === 0) {
        const fresh = createSession();
        persist([fresh], fresh.id);
        return;
      }
      if (id === activeSessionId) {
        const sorted = remaining.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        persist(remaining, sorted[0].id);
      } else {
        persist(remaining, activeSessionId);
      }
    },
    [sessions, activeSessionId, persist],
  );

  return {
    messages,
    sessions,
    activeSessionId,
    isLoading,
    sendMessage,
    retryMessage,
    clearChat,
    switchSession,
    deleteSession,
  };
}
