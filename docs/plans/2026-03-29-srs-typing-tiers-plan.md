# SRS, Typed Input, Conjugation Table, Verb Tiers — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace simple mastery with Leitner spaced repetition, add a typing practice mode with accent buttons, show full conjugation tables on the answer side, and organize verbs into progressive tiers.

**Architecture:** All 4 features modify the practice flow. We build bottom-up: types/constants first, then DB migration, then hooks, then components, then pages. The Stat schema gains `box` and `nextReview` fields (Leitner). A new `InputMode` type controls flashcard vs. typing. A `ConjugationTable` component renders the full paradigm. Verb tiers are constant arrays in `constants.ts` with unlock logic computed from stats.

**Tech Stack:** React 19, TypeScript, Dexie 4 (IndexedDB), Tailwind CSS 4, Framer Motion

---

### Task 1: Update Types and Constants

**Files:**
- Modify: `src/lib/types.ts`
- Modify: `src/lib/constants.ts`

**Step 1: Add new types to `src/lib/types.ts`**

Add `InputMode` type:
```typescript
export type InputMode = 'flashcard' | 'typing';
```

Update `Stat` interface — replace `mastered: boolean` with SRS fields:
```typescript
export interface Stat {
  id: string;
  correctCount: number;
  box: number;          // 1-5 Leitner box
  nextReview: string;   // ISO date string "YYYY-MM-DD"
  lastPracticed: string;
}
```

Add `VerbTier` interface:
```typescript
export interface VerbTier {
  id: number;
  name: string;
  description: string;
  verbs: string[];  // infinitives
}
```

**Step 2: Add SRS constants and tier data to `src/lib/constants.ts`**

Add box intervals:
```typescript
export const BOX_INTERVALS: Record<number, number> = {
  1: 0,   // review now
  2: 1,   // 1 day
  3: 3,   // 3 days
  4: 7,   // 7 days
  5: 30,  // 30 days
};

export const MAX_BOX = 5;
export const TIER_UNLOCK_THRESHOLD = 0.7; // 70%
export const TIER_UNLOCK_MIN_BOX = 3;
```

Add accent characters:
```typescript
export const ACCENT_CHARS = ['é', 'è', 'ê', 'ë', 'à', 'â', 'ù', 'û', 'ü', 'ï', 'î', 'ô', 'ç', 'æ', 'œ'] as const;
```

Add verb tiers:
```typescript
export const VERB_TIERS: VerbTier[] = [
  {
    id: 1,
    name: 'Essential',
    description: 'Most common verbs',
    verbs: ['être', 'avoir', 'aller', 'faire', 'pouvoir', 'vouloir', 'devoir', 'savoir', 'prendre', 'venir', 'dire', 'voir', 'falloir', 'donner', 'mettre'],
  },
  {
    id: 2,
    name: 'Common -er',
    description: 'Regular -er pattern verbs',
    verbs: ['parler', 'trouver', 'passer', 'demander', 'montrer', 'continuer', 'rester', 'porter', 'commencer', 'compter', 'penser', 'arriver', 'laisser', 'jouer', 'aimer', 'chercher', 'travailler', 'essayer', 'changer', 'créer', 'entrer', 'préparer', 'utiliser', 'proposer', 'apporter'],
  },
  {
    id: 3,
    name: '-ir/-re & Irregulars',
    description: 'Regular -ir/-re and common irregulars',
    verbs: ['partir', 'sortir', 'servir', 'agir', 'réussir', 'choisir', 'rendre', 'répondre', 'attendre', 'perdre', 'défendre', 'suivre', 'vivre', 'lire', 'écrire', 'ouvrir', 'produire', 'atteindre', 'connaître', 'croire'],
  },
  {
    id: 4,
    name: 'Advanced',
    description: 'Less common and remaining verbs',
    verbs: [], // Will be computed: all verbs not in tiers 1-3
  },
];
```

**Step 3: Verify build**

Run: `cd /Users/robinweitzel/Documents/Code/french-conjugation-app && npx tsc --noEmit`
Expected: No errors (or only pre-existing ones)

**Step 4: Commit**
```
feat: add SRS types, tier constants, and accent characters
```

---

### Task 2: Database Migration

**Files:**
- Modify: `src/lib/db.ts`

**Step 1: Add Dexie version 2 with migration**

The DB needs to migrate existing stats. Add version 2 that:
- Adds `box` and `nextReview` indexes to stats store
- Migrates existing data: `mastered: true` → box 5 + nextReview 30 days from lastPracticed; `mastered: false` → box 1 + nextReview today

