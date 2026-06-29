/**
 * Header — Top bar with GRA branding, status indicator, and clear-chat action.
 *
 * @param {{ isLoading: boolean, clearChat: () => void }} props
 */
export default function Header({ isLoading, clearChat }) {
  const handleClear = () => {
    if (window.confirm('Clear the entire conversation? This cannot be undone.')) {
      clearChat();
    }
  };

  return (
    <header className="h-16 bg-surface border-b border-app-border flex items-center justify-between px-4 md:px-6 shrink-0 z-10">
      {/* Left — Logo + branding */}
      <div className="flex items-center gap-3">
        <img
          src="/gra-logo.png"
          alt="Ghana Revenue Authority logo"
          className="w-8 h-8 rounded-sm object-contain"
        />
        <div className="flex flex-col leading-tight">
          <span className="font-semibold text-primary tracking-tight text-sm sm:text-base">
            TaxBot
          </span>
          <span className="text-[11px] text-text-muted hidden sm:block">
            Ghana Revenue Authority
          </span>
        </div>
      </div>

      {/* Right — Status + Clear chat */}
      <div className="flex items-center gap-4">
        {/* Status indicator */}
        <div className="flex items-center gap-1.5" aria-live="polite">
          <span
            className={`w-2 h-2 rounded-full ${
              isLoading
                ? 'bg-amber-400 animate-pulse'
                : 'bg-emerald-500'
            }`}
          />
          <span className="text-xs text-text-muted hidden sm:inline">
            {isLoading ? 'Responding...' : 'Online'}
          </span>
        </div>

        {/* Clear chat button */}
        <button
          onClick={handleClear}
          className="group relative p-2 rounded-lg text-text-muted hover:text-primary hover:bg-green-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-label="Clear chat — start a new conversation"
          title="Start a new conversation"
        >
          {/* New chat icon — chat bubble + plus */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6m3-3H9"
            />
          </svg>
        </button>
      </div>
    </header>
  );
}
