import { useState, useCallback } from 'react';
import type { TenseKey, Direction, InputMode } from '../lib/types';
import { lsKey } from '../lib/storage';

function useLocalStorage<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  const namespacedKey = lsKey(key);
  const [state, setState] = useState<T>(() => {
    const stored = localStorage.getItem(namespacedKey);
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
      localStorage.setItem(namespacedKey, JSON.stringify(value));
    },
    [namespacedKey]
  );

  return [state, setValue];
}

export interface GateOverride {
  tier: number;
  mode: InputMode;
}

export function usePracticeSettings() {
  const [direction, setDirection] = useLocalStorage<Direction>('practiceDirection', 'en-fr');
  const [showInfinitive, setShowInfinitive] = useLocalStorage<boolean>('practiceShowInfinitive', true);
  const [tenses, setTenses] = useLocalStorage<TenseKey[]>('practiceTenses', ['present']);
  const [gateOverrides, setGateOverrides] = useLocalStorage<Partial<Record<TenseKey, GateOverride>>>('practiceGateOverrides', {});

  return {
    direction, setDirection,
    showInfinitive, setShowInfinitive,
    tenses, setTenses,
    gateOverrides, setGateOverrides,
  };
}

export function useListeningSettings() {
  const [categories, setCategories] = useLocalStorage<string[]>('listeningCategories', []);
  const [speed, setSpeed] = useLocalStorage<number>('listeningSpeed', 1);

  return { categories, setCategories, speed, setSpeed };
}