```typescript
import Dexie, { type EntityTable } from 'dexie';
import type { Verb, Sentence, Stat, Metadata } from './types';

const db = new Dexie('FrenchPracticeDB') as Dexie & {
  verbs: EntityTable<Verb, 'infinitive'>;
  sentences: EntityTable<Sentence, 'id'>;
  stats: EntityTable<Stat, 'id'>;
  metadata: EntityTable<Metadata, 'key'>;
};

db.version(1).stores({
  verbs: 'infinitive',
  sentences: 'id, category',
  stats: 'id',
  metadata: 'key',
});

db.version(2).stores({
  verbs: 'infinitive',
  sentences: 'id, category',
  stats: 'id, nextReview',
  metadata: 'key',
}).upgrade(async (tx) => {
  const today = new Date().toISOString().split('T')[0]!;
  await tx.table('stats').toCollection().modify((stat: Record<string, unknown>) => {
    if (stat.mastered) {
      stat.box = 5;
      const last = typeof stat.lastPracticed === 'string' && stat.lastPracticed
        ? new Date(stat.lastPracticed)
        : new Date();
      last.setDate(last.getDate() + 30);
      stat.nextReview = last.toISOString().split('T')[0]!;
    } else {
      stat.box = 1;
      stat.nextReview = today;
    }
    delete stat.mastered;
  });
});

export { db };
```

**Step 2: Verify build**

Run: `cd /Users/robinweitzel/Documents/Code/french-conjugation-app && npx tsc --noEmit`

**Step 3: Commit**
```
feat: add DB migration for Leitner box SRS fields
```

---

### Task 3: Rewrite useMastery Hook for SRS

**Files:**
- Modify: `src/hooks/useMastery.ts`

**Step 1: Rewrite with Leitner box logic**

Replace the entire file:

```typescript
import { useState, useCallback } from 'react';
import { db } from '../lib/db';
import { BOX_INTERVALS, MAX_BOX } from '../lib/constants';
import type { Stat, SessionStats } from '../lib/types';

function getToday(): string {
  return new Date().toISOString().split('T')[0]!;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0]!;
}

export function useMastery() {
  const [sessionStats, setSessionStats] = useState<SessionStats>({ correct: 0, incorrect: 0 });

  const getStat = useCallback(async (id: string): Promise<Stat> => {
    const stat = await db.stats.get(id);
    return stat ?? { id, correctCount: 0, box: 1, nextReview: getToday(), lastPracticed: '' };
  }, []);

  const recordCorrect = useCallback(async (id: string): Promise<boolean> => {
    const stat = await getStat(id);
    const today = getToday();
    const newBox = Math.min(stat.box + 1, MAX_BOX);
    const interval = BOX_INTERVALS[newBox] ?? 30;
    await db.stats.put({
      id,
      correctCount: stat.correctCount + 1,
      box: newBox,
      nextReview: addDays(today, interval),
      lastPracticed: new Date().toISOString(),
    });
    setSessionStats((s) => ({ ...s, correct: s.correct + 1 }));
    // "removed from session" when moved to box 2+ (has future review date)
    return interval > 0;
  }, [getStat]);

  const recordIncorrect = useCallback(async (id: string) => {
    const today = getToday();
    await db.stats.put({
      id,
      correctCount: 0,
      box: 1,
      nextReview: today,
      lastPracticed: new Date().toISOString(),
    });
    setSessionStats((s) => ({ ...s, incorrect: s.incorrect + 1 }));
  }, []);

  const isDue = useCallback(async (id: string): Promise<boolean> => {
    const stat = await db.stats.get(id);
    if (!stat) return true; // new card
    return stat.nextReview <= getToday();
  }, []);

  const resetStats = useCallback(async (prefix?: string) => {
    if (prefix) {
      const stats = await db.stats.where('id').startsWith(prefix).toArray();
      await db.stats.bulkDelete(stats.map((s) => s.id));
    } else {
      await db.stats.clear();
    }
    setSessionStats({ correct: 0, incorrect: 0 });
  }, []);

  const resetSession = useCallback(() => {
    setSessionStats({ correct: 0, incorrect: 0 });
  }, []);

  return { sessionStats, recordCorrect, recordIncorrect, isDue, resetStats, resetSession };
}
```

Note: `recordCorrect` now returns `true` when the card should be removed from the current session (moved to a box with a future review date). Previously it returned `true` when mastered.

**Step 2: Verify build**

Run: `cd /Users/robinweitzel/Documents/Code/french-conjugation-app && npx tsc --noEmit`

**Step 3: Commit**
```
feat: rewrite useMastery with Leitner 5-box spaced repetition
```

---

### Task 4: Add Input Mode and Tier Settings

**Files:**
- Modify: `src/hooks/useSettings.ts`

