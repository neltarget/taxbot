import { useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import WelcomeBanner from './WelcomeBanner';

/**
 * Determine whether to use smooth scrolling based on the user's
 * prefers-reduced-motion setting.
 */
function getScrollBehavior() {
  if (typeof window === 'undefined') {
    return 'auto';
  }
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  return prefersReduced.matches ? 'auto' : 'smooth';
}

/**
 * Format a timestamp for the date chip.
 */
function formatDateChip(isoTimestamp) {
  const date = new Date(isoTimestamp);
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (isToday) return 'Today';

  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * ChatWindow — Scrollable message display area.
 * Notion-inspired: clean, spacious, elegant.
 */
export default function ChatWindow({ messages, isLoading, onSuggestionClick, onRetry }) {
  const bottomRef = useRef(null);
  const hasMessages = messages.length > 0;

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
      <div className="max-w-2xl mx-auto flex flex-col gap-3">
        {/* Welcome state */}
        {!hasMessages && !isLoading && (
          <WelcomeBanner
            onSuggestionClick={onSuggestionClick}
            isLoading={isLoading}
          />
        )}

        {/* Date chip */}
        {hasMessages && (
          <div className="flex justify-center mb-1">
            <span className="text-[10px] text-white/50 bg-white/[0.03] border border-white/[0.04] rounded-full px-3 py-0.5 backdrop-blur-sm">
              {formatDateChip(messages[0].timestamp)}
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
            sources={msg.sources}
            onRetry={msg.isError && msg.retryPayload ? () => onRetry(msg.retryPayload) : undefined}
          />
        ))}

        {/* Typing indicator */}
        {isLoading && <TypingIndicator />}

        {/* Scroll anchor */}
        <div ref={bottomRef} aria-hidden="true" role="presentation" />
      </div>
    </div>
  );
}
