/**
 * TypingIndicator — Three staggered bouncing dots shown
 * while TaxBot is processing a response.
 */
export default function TypingIndicator() {
  return (
    <div className="flex justify-start items-end gap-2 fade-in" role="status" aria-label="TaxBot is typing a response">
      {/* Avatar */}
      <div
        className="flex w-5 h-5 xs:w-7 xs:h-7 rounded-full bg-accent text-white items-center justify-center shrink-0"
        aria-hidden="true"
      >
        <span className="text-[8px] xs:text-[10px] font-bold leading-none">GRA</span>
      </div>

      <div className="flex flex-col">
        {/* Dots container */}
        <div className="rounded-2xl px-4 py-3 bg-bot-bubble flex items-center gap-1">
          <span className="typing-dot w-2 h-2 rounded-full bg-primary inline-block" />
          <span className="typing-dot w-2 h-2 rounded-full bg-primary inline-block" />
          <span className="typing-dot w-2 h-2 rounded-full bg-primary inline-block" />
        </div>

        {/* Label */}
        <span className="text-xs text-text-muted mt-1 italic">
          TaxBot is thinking…
        </span>
      </div>
    </div>
  );
}