**Step 1: Add inputMode and tiers to usePracticeSettings**

Add two new settings:
```typescript
import type { TenseKey, Direction, InputMode } from '../lib/types';

export function usePracticeSettings() {
  const [direction, setDirection] = useLocalStorage<Direction>('practiceDirection', 'en-fr');
  const [showInfinitive, setShowInfinitive] = useLocalStorage<boolean>('practiceShowInfinitive', true);
  const [tenses, setTenses] = useLocalStorage<TenseKey[]>('practiceTenses', ['present']);
  const [inputMode, setInputMode] = useLocalStorage<InputMode>('practiceInputMode', 'flashcard');
  const [tiers, setTiers] = useLocalStorage<number[]>('practiceTiers', [1]);

  return {
    direction, setDirection,
    showInfinitive, setShowInfinitive,
    tenses, setTenses,
    inputMode, setInputMode,
    tiers, setTiers,
  };
}
```

**Step 2: Verify build**

Run: `cd /Users/robinweitzel/Documents/Code/french-conjugation-app && npx tsc --noEmit`

**Step 3: Commit**
```
feat: add inputMode and tiers to practice settings
```

---

### Task 5: Create ConjugationTable Component

**Files:**
- Create: `src/components/ConjugationTable.tsx`

**Step 1: Build the component**

