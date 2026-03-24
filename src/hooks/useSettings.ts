import { useState, useCallback } from 'react';
import type { TenseKey, Direction } from '../lib/types';

function useLocalStorage<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  const [state, setState] = useState<T>(() => {
    const stored = localStorage.getItem(key);
    if (stored === null) return defaultValue;
    try {
      return JSON.parse(stored) as T;
    } catch {
      return stored as unknown as T;
    }
  });

  const setValue = useCallback(
    (value: T) => {
      setState(value);
      localStorage.setItem(key, JSON.stringify(value));
    },
    [key]
  );

  return [state, setValue];
}

export function usePracticeSettings() {
  const [direction, setDirection] = useLocalStorage<Direction>('practiceDirection', 'en-fr');
  const [showInfinitive, setShowInfinitive] = useLocalStorage<boolean>('practiceShowInfinitive', true);
  const [tenses, setTenses] = useLocalStorage<TenseKey[]>('practiceTenses', ['present']);

  return { direction, setDirection, showInfinitive, setShowInfinitive, tenses, setTenses };
}

export function useListeningSettings() {
  const [categories, setCategories] = useLocalStorage<string[]>('listeningCategories', []);
  const [speed, setSpeed] = useLocalStorage<number>('listeningSpeed', 1);

  return { categories, setCategories, speed, setSpeed };
}
