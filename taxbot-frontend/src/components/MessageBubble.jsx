import { memo, useState, useCallback } from 'react';
import Markdown from 'react-markdown';

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
 * Deduplicate sources by their source field.
 *
 * @param {Array<{source: string, category: string}>} sources
 * @returns {Array<{source: string, category: string}>}
 */
function dedupeSources(sources) {
  const seen = new Set();
  return sources.filter((s) => {
    if (seen.has(s.source)) return false;
    seen.add(s.source);
    return true;
  });
}

/**
 * SourceBadge — A subtle indicator shown on bot messages that used RAG context.
 * On hover or focus, reveals a tooltip listing the source documents.
 * Keyboard accessible: Escape dismisses, focus/blur toggles.
 */
function SourceBadge({ sources }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const unique = dedupeSources(sources);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      setShowTooltip(false);
    }
  }, []);

  if (unique.length === 0) return null;

  const tooltipId = `sources-tooltip-${unique[0]?.source?.replace(/\s+/g, '-')}`;

  return (
    <div className="relative inline-block mt-1">
      <button
        type="button"
        className="inline-flex items-center gap-1 text-[10px] text-text-muted hover:text-text-secondary transition-colors cursor-help"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        onKeyDown={handleKeyDown}
        aria-label="View sources"
        aria-expanded={showTooltip}
        aria-describedby={showTooltip ? tooltipId : undefined}
      >
        <svg
          className="w-3 h-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
          />
        </svg>
        {unique.length === 1 ? '1 source' : `${unique.length} sources`}
      </button>

      {showTooltip && (
        <div
          id={tooltipId}
          role="tooltip"
          className="absolute bottom-full left-0 mb-1 z-10 w-64 p-2 bg-surface text-xs text-text-primary rounded-lg shadow-lg border border-app-border"
        >
          <p className="font-medium mb-1 text-text-secondary">RAG Sources</p>
          <ul className="space-y-1">
            {unique.map((s, i) => (
              <li key={i} className="flex flex-col">
                <span className="font-medium truncate">{s.source}</span>
                {s.category && (
                  <span className="text-text-muted text-[10px]">{s.category}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * MessageBubble — Renders a single chat message (user, bot, or error).
 *
 * Memoized with React.memo to prevent the entire message list from
 * re-rendering when a new message is appended.
 *
 * @param {{ role: string, content: string, timestamp: string, isError?: boolean, sources?: Array, onRetry?: () => void }} props
 */
function MessageBubble({ role, content, timestamp, isError, sources, onRetry }) {
  const isUser = role === 'user';

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start items-end gap-2'} bubble-enter`}
      role="article"
      aria-label={`${isUser ? 'You' : 'TaxBot'} said`}
    >
      {/* Bot avatar — always visible, smaller on tiny screens */}
      {!isUser && (
        <div
          className="flex w-5 h-5 xs:w-7 xs:h-7 rounded-full bg-accent text-white items-center justify-center shrink-0"
          aria-hidden="true"
        >
          <span className="text-[8px] xs:text-[10px] font-bold leading-none">GRA</span>
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
          {isUser ? (
            content.split('\n').map((line, i) =>
              line.trim() === '' ? (
                <div key={i} className="h-2" />
              ) : (
                <p key={i} className="text-sm leading-relaxed">
                  {line}
                </p>
              )
            )
          ) : (
            <Markdown
              components={{
                p: ({ children }) => <p className="text-sm leading-relaxed mb-2 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1 text-sm">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1 text-sm">{children}</ol>,
                li: ({ children }) => <li className="text-sm leading-relaxed">{children}</li>,
                h1: ({ children }) => <h1 className="text-base font-semibold mb-2">{children}</h1>,
                h2: ({ children }) => <h2 className="text-base font-semibold mb-2">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-semibold mb-2">{children}</h3>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                a: ({ href, children }) => (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80">
                    {children}
                  </a>
                ),
                code: ({ children }) => <code className="bg-black/10 rounded px-1 text-xs">{children}</code>,
                br: () => <br />,
              }}
            >
              {content}
            </Markdown>
          )}
        </div>

        {/* Source badge — only on non-error bot messages */}
        {!isUser && !isError && sources && sources.length > 0 && (
          <SourceBadge sources={sources} />
        )}

        {/* Retry button — only on error messages */}
        {isError && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-1 text-[11px] text-error-text hover:underline cursor-pointer self-start"
          >
            Retry
          </button>
        )}

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
