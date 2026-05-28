import { memo } from 'react';

/**
 * Format an ISO timestamp into a human-readable time string (e.g. "10:45 AM").
 *
 * @param {string} isoTimestamp
 * @returns {string}
 */
function formatTimestamp(isoTimestamp) {
  return new Date(isoTimestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Strip residual markdown and render as clean plain text with paragraph spacing.
 *
 * @param {string} text
 * @returns {JSX.Element[]}
 */
function renderContent(text) {
  const cleaned = text
    .replace(/#{1,6}\s*/g, '')                // remove ## headers
    .replace(/\*\*(.*?)\*\*/g, '$1')          // remove **bold**
    .replace(/\*(.*?)\*/g, '$1')              // remove *italic*
    .replace(/__|---.*/g, '')                 // remove __ and horizontal rules
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // [link](url) → link text only
    .replace(/`{1,3}[^`]*`{1,3}/g, '')       // remove inline code blocks
    .replace(/^\s*[-*|]\s*/gm, '')            // remove leading bullets/pipes
    .trim();

  return cleaned.split('\n').map((line, i) =>
    line.trim() === '' ? (
      <div key={i} className="h-2" />
    ) : (
      <p key={i} className="text-sm leading-relaxed">
        {line}
      </p>
    )
  );
}

/**
 * MessageBubble — Renders a single chat message (user, bot, or error).
 *
 * Memoized with React.memo to prevent the entire message list from
 * re-rendering when a new message is appended.
 *
 * @param {{ role: string, content: string, timestamp: string, isError?: boolean }} props
 */
function MessageBubble({ role, content, timestamp, isError }) {
  const isUser = role === 'user';

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start items-end gap-2'} bubble-enter`}
    >
      {/* Bot avatar — hidden on very small screens */}
      {!isUser && (
        <div
          className="hidden xs:flex w-7 h-7 rounded-full bg-accent text-white items-center justify-center shrink-0"
          aria-hidden="true"
          style={{ minWidth: '1.75rem' }}
        >
          <span className="text-[10px] font-bold leading-none">GRA</span>
        </div>
      )}

      <div className="flex flex-col max-w-[80%] md:max-w-[70%]">
        {/* Bubble */}
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? 'bg-primary text-white'
              : isError
                ? 'bg-error-bg text-error-text border border-red-200'
                : 'bg-bot-bubble text-text-primary'
          }`}
        >
          {renderContent(content)}
        </div>

        {/* Timestamp */}
        <span
          className={`text-xs text-text-muted mt-1 ${
            isUser ? 'text-right' : 'text-left'
          }`}
        >
          {formatTimestamp(timestamp)}
        </span>
      </div>
    </div>
  );
}

export default memo(MessageBubble);
