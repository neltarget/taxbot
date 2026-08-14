import { useState, useRef, useCallback, useEffect } from "react";
import { PaperPlaneRight } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const MAX_CHARS = 500;
const CHAR_WARNING_THRESHOLD = 480;
const MAX_ROWS = 4;
const LINE_HEIGHT_PX = 20;
const PADDING_PX = 20;
const MAX_HEIGHT_PX = MAX_ROWS * LINE_HEIGHT_PX + PADDING_PX;

/**
 * InputBar — Auto-resizing textarea with send button.
 * Notion-inspired: warm, soft surface, refined interactions.
 */
export default function InputBar({ onSend, isLoading }) {
  const [value, setValue] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const trimmedLength = value.trim().length;
  const isEmpty = trimmedLength === 0;
  const isOverLimit = value.length > MAX_CHARS;
  const isDisabled = isLoading || isEmpty || isOverLimit;

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, MAX_HEIGHT_PX)}px`;
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || isLoading || trimmed.length > MAX_CHARS) return;

    onSend(trimmed);
    setValue('');

    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.focus();
      }
    });
  }, [value, isLoading, onSend]);

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
      className="bg-white/[0.02] backdrop-blur-md border-t border-white/[0.04] shrink-0"
      style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-end gap-3">
        {/* Textarea wrapper */}
        <div className="relative flex-1">
          <Textarea
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
            className={`resize-none rounded-xl pr-20 textarea-scrollbar
              bg-white/[0.04] border-white/[0.06] text-white/95 placeholder:text-white/40
              focus-visible:ring-amber-500/20 focus-visible:border-amber-500/20
              ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
              ${isOverLimit ? 'border-red-400/40 focus-visible:ring-red-400/20' : ''}
            `}
            style={{ maxHeight: `${MAX_HEIGHT_PX}px` }}
          />

          {/* Character counter */}
          {value.length > 0 && (
            <span
              className={`absolute bottom-2.5 right-3 text-[10px] select-none tabular-nums ${
                value.length > CHAR_WARNING_THRESHOLD
                  ? 'text-red-400/80'
                  : 'text-white/45'
              }`}
              aria-live="polite"
            >
              {value.length} / {MAX_CHARS}
            </span>
          )}
        </div>

        {/* Send button */}
        <Button
          size="icon"
          onClick={handleSend}
          disabled={isDisabled}
          aria-label="Send message"
          className={`h-9 w-9 rounded-xl shrink-0 transition-all duration-200 ${
            isDisabled
              ? 'opacity-25 cursor-not-allowed bg-white/[0.04]'
               : 'cursor-pointer bg-gradient-to-br from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 shadow-[0_2px_12px_rgba(196,146,42,0.2)] hover:shadow-[0_2px_16px_rgba(196,146,42,0.3)]'
          }`}
        >
          {isLoading ? (
            <svg
              className="h-4 w-4 animate-spin text-white"
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
            <PaperPlaneRight className="h-4 w-4 text-white" weight="fill" />
          )}
        </Button>
      </div>
    </div>
  );
}
