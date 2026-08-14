/**
 * TypingIndicator — Three staggered bouncing dots.
 * Notion-inspired: subtle, warm, refined.
 */
export default function TypingIndicator() {
  return (
    <div className="flex justify-start items-end gap-2.5 animate-fade-in" role="status" aria-label="TaxBot is typing a response">
      {/* Avatar */}
      <div
        className="flex w-6 h-6 rounded-md bg-gradient-to-br from-cyan-400/60 to-emerald-400/60 items-center justify-center shrink-0
          shadow-[0_1px_4px_rgba(6,182,212,0.1)]"
        aria-hidden="true"
      >
        <span className="text-[9px] font-bold text-white leading-none">GRA</span>
      </div>

      <div className="flex flex-col">
        {/* Dots container */}
        <div className="rounded-2xl px-4 py-2.5 bg-white/[0.03] border border-white/[0.04] flex items-center gap-1">
          <span className="animate-dot-bounce w-1.5 h-1.5 rounded-full bg-cyan-400/50 inline-block" style={{ animationDelay: '0ms' }} />
          <span className="animate-dot-bounce w-1.5 h-1.5 rounded-full bg-cyan-400/50 inline-block" style={{ animationDelay: '150ms' }} />
          <span className="animate-dot-bounce w-1.5 h-1.5 rounded-full bg-cyan-400/50 inline-block" style={{ animationDelay: '300ms' }} />
        </div>

        {/* Label */}
        <span className="text-[10px] text-white/45 mt-1 italic">
          TaxBot is thinking...
        </span>
      </div>
    </div>
  );
}