```typescript
import type { TenseConjugations, Pronoun } from '../lib/types';
import { PRONOUNS } from '../lib/constants';

interface ConjugationTableProps {
  tenseData: TenseConjugations;
  highlightPronoun: Pronoun;
}

const LEFT_PRONOUNS: Pronoun[] = ['je', 'tu', 'il'];
const RIGHT_PRONOUNS: Pronoun[] = ['nous', 'vous', 'ils'];

export function ConjugationTable({ tenseData, highlightPronoun }: ConjugationTableProps) {
  const rows = LEFT_PRONOUNS.map((lp, i) => ({
    left: { pronoun: lp, data: tenseData[lp] },
    right: { pronoun: RIGHT_PRONOUNS[i]!, data: tenseData[RIGHT_PRONOUNS[i]!] },
  }));

  return (
    <div className="mt-4 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-800/50">
      <table className="w-full">
        <tbody>
          {rows.map(({ left, right }) => (
            <tr key={left.pronoun}>
              <Cell pronoun={left.pronoun} french={left.data?.french ?? null} highlight={left.pronoun === highlightPronoun} />
              <td className="w-4" />
              <Cell pronoun={right.pronoun} french={right.data?.french ?? null} highlight={right.pronoun === highlightPronoun} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Cell({ pronoun, french, highlight }: { pronoun: string; french: string | null; highlight: boolean }) {
  if (french === null) return <td colSpan={2} />;
  return (
    <>
      <td className={`py-1 pr-2 text-right font-medium ${highlight ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>
        {pronoun}
      </td>
      <td className={`py-1 ${highlight ? 'font-semibold text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>
        {french}
      </td>
    </>
  );
}
```

**Step 2: Verify build**

Run: `cd /Users/robinweitzel/Documents/Code/french-conjugation-app && npx tsc --noEmit`

**Step 3: Commit**
```
feat: add ConjugationTable component for full tense paradigm
```

---

### Task 6: Create TypingInput Component

**Files:**
- Create: `src/components/TypingInput.tsx`

**Step 1: Build the typing input with accent bar**

```typescript
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
          className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-lg outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:focus:border-indigo-500 dark:focus:ring-indigo-500/20"
        />
        <button
          onClick={handleSubmit}
          disabled={disabled || !value.trim()}
          className="rounded-xl bg-indigo-500 px-5 py-3 font-semibold text-white transition-colors hover:bg-indigo-600 disabled:opacity-50"
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
```

**Step 2: Verify build**

Run: `cd /Users/robinweitzel/Documents/Code/french-conjugation-app && npx tsc --noEmit`

**Step 3: Commit**
```
feat: add TypingInput component with accent character bar
```

---

### Task 7: Rewrite Practice Page

**Files:**
- Modify: `src/pages/Practice.tsx`

This is the largest task. The Practice page needs to:
1. Filter cards by selected tiers
2. Use SRS due-date logic instead of `mastered` boolean
3. Support both flashcard and typing input modes
4. Show conjugation table on the answer/back side
5. Show "All caught up" when no cards are due but future reviews exist

**Step 1: Rewrite `src/pages/Practice.tsx`**

```typescript
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { PageLayout } from '../components/PageLayout';
import { Navigation } from '../components/Navigation';
import { Flashcard, useFlipState } from '../components/Flashcard';
import { SwipeContainer, type SwipeContainerHandle } from '../components/SwipeContainer';
import { StatsBar } from '../components/StatsBar';
import { ConjugationTable } from '../components/ConjugationTable';
import { TypingInput } from '../components/TypingInput';
import { useMastery } from '../hooks/useMastery';
import { usePracticeSettings } from '../hooks/useSettings';
import { useVerbs } from '../hooks/useDatabase';
import { TENSES, PRONOUNS, VERB_TIERS } from '../lib/constants';
import type { PracticeCard, TenseConjugations } from '../lib/types';
import { db } from '../lib/db';

// Get the set of verb infinitives for given tier IDs
function getVerbsForTiers(tierIds: number[], allVerbs: string[]): Set<string> {
  const tieredVerbs = new Set<string>();
  for (const tier of VERB_TIERS) {
    if (!tierIds.includes(tier.id)) continue;
    if (tier.verbs.length === 0) {
      // Tier 4 (empty verbs array) = all verbs not in other tiers
      const otherTierVerbs = new Set(VERB_TIERS.filter((t) => t.verbs.length > 0).flatMap((t) => t.verbs));
      for (const v of allVerbs) {
        if (!otherTierVerbs.has(v)) tieredVerbs.add(v);
      }
    } else {
      for (const v of tier.verbs) tieredVerbs.add(v);
    }
  }
  return tieredVerbs;
}

function normalizeAnswer(s: string): string {
  return s.trim().toLowerCase().replace(/^j'/, 'j\'');
}

export function Practice() {
  const verbs = useVerbs();
  const { direction, showInfinitive, tenses, inputMode, tiers } = usePracticeSettings();
  const { sessionStats, recordCorrect, recordIncorrect, resetStats, resetSession } = useMastery();
  const { flipped, flip, reset: resetFlip } = useFlipState();
  const swipeRef = useRef<SwipeContainerHandle>(null);

  const [cards, setCards] = useState<PracticeCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasScheduledCards, setHasScheduledCards] = useState(false);
  const [nextReviewDate, setNextReviewDate] = useState<string | null>(null);

  // Typing mode state
  const [typingResult, setTypingResult] = useState<'correct' | 'incorrect' | null>(null);

  // Build card pool
  useEffect(() => {
    if (!verbs) return;

    const buildCards = async () => {
      const allCards: PracticeCard[] = [];
      const today = new Date().toISOString().split('T')[0]!;
      const allowedVerbs = getVerbsForTiers(tiers, verbs.map((v) => v.infinitive));
      let earliestFuture: string | null = null;

      for (const verb of verbs) {
        if (!allowedVerbs.has(verb.infinitive)) continue;

        for (const tense of tenses) {
          const tenseData = verb.tenses[tense];
          if (!tenseData) continue;

          for (const pronoun of PRONOUNS) {
            const conjugation = tenseData[pronoun];
            if (!conjugation) continue;

            const statId = `${verb.infinitive}_${pronoun}_${tense}`;
            const stat = await db.stats.get(statId);

            if (stat && stat.nextReview > today) {
              // Card has a future review date — not due yet
              if (!earliestFuture || stat.nextReview < earliestFuture) {
                earliestFuture = stat.nextReview;
              }
              continue;
            }

            allCards.push({
              infinitive: verb.infinitive,
              english: verb.english,
              tense,
              pronoun,
              french: conjugation.french,
              englishConjugation: conjugation.english,
              statId,
            });
          }
        }
      }

      // Shuffle
      for (let i = allCards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = allCards[i]!;
        allCards[i] = allCards[j]!;
        allCards[j] = temp;
      }

      setCards(allCards);
      setCurrentIndex(0);
      setHasScheduledCards(earliestFuture !== null);
      setNextReviewDate(earliestFuture);
      setLoading(false);
    };

    buildCards();
  }, [verbs, tenses, tiers]);

  const currentCard = cards[currentIndex];
  const allDone = !loading && cards.length === 0;

  // Get tense data for conjugation table
  const currentTenseData: TenseConjugations | null = useMemo(() => {
    if (!currentCard || !verbs) return null;
    const verb = verbs.find((v) => v.infinitive === currentCard.infinitive);
    return verb?.tenses[currentCard.tense] ?? null;
  }, [currentCard, verbs]);

  const nextCard = useCallback(() => {
    resetFlip();
    setTypingResult(null);
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setCards((prev) => prev.filter((_, i) => i > currentIndex));
      setCurrentIndex(0);
    }
  }, [currentIndex, cards.length, resetFlip]);

  const handleSwipeRight = useCallback(async () => {
    if (!currentCard) return;
    const removed = await recordCorrect(currentCard.statId);
    if (removed) {
      setCards((prev) => prev.filter((c) => c.statId !== currentCard.statId));
      resetFlip();
      setTypingResult(null);
    } else {
      nextCard();
    }
  }, [currentCard, recordCorrect, nextCard, resetFlip]);

  const handleSwipeLeft = useCallback(async () => {
    if (!currentCard) return;
    await recordIncorrect(currentCard.statId);
    nextCard();
  }, [currentCard, recordIncorrect, nextCard]);

  // Typing mode: check answer
  const handleTypingSubmit = useCallback((answer: string) => {
    if (!currentCard) return;
    const correct = normalizeAnswer(answer) === normalizeAnswer(currentCard.french);
    setTypingResult(correct ? 'correct' : 'incorrect');
    // Flip the card to show the answer
    if (!flipped) flip();
  }, [currentCard, flipped, flip]);

  // After typing result is shown, Enter or tap advances
  const handleTypingAdvance = useCallback(async () => {
    if (!typingResult || !currentCard) return;
    if (typingResult === 'correct') {
      await handleSwipeRight();
    } else {
      await handleSwipeLeft();
    }
  }, [typingResult, currentCard, handleSwipeRight, handleSwipeLeft]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (inputMode === 'typing') {
        // In typing mode, Enter after result advances
        if (e.key === 'Enter' && typingResult) {
          e.preventDefault();
          handleTypingAdvance();
        }
        return;
      }
      // Flashcard mode shortcuts
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        flip();
      } else if (e.key === 'ArrowRight' && flipped) {
        swipeRef.current?.swipe('right');
      } else if (e.key === 'ArrowLeft' && flipped) {
        swipeRef.current?.swipe('left');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [flip, flipped, inputMode, typingResult, handleTypingAdvance]);

  const handleReset = async () => {
    await resetStats();
    resetSession();
    setLoading(true);
    window.location.reload();
  };

  const totalCards = useMemo(() => {
    if (!verbs) return 0;
    const allowedVerbs = getVerbsForTiers(tiers, verbs.map((v) => v.infinitive));
    let count = 0;
    for (const verb of verbs) {
      if (!allowedVerbs.has(verb.infinitive)) continue;
      for (const tense of tenses) {
        const tenseData = verb.tenses[tense];
        if (!tenseData) continue;
        for (const pronoun of PRONOUNS) {
          if (tenseData[pronoun]) count++;
        }
      }
    }
    return count;
  }, [verbs, tenses, tiers]);

  // Format next review date for display
  const nextReviewLabel = useMemo(() => {
    if (!nextReviewDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const review = new Date(nextReviewDate + 'T00:00:00');
    const diffDays = Math.round((review.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return 'today';
    if (diffDays === 1) return 'tomorrow';
    return `in ${diffDays} days`;
  }, [nextReviewDate]);

  if (loading) {
    return (
      <PageLayout>
        <Navigation title="Practice" />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-slate-500 dark:text-slate-400">Loading...</p>
        </div>
      </PageLayout>
    );
  }

  if (allDone) {
    return (
      <PageLayout>
        <Navigation title="Practice" />
        <div className="flex flex-1 flex-col items-center justify-center gap-6">
          <div className="text-center">
            <p className="text-4xl">{hasScheduledCards ? '✅' : '🎉'}</p>
            <h2 className="mt-4 text-xl font-semibold">
              {hasScheduledCards ? 'All caught up!' : 'All mastered!'}
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {hasScheduledCards
                ? `Next review ${nextReviewLabel}. Come back then to keep your streak!`
                : 'You\'ve mastered all cards in the selected tenses.'}
            </p>
          </div>
          <button
            onClick={handleReset}
            className="rounded-xl bg-indigo-500 px-8 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-indigo-600"
          >
            Reset &amp; Practice Again
          </button>
        </div>
        <StatsBar stats={sessionStats} remaining={0} total={totalCards} />
      </PageLayout>
    );
  }

  // Back of card content (shared between flashcard and typing modes)
  const backContent = currentCard && (
    <div className="text-center">
      {typingResult && (
        <p className={`mb-2 text-sm font-semibold ${typingResult === 'correct' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
          {typingResult === 'correct' ? 'Correct!' : 'Incorrect'}
        </p>
      )}
      <p className="text-xs text-slate-400 dark:text-slate-500">{TENSES[currentCard.tense]}</p>
      <p className="mt-4 text-2xl font-semibold">
        {direction === 'en-fr'
          ? `${currentCard.pronoun} ${currentCard.french}`
          : currentCard.englishConjugation}
      </p>
      {currentTenseData && (
        <ConjugationTable tenseData={currentTenseData} highlightPronoun={currentCard.pronoun} />
      )}
      {inputMode === 'flashcard' && (
        <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
          Swipe right if correct, left if not
        </p>
      )}
      {inputMode === 'typing' && (
        <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
          Press Enter to continue
        </p>
      )}
    </div>
  );

  return (
    <PageLayout>
      <Navigation
        title="Practice"
        rightElement={
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {cards.length} left
          </span>
        }
      />

      <div className="flex flex-1 flex-col justify-center gap-6 py-4">
        {currentCard && (
          <>
            {inputMode === 'flashcard' ? (
              <SwipeContainer
                ref={swipeRef}
                enabled={flipped}
                onSwipeRight={handleSwipeRight}
                onSwipeLeft={handleSwipeLeft}
                cardKey={currentCard.statId}
              >
                <Flashcard
                  flipped={flipped}
                  onFlip={flip}
                  front={
                    <div className="text-center">
                      {showInfinitive && (
                        <p className="mb-2 text-xs font-medium text-slate-400 dark:text-slate-500">
                          {currentCard.infinitive} ({currentCard.english})
                        </p>
                      )}
                      <p className="text-xs text-slate-400 dark:text-slate-500">{TENSES[currentCard.tense]}</p>
                      <p className="mt-4 text-2xl font-semibold">
                        {direction === 'en-fr'
                          ? currentCard.englishConjugation
                          : `${currentCard.pronoun} ${currentCard.french}`}
                      </p>
                      {direction === 'en-fr' && currentCard.pronoun === 'tu' && (
                        <p className="mt-2 text-xs italic text-slate-400 dark:text-slate-500">singular / informal</p>
                      )}
                      {direction === 'en-fr' && currentCard.pronoun === 'vous' && (
                        <p className="mt-2 text-xs italic text-slate-400 dark:text-slate-500">plural / formal</p>
                      )}
                      <p className="mt-6 text-xs text-slate-400 dark:text-slate-500">Tap to reveal</p>
                    </div>
                  }
                  back={backContent}
                />
              </SwipeContainer>
            ) : (
              /* Typing mode */
              <div>
                <Flashcard
                  flipped={flipped}
                  onFlip={typingResult ? handleTypingAdvance : () => {}}
                  front={
                    <div className="text-center">
                      {showInfinitive && (
                        <p className="mb-2 text-xs font-medium text-slate-400 dark:text-slate-500">
                          {currentCard.infinitive} ({currentCard.english})
                        </p>
                      )}
                      <p className="text-xs text-slate-400 dark:text-slate-500">{TENSES[currentCard.tense]}</p>
                      <p className="mt-4 text-2xl font-semibold">
                        {direction === 'en-fr'
                          ? currentCard.englishConjugation
                          : `${currentCard.pronoun} ___`}
                      </p>
                      {direction === 'en-fr' && currentCard.pronoun === 'tu' && (
                        <p className="mt-2 text-xs italic text-slate-400 dark:text-slate-500">singular / informal</p>
                      )}
                      {direction === 'en-fr' && currentCard.pronoun === 'vous' && (
                        <p className="mt-2 text-xs italic text-slate-400 dark:text-slate-500">plural / formal</p>
                      )}
                    </div>
                  }
                  back={backContent}
                />
                <div className="mt-4">
                  <TypingInput
                    onSubmit={handleTypingSubmit}
                    disabled={typingResult !== null}
                  />
                </div>
              </div>
            )}
          </>
        )}

        <StatsBar stats={sessionStats} remaining={cards.length} total={totalCards} />
      </div>
    </PageLayout>
  );
}
```

**Step 2: Verify build**

Run: `cd /Users/robinweitzel/Documents/Code/french-conjugation-app && npx tsc --noEmit`

**Step 3: Commit**
```
feat: rewrite Practice page with SRS, typing mode, conjugation table, tier filtering
```

---

### Task 8: Rewrite PracticeSetup Page

**Files:**
- Modify: `src/pages/PracticeSetup.tsx`

**Step 1: Add input mode toggle and tier selection**

Add new sections:
1. **Input Mode** toggle (Flashcard / Typing) — same style as Direction toggle
2. **Verb Tiers** section — tier cards with lock/unlock status and progress bars

This requires computing unlock status from stats. Add a helper hook:

```typescript
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '../components/PageLayout';
import { Navigation } from '../components/Navigation';
import { usePracticeSettings } from '../hooks/useSettings';
import { TENSES, PRONOUNS, VERB_TIERS, TIER_UNLOCK_THRESHOLD, TIER_UNLOCK_MIN_BOX } from '../lib/constants';
import { db } from '../lib/db';
import type { TenseKey, Direction, InputMode, VerbTier } from '../lib/types';

