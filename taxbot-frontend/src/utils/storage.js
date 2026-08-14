const SESSIONS_KEY = 'taxbot_sessions';
const ACTIVE_ID_KEY = 'taxbot_active_session';
const MAX_SESSIONS = 10;

/**
 * Generate a short unique ID for sessions.
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/**
 * Extract a title from the first user message (truncated).
 */
function deriveTitle(messages) {
  const firstUser = messages.find((m) => m.role === 'user');
  if (!firstUser) return 'New conversation';
  const text = firstUser.content.trim();
  return text.length > 50 ? text.slice(0, 50) + '...' : text;
}

/**
 * Create a new empty session object.
 */
export function createSession() {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    title: 'New conversation',
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Load all sessions from localStorage, newest first.
 * Returns [] if nothing stored or if data is corrupt.
 */
export function loadSessions() {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((s) => s && s.id && Array.isArray(s.messages))
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  } catch {
    return [];
  }
}

/**
 * Persist the full sessions array to localStorage.
 * Caps at MAX_SESSIONS (drops oldest).
 */
export function saveSessions(sessions) {
  try {
    const capped = sessions
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, MAX_SESSIONS);
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(capped));
  } catch {
    // localStorage full or unavailable — silently fail
  }
}

/**
 * Load the active session ID from localStorage.
 */
export function loadActiveSessionId() {
  try {
    return localStorage.getItem(ACTIVE_ID_KEY) || null;
  } catch {
    return null;
  }
}

/**
 * Persist the active session ID.
 */
export function saveActiveSessionId(id) {
  try {
    localStorage.setItem(ACTIVE_ID_KEY, id);
  } catch {
    // silently fail
  }
}

/**
 * Update a single session's title based on its messages.
 */
export function refreshSessionTitle(session) {
  return { ...session, title: deriveTitle(session.messages) };
}
