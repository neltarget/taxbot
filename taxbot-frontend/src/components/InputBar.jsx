import { useState, useRef, useCallback, useEffect } from 'react';

const MAX_CHARS = 500;
const CHAR_WARNING_THRESHOLD = 480;
const MAX_ROWS = 4;
const LINE_HEIGHT_PX = 20;
const PADDING_PX = 20;
const MAX_HEIGHT_PX = MAX_ROWS * LINE_HEIGHT_PX + PADDING_PX;

/**
 * InputBar — Auto-resizing textarea with send button, character counter,
 * and keyboard controls (Enter to send, Shift+Enter for newline).
 *
 * @param {{ onSend: (text: string) => void, isLoading: boolean }} props
 */
export default function InputBar({ onSend, isLoading }) {
  const [value, setValue] = useState('');
  const textareaRef = useRef(null);

  // Auto-focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const trimmedLength = value.trim().length;
  const isEmpty = trimmedLength === 0;
  const isOverLimit = value.length > MAX_CHARS;
  const isDisabled = isLoading || isEmpty || isOverLimit;

  /**
   * Recalculate textarea height to fit content, capped at MAX_ROWS.
   */
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, MAX_HEIGHT_PX)}px`;
  }, []);

  /**
   * Send the current input and reset the textarea.
   */
  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || isLoading || trimmed.length > MAX_CHARS) return;

    onSend(trimmed);
    setValue('');

    // Reset height after clearing.
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.focus();
      }
    });
  }, [value, isLoading, onSend]);

  /**
   * Handle keyboard: Enter sends, Shift+Enter inserts newline.
   *
   * @param {React.KeyboardEvent<HTMLTextAreaElement>} event
   */
  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <div
      className="bg-surface border-t border-app-border shrink-0"
      style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-end gap-3">
        {/* Textarea wrapper with character counter */}
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              adjustHeight();
            }}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Ask me anything about taxes in Ghana..."
            rows={1}
            aria-label="Type your tax question"
            className={`w-full resize-none rounded-2xl border border-app-border
              px-4 py-2.5 pr-20 text-sm leading-5
              focus:outline-none focus:ring-2 focus:ring-primary transition-all
              textarea-scrollbar
              ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}
              ${isOverLimit ? 'border-red-400 focus:ring-red-400' : ''}`}
            style={{ maxHeight: `${MAX_HEIGHT_PX}px` }}
          />

          {/* Character counter — visible only when typing */}
          {value.length > 0 && (
            <span
              className={`absolute bottom-2 right-3 text-[10px] select-none ${
                value.length > CHAR_WARNING_THRESHOLD
                  ? 'text-error-text'
                  : 'text-text-muted'
              }`}
              aria-live="polite"
            >
              {value.length} / {MAX_CHARS}
            </span>
          )}
        </div>

        {/* Send button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={isDisabled}
          aria-label="Send message"
          className={`w-10 h-10 rounded-full bg-primary text-white
            flex items-center justify-center shrink-0
            transition-colors
            ${isDisabled
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:bg-green-900 cursor-pointer'
            }
            focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`}
        >
          {isLoading ? (
            /* Spinner */
            <svg
              className="w-5 h-5 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12" cy="12" r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          ) : (
            /* Arrow icon */
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 5l7 7-7 7M5 12h14"
              />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
