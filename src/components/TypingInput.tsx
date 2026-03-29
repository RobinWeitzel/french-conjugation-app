import { useState, useRef, useCallback, useEffect } from 'react';
import { ACCENT_CHARS } from '../lib/constants';

interface TypingInputProps {
  onSubmit: (answer: string) => void;
  disabled: boolean;
}

export function TypingInput({ onSubmit, disabled }: TypingInputProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!disabled) {
      setValue('');
      // Small delay to let React render, then focus
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [disabled]);

  const handleAccent = useCallback((char: string) => {
    const input = inputRef.current;
    if (!input) return;
    const start = input.selectionStart ?? value.length;
    const end = input.selectionEnd ?? value.length;
    const newValue = value.slice(0, start) + char + value.slice(end);
    setValue(newValue);
    // Restore cursor after the inserted char
    requestAnimationFrame(() => {
      input.focus();
      input.setSelectionRange(start + 1, start + 1);
    });
  }, [value]);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (trimmed && !disabled) {
      onSubmit(trimmed);
    }
  }, [value, disabled, onSubmit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Type the conjugation..."
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-lg outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:focus:border-indigo-500 dark:focus:ring-indigo-500/20"
        />
        <button
          onClick={handleSubmit}
          disabled={disabled || !value.trim()}
          className="shrink-0 rounded-xl bg-indigo-500 px-5 py-3 font-semibold text-white transition-colors hover:bg-indigo-600 disabled:opacity-50"
        >
          Check
        </button>
      </div>
      <div className="flex flex-wrap justify-center gap-1.5">
        {ACCENT_CHARS.map((char) => (
          <button
            key={char}
            onClick={() => handleAccent(char)}
            disabled={disabled}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 active:bg-slate-200 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            {char}
          </button>
        ))}
      </div>
    </div>
  );
}
