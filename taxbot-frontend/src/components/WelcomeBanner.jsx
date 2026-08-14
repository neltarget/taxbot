import { Button } from "@/components/ui/button";

const SUGGESTION_CHIPS = [
  'How do I register for a TIN?',
  'What is the VAT rate in Ghana?',
  'When is the tax filing deadline?',
];

/**
 * WelcomeBanner — Displayed when the chat is empty.
 * Notion-inspired: warm minimal, soft surfaces, elegant typography.
 */
export default function WelcomeBanner({ onSuggestionClick, isLoading }) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-20 animate-fade-in">
      {/* Logo mark with soft glow */}
      <div className="flex w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-400/70 to-emerald-400/70 items-center justify-center mb-5
        shadow-[0_4px_24px_rgba(6,182,212,0.12)]">
        <span className="text-lg font-bold text-white leading-none tracking-tight">GRA</span>
      </div>

      <h1 className="text-lg font-semibold text-white/95 tracking-tight mb-1.5">
        Hello! I'm TaxBot
      </h1>

      <p className="text-[13px] text-white/55 max-w-[260px] mb-8 leading-relaxed">
        Your official Ghana Revenue Authority Tax Assistant.
        Ask me anything tax-related in Ghana.
      </p>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-5 w-full max-w-[240px]">
        <div className="flex-1 h-px bg-white/[0.06]" />
        <span className="text-[10px] text-white/45 whitespace-nowrap uppercase tracking-widest">Try asking</span>
        <div className="flex-1 h-px bg-white/[0.06]" />
      </div>

      {/* Suggestion chips */}
      <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2">
        {SUGGESTION_CHIPS.map((chip) => (
          <Button
            key={chip}
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={() => onSuggestionClick(chip)}
              className="rounded-full px-4 py-1.5 text-[13px] h-auto font-normal cursor-pointer
              bg-white/[0.04] border-white/[0.08] text-white/65
              hover:bg-white/[0.07] hover:text-white/80 hover:border-white/[0.12]
              transition-all duration-200"
          >
            {chip}
          </Button>
        ))}
      </div>
    </div>
  );
}
