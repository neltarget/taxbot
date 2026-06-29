const SUGGESTION_CHIPS = [
  'How do I register for a TIN?',
  'What is the VAT rate in Ghana?',
  'When is the tax filing deadline?',
];

/**
 * WelcomeBanner — Displayed when the chat is empty.
 * Shows a greeting, description, and clickable suggestion chips
 * that pre-fill and immediately send a message.
 *
 * @param {{ onSuggestionClick: (text: string) => void, isLoading: boolean }} props
 */
export default function WelcomeBanner({ onSuggestionClick, isLoading }) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-12 fade-in">
      {/* Ghana flag emoji */}
      <span className="text-5xl mb-4" role="img" aria-label="Ghana flag">
        🇬🇭
      </span>

      <h1 className="text-xl font-semibold text-primary tracking-tight mb-2">
        Hello! I'm TaxBot
      </h1>

      <p className="text-sm text-text-muted max-w-xs mb-8 leading-relaxed">
        Your official Ghana Revenue Authority Tax Assistant.
        Ask me anything tax-related in Ghana.
      </p>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-6 w-full max-w-xs">
        <div className="flex-1 h-px bg-app-border" />
        <span className="text-xs text-text-muted whitespace-nowrap">Try asking…</span>
        <div className="flex-1 h-px bg-app-border" />
      </div>

      {/* Suggestion chips */}
      <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2">
        {SUGGESTION_CHIPS.map((chip) => (
          <button
            key={chip}
            type="button"
            disabled={isLoading}
            onClick={() => onSuggestionClick(chip)}
            className="border border-primary text-primary rounded-full px-4 py-2 text-sm
              hover:bg-green-50 transition-colors cursor-pointer
              focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  );
}