function useTierUnlockStatus(tenses: TenseKey[]) {
  const [unlocked, setUnlocked] = useState<Record<number, boolean>>({ 1: true });
  const [progress, setProgress] = useState<Record<number, { current: number; total: number }>>({});

  useEffect(() => {
    const compute = async () => {
      const newUnlocked: Record<number, boolean> = { 1: true };
      const newProgress: Record<number, { current: number; total: number }> = {};

      for (let i = 0; i < VERB_TIERS.length; i++) {
        const tier = VERB_TIERS[i]!;
        // Count total cards and cards at box >= TIER_UNLOCK_MIN_BOX for this tier
        let total = 0;
        let atLevel = 0;
        const tierVerbs = tier.verbs.length > 0 ? tier.verbs : [];

        // Skip tier 4 for progress calc (it uses all remaining)
        if (tierVerbs.length === 0) {
          newUnlocked[tier.id] = newUnlocked[tier.id - 1] ?? false;
          continue;
        }

        for (const infinitive of tierVerbs) {
          for (const tense of tenses) {
            for (const pronoun of PRONOUNS) {
              const statId = `${infinitive}_${pronoun}_${tense}`;
              total++;
              const stat = await db.stats.get(statId);
              if (stat && stat.box >= TIER_UNLOCK_MIN_BOX) {
                atLevel++;
              }
            }
          }
        }

        newProgress[tier.id] = { current: atLevel, total };

        // Tier N+1 unlocked if tier N meets threshold
        if (i + 1 < VERB_TIERS.length) {
          const ratio = total > 0 ? atLevel / total : 0;
          newUnlocked[VERB_TIERS[i + 1]!.id] = (newUnlocked[tier.id] ?? false) && ratio >= TIER_UNLOCK_THRESHOLD;
        }
      }

      setUnlocked(newUnlocked);
      setProgress(newProgress);
    };

    compute();
  }, [tenses]);

  return { unlocked, progress };
}

