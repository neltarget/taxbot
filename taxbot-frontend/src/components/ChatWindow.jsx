import { useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import WelcomeBanner from './WelcomeBanner';

/**
 * Determine whether to use smooth scrolling based on the user's
 * prefers-reduced-motion setting.
 *
 * @returns {'smooth' | 'auto'}
 */
function getScrollBehavior() {
  if (typeof window === 'undefined') {
    return 'auto';
  }
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  return prefersReduced.matches ? 'auto' : 'smooth';
}

/**
 * Format today's date for the date chip displayed above the first message.
 *
 * @returns {string} e.g. "Wed, 28 May 2025"
 */
function formatTodayChip() {
  return new Date().toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * ChatWindow — Scrollable message display area.
 * Shows WelcomeBanner when empty, otherwise renders messages
 * with auto-scroll-to-bottom on new messages and loading state.
 *
 * @param {{
 *   messages: Array<{ id: string, role: string, content: string, timestamp: string, isError?: boolean }>,
 *   isLoading: boolean,
 *   onSuggestionClick: (text: string) => void,
 * }} props
 */
export default function ChatWindow({ messages, isLoading, onSuggestionClick }) {
  const bottomRef = useRef(null);
  const hasMessages = messages.length > 0;

  // Auto-scroll to bottom on new messages or when loading state changes.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: getScrollBehavior() });
  }, [messages, isLoading]);

  return (
    <div
      className="flex-1 overflow-y-auto px-4 py-6 chat-scrollbar"
      role="log"
      aria-live="polite"
      aria-label="Chat messages"
    >
      <div className="max-w-2xl mx-auto flex flex-col gap-4">
        {/* Welcome state */}
        {!hasMessages && !isLoading && (
          <WelcomeBanner
            onSuggestionClick={onSuggestionClick}
            isLoading={isLoading}
          />
        )}

        {/* Date chip */}
        {hasMessages && (
          <div className="flex justify-center mb-2">
            <span className="text-xs text-text-muted bg-surface border border-app-border rounded-full px-3 py-1">
              {formatTodayChip()}
            </span>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            role={msg.role}
            content={msg.content}
            timestamp={msg.timestamp}
            isError={msg.isError}
          />
        ))}

        {/* Typing indicator */}
        {isLoading && <TypingIndicator />}

        {/* Scroll anchor */}
        <div ref={bottomRef} aria-hidden="true" />
      </div>
    </div>
  );
}
