import { ChatCircleDots, Plus, List } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

/**
 * Header — Top bar with GRA branding, history toggle, status indicator, and new-chat action.
 * Notion-inspired: warm minimal, soft surface, refined spacing.
 */
export default function Header({ isLoading, clearChat, isHistoryOpen, toggleHistory }) {
  const handleClear = () => {
    clearChat();
  };

  const handleLogoClick = () => {
    clearChat();
  };

  return (
    <header className="h-14 md:h-15 shrink-0 z-10 flex items-center justify-between px-4 md:px-5
      bg-white/[0.02] backdrop-blur-md border-b border-white/[0.05]">
      {/* Left — Logo + branding (clickable — goes to start page) */}
      <button
        type="button"
        onClick={handleLogoClick}
        className="flex items-center gap-2.5 cursor-pointer group rounded-lg p-1 -ml-1 hover:bg-white/[0.04] transition-colors"
        aria-label="Go to start page — new conversation"
      >
        <div className="flex w-7 h-7 rounded-md bg-gradient-to-br from-amber-500/80 to-yellow-600/80 items-center justify-center shrink-0
          shadow-[0_2px_8px_rgba(196,146,42,0.15)] group-hover:shadow-[0_2px_12px_rgba(196,146,42,0.25)] transition-shadow">
          <ChatCircleDots className="w-3.5 h-3.5 text-white" weight="fill" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="font-semibold text-white/95 tracking-tight text-sm">
            TaxBot
          </span>
          <span className="text-[10px] text-white/55 hidden sm:block tracking-wide">
            Ghana Revenue Authority
          </span>
        </div>
      </button>

      {/* Right — Status + actions */}
      <div className="flex items-center gap-1.5">
        {/* Status indicator */}
        <div className="flex items-center gap-1.5 mr-1.5 px-2 py-1 rounded-full bg-white/[0.03]" aria-live="polite">
          <span
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              isLoading
                ? 'bg-amber-400 animate-pulse'
                : 'bg-amber-500 shadow-[0_0_4px_rgba(196,146,42,0.3)]'
            }`}
          />
          <span className="text-[11px] text-white/50 hidden sm:inline tabular-nums">
            {isLoading ? 'Thinking...' : 'Online'}
          </span>
        </div>

        {/* History toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleHistory}
          className={`h-8 w-8 rounded-lg transition-all duration-200 ${
            isHistoryOpen
              ? 'text-white/80 bg-white/[0.06]'
              : 'text-white/55 hover:text-white/75 hover:bg-white/[0.04]'
          }`}
          aria-label={isHistoryOpen ? 'Close chat history' : 'Open chat history'}
          title="Chat history"
        >
          <List className="h-3.5 w-3.5" weight={isHistoryOpen ? 'fill' : 'regular'} />
        </Button>

        {/* New chat button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClear}
          className="h-8 w-8 rounded-lg text-white/55 hover:text-white/75 hover:bg-white/[0.04] transition-all duration-200"
          aria-label="Start a new conversation"
          title="New conversation"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </header>
  );
}