export function PracticeSetup() {
  const navigate = useNavigate();
  const {
    direction, setDirection,
    showInfinitive, setShowInfinitive,
    tenses, setTenses,
    inputMode, setInputMode,
    tiers, setTiers,
  } = usePracticeSettings();

  const { unlocked, progress } = useTierUnlockStatus(tenses);

  const toggleTense = (tense: TenseKey) => {
    if (tenses.includes(tense)) {
      setTenses(tenses.filter((t) => t !== tense));
    } else {
      setTenses([...tenses, tense]);
    }
  };

  const toggleTier = (tierId: number) => {
    if (!unlocked[tierId]) return;
    if (tiers.includes(tierId)) {
      if (tiers.length > 1) {
        setTiers(tiers.filter((t) => t !== tierId));
      }
    } else {
      setTiers([...tiers, tierId]);
    }
  };

  return (
    <PageLayout>
      <Navigation title="Practice Setup" />

      <div className="mt-8 space-y-8">
        {/* Direction */}
        <div>
          <label className="mb-3 block text-sm font-medium text-slate-500 dark:text-slate-400">Direction</label>
          <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800/50">
            {(['en-fr', 'fr-en'] as Direction[]).map((d) => (
              <button
                key={d}
                onClick={() => setDirection(d)}
                className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all ${
                  direction === d
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <span className="inline-flex items-center gap-1">
                  {d === 'en-fr' ? 'English' : 'French'}
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="inline size-4">
                    <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
                  </svg>
                  {d === 'en-fr' ? 'French' : 'English'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Input Mode */}
        <div>
          <label className="mb-3 block text-sm font-medium text-slate-500 dark:text-slate-400">Input Mode</label>
          <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800/50">
            {(['flashcard', 'typing'] as InputMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setInputMode(m)}
                className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all ${
                  inputMode === m
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {m === 'flashcard' ? 'Flashcard' : 'Typing'}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
            {inputMode === 'flashcard' ? 'Flip and swipe to self-grade' : 'Type the conjugation for a harder drill'}
          </p>
        </div>

        {/* Infinitive hint */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-slate-900 dark:text-slate-100">Show infinitive hint</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Display the verb infinitive on cards</p>
          </div>
          <button
            onClick={() => setShowInfinitive(!showInfinitive)}
            className={`relative h-7 w-12 rounded-full transition-colors ${
              showInfinitive ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-600'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 size-6 rounded-full bg-white shadow-sm transition-transform ${
                showInfinitive ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>

        {/* Verb Tiers */}
        <div>
          <label className="mb-3 block text-sm font-medium text-slate-500 dark:text-slate-400">Verb Groups</label>
          <div className="space-y-2">
            {VERB_TIERS.map((tier) => {
              const isUnlocked = unlocked[tier.id] ?? false;
              const isSelected = tiers.includes(tier.id);
              const tierProgress = progress[tier.id];

              return (
                <button
                  key={tier.id}
                  onClick={() => toggleTier(tier.id)}
                  disabled={!isUnlocked}
                  className={`flex w-full flex-col gap-1 rounded-xl px-4 py-3 text-left transition-colors ${
                    !isUnlocked
                      ? 'cursor-not-allowed bg-slate-100 text-slate-400 opacity-60 dark:bg-slate-800/30 dark:text-slate-600'
                      : isSelected
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex size-5 items-center justify-center rounded border ${
                        !isUnlocked
                          ? 'border-slate-300 dark:border-slate-700'
                          : isSelected
                            ? 'border-indigo-500 bg-indigo-500 dark:border-indigo-400 dark:bg-indigo-400'
                            : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {!isUnlocked ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-3">
                          <path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" />
                        </svg>
                      ) : isSelected ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="size-3">
                          <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                        </svg>
                      ) : null}
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-medium">
                        Tier {tier.id}: {tier.name}
                      </span>
                      <span className="ml-2 text-xs text-slate-400 dark:text-slate-500">
                        {tier.verbs.length > 0 ? `${tier.verbs.length} verbs` : 'remaining verbs'}
                      </span>
                    </div>
                  </div>
                  {!isUnlocked && tierProgress && (
                    <div className="ml-8 mt-1">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                          <div
                            className="h-full rounded-full bg-indigo-400 transition-all"
                            style={{ width: `${tierProgress.total > 0 ? (tierProgress.current / (tierProgress.total * TIER_UNLOCK_THRESHOLD)) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400">
                          {tierProgress.current}/{Math.ceil(tierProgress.total * TIER_UNLOCK_THRESHOLD)}
                        </span>
                      </div>
                    </div>
                  )}
                  <p className="ml-8 text-xs text-slate-400 dark:text-slate-500">{tier.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tense selection */}
        <div>
          <label className="mb-3 block text-sm font-medium text-slate-500 dark:text-slate-400">Tenses</label>
          <div className="space-y-2">
            {(Object.entries(TENSES) as [TenseKey, string][]).map(([key, name]) => (
              <button
                key={key}
                onClick={() => toggleTense(key)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors ${
                  tenses.includes(key)
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                <div
                  className={`flex size-5 items-center justify-center rounded border ${
                    tenses.includes(key)
                      ? 'border-indigo-500 bg-indigo-500 dark:border-indigo-400 dark:bg-indigo-400'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {tenses.includes(key) && (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="size-3">
                      <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span className="text-sm font-medium">{name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-auto pt-8">
        <button
          onClick={() => navigate('/practice')}
          disabled={tenses.length === 0}
          className="w-full rounded-xl bg-indigo-500 py-3.5 font-semibold text-white shadow-sm transition-colors hover:bg-indigo-600 active:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Start Practice
        </button>
      </div>
    </PageLayout>
  );
}
```

**Step 2: Verify build**

Run: `cd /Users/robinweitzel/Documents/Code/french-conjugation-app && npx tsc --noEmit`

**Step 3: Commit**
```
feat: add input mode toggle and verb tier selection to practice setup
```

---

### Task 9: Update Listening Page for SRS Compatibility

**Files:**
- Modify: `src/pages/Listening.tsx` (only the mastery calls)

The Listening page also uses `useMastery` which no longer has `isMastered`. Update it to use `isDue` instead.

**Step 1: Check Listening.tsx for `isMastered` usage and replace with `isDue`**

Find all references to `isMastered` and `stat?.mastered` in Listening.tsx and replace:
- `isMastered(statId)` → `!(await isDue(statId))` (if not due, it's been reviewed)
- `stat?.mastered` → `stat && stat.nextReview > today`

**Step 2: Verify build**

Run: `cd /Users/robinweitzel/Documents/Code/french-conjugation-app && npx tsc --noEmit`

**Step 3: Commit**
```
fix: update Listening page for SRS-compatible mastery checks
```

---

### Task 10: Bump Version and Final Build

**Files:**
- Modify: `package.json` (version bump)

**Step 1: Bump version**
Change `"version": "4.0.0"` to `"version": "5.0.0"` in package.json (major bump due to DB schema change).

**Step 2: Full build**

Run: `cd /Users/robinweitzel/Documents/Code/french-conjugation-app && npm run build`
Expected: Clean build with no errors.

**Step 3: Commit**
```
chore: bump version to 5.0.0 for SRS and tier features
```
