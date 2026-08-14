import { useEffect, useRef } from 'react';
import { Plus, Trash, ChatCircleDots, X } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';

/**
 * Format a relative timestamp (e.g. "2m ago", "3h ago", "Yesterday").
 */
function relativeTime(isoString) {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(isoString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * HistoryPane — Slide-in sidebar showing past chat sessions.
 * Notion-inspired: warm minimal, soft surfaces, elegant spacing.
 */
export default function HistoryPane({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSwitch,
  onDelete,
  onNewChat,
}) {
  const paneRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Focus pane when opened
  useEffect(() => {
    if (isOpen && paneRef.current) {
      paneRef.current.focus();
    }
  }, [isOpen]);

  return (
    <>
      {/* Backdrop overlay — mobile only */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[2px] md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        ref={paneRef}
        tabIndex={-1}
        className={`flex flex-col shrink-0
          bg-white/[0.02] backdrop-blur-md border-r border-white/[0.05]
          transition-all duration-300 ease-out
          ${isOpen
            ? 'w-64 lg:w-72 opacity-100'
            : 'w-0 opacity-0 overflow-hidden border-0'
          }
          fixed inset-y-0 left-0 z-40 md:relative md:z-auto
        `}
        aria-label="Chat history"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
          <span className="text-[13px] font-medium text-white/60 tracking-wide uppercase">
            History
          </span>
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={onNewChat}
              className="h-7 w-7 rounded-md text-white/55 hover:text-white/75 hover:bg-white/[0.04]"
              aria-label="Start a new conversation"
              title="New chat"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-7 w-7 rounded-md text-white/55 hover:text-white/75 hover:bg-white/[0.04] md:hidden"
              aria-label="Close history"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto py-2 chat-scrollbar">
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center px-4">
              <ChatCircleDots className="w-7 h-7 text-white/25 mb-2" />
              <p className="text-[11px] text-white/50">No conversations yet</p>
            </div>
          ) : (
            <ul className="space-y-0.5 px-2" role="listbox" aria-label="Chat sessions">
              {sessions.map((session) => {
                const isActive = session.id === activeSessionId;
                const msgCount = session.messages.length;

                return (
                  <li key={session.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      onClick={() => onSwitch(session.id)}
                      className={`w-full text-left rounded-lg px-3 py-2 group transition-all duration-150 cursor-pointer
                        ${isActive
                          ? 'bg-white/[0.06] text-white/95 shadow-sm'
                          : 'text-white/65 hover:bg-white/[0.03] hover:text-white/80'
                        }
                      `}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className={`text-[13px] truncate leading-snug ${isActive ? 'font-medium' : ''}`}>
                            {session.title}
                          </p>
                          <p className="text-[10px] text-white/45 mt-0.5 tabular-nums">
                            {relativeTime(session.updatedAt)}{msgCount > 0 ? ` \u00B7 ${msgCount} msg${msgCount !== 1 ? 's' : ''}` : ''}
                          </p>
                        </div>

                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Delete this conversation?')) {
                              onDelete(session.id);
                            }
                          }}
                          className="shrink-0 mt-0.5 p-1 rounded-md text-white/25 hover:text-red-400/80 hover:bg-red-400/10
                            opacity-0 group-hover:opacity-100 transition-all duration-150 cursor-pointer"
                          aria-label={`Delete conversation: ${session.title}`}
                        >
                          <Trash className="w-3 h-3" />
                        </button>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-white/[0.04]">
          <p className="text-[10px] text-white/40 text-center">
            Saved locally on this device
          </p>
        </div>
      </aside>
    </>
  );
}
