import { memo } from 'react';
import Markdown from 'react-markdown';
import { Link, ArrowClockwise } from '@phosphor-icons/react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/**
 * Format an ISO timestamp into a human-readable time string (e.g. "10:45 AM").
 */
function formatTimestamp(isoTimestamp) {
  return new Date(isoTimestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Deduplicate sources by their source field.
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
 * SourceBadge — Subtle indicator on bot messages that used RAG context.
 */
function SourceBadge({ sources }) {
  const unique = dedupeSources(sources);

  if (unique.length === 0) return null;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center gap-1 mt-1 text-[10px] text-white/50 hover:text-white/65 transition-colors cursor-help"
            aria-label="View sources"
          >
            <Link className="w-3 h-3" />
            {unique.length === 1 ? '1 source' : `${unique.length} sources`}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="w-64 p-3 bg-slate-800/95 border-white/10 text-white/80">
          <p className="font-medium mb-1.5 text-[11px] text-white/80 uppercase tracking-wider">Sources</p>
          <ul className="space-y-1.5">
            {unique.map((s, i) => (
              <li key={i} className="flex flex-col">
                <span className="font-medium text-xs truncate text-white/80">{s.source}</span>
                {s.category && (
                  <span className="text-[10px] text-white/50">{s.category}</span>
                )}
              </li>
            ))}
          </ul>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * MessageBubble — Single chat message. Notion-inspired: warm, soft surfaces.
 */
function MessageBubble({ role, content, timestamp, isError, sources, onRetry }) {
  const isUser = role === 'user';

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start items-end gap-2.5'} animate-bubble-in`}
      role="article"
      aria-label={`${isUser ? 'You' : 'TaxBot'} said`}
    >
      {/* Bot avatar */}
      {!isUser && (
        <div
          className="flex w-6 h-6 rounded-md bg-gradient-to-br from-amber-500/60 to-yellow-600/60 items-center justify-center shrink-0
            shadow-[0_1px_4px_rgba(196,146,42,0.1)]"
          aria-hidden="true"
        >
          <span className="text-[9px] font-bold text-white leading-none">GRA</span>
        </div>
      )}

      <div className="flex flex-col max-w-[80%] md:max-w-[70%]">
        {/* Bubble */}
        <div
          className={`rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed ${
            isUser
              ? 'bg-white/[0.07] text-white/95 border border-white/[0.06]'
              : isError
                ? 'bg-red-500/[0.08] text-red-200/90 border border-red-500/15'
                : 'bg-white/[0.03] text-white/90 border border-white/[0.04]'
          }`}
        >
          {isUser ? (
            content.split('\n').map((line, i) =>
              line.trim() === '' ? (
                <div key={i} className="h-1.5" />
              ) : (
                <p key={i} className="text-[13px] leading-relaxed">
                  {line}
                </p>
              )
            )
          ) : (
            <Markdown
              components={{
                p: ({ children }) => <p className="text-[13px] leading-relaxed mb-2 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-0.5 text-[13px]">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-2 text-[13px]">{children}</ol>,
                li: ({ children }) => <li className="leading-relaxed pl-1">{children}</li>,
                h1: ({ children }) => <h1 className="text-sm font-semibold mb-2 text-white/95">{children}</h1>,
                h2: ({ children }) => <h2 className="text-sm font-semibold mb-2 text-white/95">{children}</h2>,
                h3: ({ children }) => <h3 className="text-[13px] font-semibold mb-2 text-white/95">{children}</h3>,
                strong: ({ children }) => <strong className="font-semibold text-white/95">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                a: ({ href, children }) => (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="underline text-amber-400/80 hover:text-amber-300/90 transition-colors">
                    {children}
                  </a>
                ),
                code: ({ children }) => <code className="bg-white/[0.06] rounded px-1 text-[12px]">{children}</code>,
                br: () => <br />,
              }}
            >
              {content}
            </Markdown>
          )}
        </div>

        {/* Source badge */}
        {!isUser && !isError && sources && sources.length > 0 && (
          <SourceBadge sources={sources} />
        )}

        {/* Retry button */}
        {isError && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-1 text-[11px] text-red-400/80 hover:text-red-300/90 hover:underline cursor-pointer self-start inline-flex items-center gap-1 transition-colors"
          >
            <ArrowClockwise className="w-3 h-3" />
            Retry
          </button>
        )}

        {/* Timestamp */}
        <span
          className={`text-[10px] text-white/45 mt-1 ${
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
