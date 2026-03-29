# Per-Tense Tier Gating Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign tier gating so each tense has an independent linear progression chain through tiers and input modes (flashcard then typing), with per-card input mode in practice sessions.

**Architecture:** Compute unlock status on the fly from stats (no new DB tables). Expand stat IDs to `${infinitive}_${pronoun}_${tense}_${mode}`. DB migration appends `_flashcard` to existing stats. Settings drop global `inputMode`/`tiers` in favor of per-tense gate overrides. Setup UI shows per-tense progression tracks. Practice page renders flashcard or typing per-card.

**Tech Stack:** React 19, Dexie (IndexedDB), TypeScript, Tailwind CSS, Vite

---

### Task 1: Add types and gate helpers

**Files:**
- Modify: `src/lib/types.ts`
- Create: `src/lib/gates.ts`

**Step 1: Add new types to `src/lib/types.ts`**

Add `mode` field to `PracticeCard` and new gate types:

```typescript
// Add to PracticeCard (after statId field):
  mode: InputMode;

// Add at end of file:
export interface Gate {
  tier: number;
  mode: InputMode;
}

export interface GateStatus {
  gate: Gate;
  unlocked: boolean;
  completed: boolean;
  progress: { current: number; total: number };
}
```

**Step 2: Create `src/lib/gates.ts` with gate computation logic**

```typescript
import { db } from './db';
import { PRONOUNS, VERB_TIERS, TIER_UNLOCK_THRESHOLD, TIER_UNLOCK_MIN_BOX } from './constants';
import type { Gate, GateStatus, TenseKey, InputMode } from './types';

// The 8-gate linear chain for en-fr direction
export const FULL_GATE_CHAIN: Gate[] = [
  { tier: 1, mode: 'flashcard' },
  { tier: 1, mode: 'typing' },
  { tier: 2, mode: 'flashcard' },
  { tier: 2, mode: 'typing' },
  { tier: 3, mode: 'flashcard' },
  { tier: 3, mode: 'typing' },
  { tier: 4, mode: 'flashcard' },
  { tier: 4, mode: 'typing' },
];

// The 4-gate chain for fr-en direction (no typing)
export const FLASHCARD_ONLY_CHAIN: Gate[] = [
  { tier: 1, mode: 'flashcard' },
  { tier: 2, mode: 'flashcard' },
  { tier: 3, mode: 'flashcard' },
  { tier: 4, mode: 'flashcard' },
];

export function getGateChain(direction: 'en-fr' | 'fr-en'): Gate[] {
  return direction === 'en-fr' ? FULL_GATE_CHAIN : FLASHCARD_ONLY_CHAIN;
}

function getVerbsForTier(tierId: number, allVerbs: string[]): string[] {
  const tier = VERB_TIERS.find((t) => t.id === tierId);
  if (!tier) return [];
  if (tier.verbs.length > 0) return tier.verbs;
  // Tier 4: all verbs not in other tiers
  const otherVerbs = new Set(VERB_TIERS.filter((t) => t.verbs.length > 0).flatMap((t) => t.verbs));
  return allVerbs.filter((v) => !otherVerbs.has(v));
}

export async function computeGateStatuses(
  tense: TenseKey,
  direction: 'en-fr' | 'fr-en',
  allVerbs: string[],
): Promise<GateStatus[]> {
  const chain = getGateChain(direction);
  const results: GateStatus[] = [];
  let previousCompleted = true; // Gate 0 (before T1F) is always "completed"

  for (const gate of chain) {
    const tierVerbs = getVerbsForTier(gate.tier, allVerbs);
    let total = 0;
    let atLevel = 0;

    for (const infinitive of tierVerbs) {
      for (const pronoun of PRONOUNS) {
        const statId = `${infinitive}_${pronoun}_${tense}_${gate.mode}`;
        total++;
        const stat = await db.stats.get(statId);
        if (stat && stat.box >= TIER_UNLOCK_MIN_BOX) {
          atLevel++;
        }
      }
    }

    const ratio = total > 0 ? atLevel / total : 0;
    const unlocked = previousCompleted;
    const completed = unlocked && ratio >= TIER_UNLOCK_THRESHOLD;

    results.push({
      gate,
      unlocked,
      completed,
      progress: { current: atLevel, total },
    });

    previousCompleted = completed;
  }

  return results;
}

// Find the frontier gate: first unlocked but not completed gate
export function getFrontierIndex(statuses: GateStatus[]): number {
  const idx = statuses.findIndex((s) => s.unlocked && !s.completed);
  return idx >= 0 ? idx : statuses.length - 1; // If all completed, use last gate
}
```

**Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```
git add src/lib/types.ts src/lib/gates.ts
git commit -m "feat: add gate types and computation logic for per-tense tier progression"
```

---

### Task 2: DB migration — append `_flashcard` to existing stat IDs

**Files:**
- Modify: `src/lib/db.ts`

**Step 1: Add version 3 migration**

Add after the existing `db.version(2)` block:

```typescript
db.version(3).stores({
  verbs: 'infinitive',
  sentences: 'id, category',
  stats: 'id, nextReview',
  metadata: 'key',
}).upgrade(async (tx) => {
  // Migrate practice stats to include _flashcard suffix
  // Listening stats (prefixed with "listening_") are unchanged
  const stats = await tx.table('stats').toArray();
  for (const stat of stats) {
    if (stat.id.startsWith('listening_')) continue;
    // Already migrated if it ends with _flashcard or _typing
    if (stat.id.endsWith('_flashcard') || stat.id.endsWith('_typing')) continue;
    const newId = `${stat.id}_flashcard`;
    await tx.table('stats').add({ ...stat, id: newId });
    await tx.table('stats').delete(stat.id);
  }
});
```

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```
git add src/lib/db.ts
git commit -m "feat: add DB v3 migration to append _flashcard suffix to practice stat IDs"
```

---

### Task 3: Update settings — remove global inputMode/tiers, add gate overrides

**Files:**
- Modify: `src/hooks/useSettings.ts`

**Step 1: Replace `usePracticeSettings`**

Replace the entire `usePracticeSettings` function with:

```typescript
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
```

**Step 2: Update import in types**

Make sure `InputMode` is still exported from `src/lib/types.ts` (it already is).

**Step 3: Verify it compiles (will have errors in consumers — expected)**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: Errors in `PracticeSetup.tsx` and `Practice.tsx` referencing removed `inputMode`/`tiers`. This is expected; we fix those in Tasks 4 and 5.

**Step 4: Commit**

```
git add src/hooks/useSettings.ts
git commit -m "feat: replace global inputMode/tiers with per-tense gate overrides in settings"
```

---

### Task 4: Rewrite PracticeSetup page

**Files:**
- Modify: `src/pages/PracticeSetup.tsx`

**Step 1: Complete rewrite of PracticeSetup.tsx**

Replace the entire file content with:

```tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '../components/PageLayout';
import { Navigation } from '../components/Navigation';
import { usePracticeSettings } from '../hooks/useSettings';
import { useVerbs } from '../hooks/useDatabase';
import { TENSES, VERB_TIERS, TIER_UNLOCK_THRESHOLD } from '../lib/constants';
import { computeGateStatuses, getGateChain, getFrontierIndex } from '../lib/gates';
import type { TenseKey, Direction, GateStatus } from '../lib/types';
import type { GateOverride } from '../hooks/useSettings';

function useAllGateStatuses(tenses: TenseKey[], direction: Direction, allVerbs: string[]) {
  const [statuses, setStatuses] = useState<Record<TenseKey, GateStatus[]>>({} as Record<TenseKey, GateStatus[]>);

  useEffect(() => {
    if (allVerbs.length === 0) return;
    const compute = async () => {
      const result: Partial<Record<TenseKey, GateStatus[]>> = {};
      for (const tense of tenses) {
        result[tense] = await computeGateStatuses(tense, direction, allVerbs);
      }
      setStatuses(result as Record<TenseKey, GateStatus[]>);
    };
    compute();
  }, [tenses, direction, allVerbs]);

  return statuses;
}

function GateIndicator({ status, isActive, onClick }: {
  status: GateStatus;
  isActive: boolean;
  onClick: () => void;
}) {
  const tierName = VERB_TIERS.find((t) => t.id === status.gate.tier)?.name ?? `T${status.gate.tier}`;
  const modeLabel = status.gate.mode === 'flashcard' ? 'F' : 'T';
  const label = `${tierName} ${modeLabel}`;

  let bg: string;
  let text: string;
  if (!status.unlocked) {
    bg = 'bg-slate-100 dark:bg-slate-800/30';
    text = 'text-slate-400 dark:text-slate-600';
  } else if (isActive) {
    bg = 'bg-indigo-500 dark:bg-indigo-500';
    text = 'text-white';
  } else if (status.completed) {
    bg = 'bg-emerald-100 dark:bg-emerald-500/20';
    text = 'text-emerald-700 dark:text-emerald-400';
  } else {
    bg = 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-700';
    text = 'text-slate-600 dark:text-slate-400';
  }

  return (
    <button
      onClick={onClick}
      disabled={!status.unlocked}
      className={`rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${bg} ${text} ${!status.unlocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      title={`Tier ${status.gate.tier} ${status.gate.mode} — ${status.completed ? 'Completed' : status.unlocked ? 'Unlocked' : 'Locked'}`}
    >
      {!status.unlocked ? (
        <span className="inline-flex items-center gap-0.5">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-3">
            <path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" />
          </svg>
          {modeLabel === 'T' ? 'Type' : tierName}
        </span>
      ) : status.completed ? (
        <span className="inline-flex items-center gap-0.5">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-3">
            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
          </svg>
          {modeLabel === 'T' ? 'Type' : tierName}
        </span>
      ) : (
        <span>{modeLabel === 'T' ? 'Type' : tierName}</span>
      )}
    </button>
  );
}

function TenseProgressionTrack({ tense, tenseName, statuses, activeGateIndex, onSelectGate }: {
  tense: TenseKey;
  tenseName: string;
  statuses: GateStatus[];
  activeGateIndex: number;
  onSelectGate: (tense: TenseKey, gateIndex: number) => void;
}) {
  const activeStatus = statuses[activeGateIndex];
  const required = activeStatus ? Math.ceil(activeStatus.progress.total * TIER_UNLOCK_THRESHOLD) : 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
      <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">{tenseName}</p>
      <div className="flex flex-wrap gap-1">
        {statuses.map((status, i) => (
          <GateIndicator
            key={`${status.gate.tier}-${status.gate.mode}`}
            status={status}
            isActive={i === activeGateIndex}
            onClick={() => { if (status.unlocked) onSelectGate(tense, i); }}
          />
        ))}
      </div>
      {activeStatus && !activeStatus.completed && (
        <div className="mt-2 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className="h-full rounded-full bg-indigo-400 transition-all"
              style={{ width: `${required > 0 ? Math.min((activeStatus.progress.current / required) * 100, 100) : 0}%` }}
            />
          </div>
          <span className="text-xs text-slate-400">
            {activeStatus.progress.current}/{required}
          </span>
        </div>
      )}
    </div>
  );
}

export function PracticeSetup() {
  const navigate = useNavigate();
  const verbs = useVerbs();
  const {
    direction, setDirection,
    showInfinitive, setShowInfinitive,
    tenses, setTenses,
    gateOverrides, setGateOverrides,
  } = usePracticeSettings();

  const allVerbs = verbs?.map((v) => v.infinitive) ?? [];
  const gateStatuses = useAllGateStatuses(tenses, direction, allVerbs);

  // Compute active gate index per tense (frontier or override)
  const activeGates: Record<string, number> = {};
  for (const tense of tenses) {
    const statuses = gateStatuses[tense];
    if (!statuses) continue;
    const override = gateOverrides[tense];
    if (override) {
      const chain = getGateChain(direction);
      const idx = chain.findIndex((g) => g.tier === override.tier && g.mode === override.mode);
      if (idx >= 0 && statuses[idx]?.unlocked) {
        activeGates[tense] = idx;
        continue;
      }
    }
    activeGates[tense] = getFrontierIndex(statuses);
  }

  const toggleTense = (tense: TenseKey) => {
    if (tenses.includes(tense)) {
      if (tenses.length > 1) {
        setTenses(tenses.filter((t) => t !== tense));
      }
    } else {
      setTenses([...tenses, tense]);
    }
  };

  const handleSelectGate = (tense: TenseKey, gateIndex: number) => {
    const chain = getGateChain(direction);
    const gate = chain[gateIndex];
    if (!gate) return;
    const statuses = gateStatuses[tense];
    if (!statuses) return;
    const frontier = getFrontierIndex(statuses);
    if (gateIndex === frontier) {
      // Selecting the frontier = remove override
      const next = { ...gateOverrides };
      delete next[tense];
      setGateOverrides(next);
    } else {
      setGateOverrides({ ...gateOverrides, [tense]: { tier: gate.tier, mode: gate.mode } });
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
                onClick={() => {
                  setDirection(d);
                  // Clear overrides when switching direction since gate chains differ
                  setGateOverrides({});
                }}
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

        {/* Per-tense progression */}
        {tenses.length > 0 && Object.keys(gateStatuses).length > 0 && (
          <div>
            <label className="mb-3 block text-sm font-medium text-slate-500 dark:text-slate-400">Progression</label>
            <div className="space-y-2">
              {tenses.map((tense) => {
                const statuses = gateStatuses[tense];
                if (!statuses) return null;
                return (
                  <TenseProgressionTrack
                    key={tense}
                    tense={tense}
                    tenseName={TENSES[tense]}
                    statuses={statuses}
                    activeGateIndex={activeGates[tense] ?? 0}
                    onSelectGate={handleSelectGate}
                  />
                );
              })}
            </div>
          </div>
        )}
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

**Step 2: Verify it compiles (Practice.tsx will still have errors)**

Run: `npx tsc --noEmit 2>&1 | grep -c "error TS"`
Expected: Errors only in `Practice.tsx`

**Step 3: Commit**

```
git add src/pages/PracticeSetup.tsx
git commit -m "feat: rewrite PracticeSetup with per-tense progression tracks and gate selection"
```

---

### Task 5: Rewrite Practice page for per-card input mode

**Files:**
- Modify: `src/pages/Practice.tsx`

**Step 1: Complete rewrite of Practice.tsx**

Replace the entire file content with:

```tsx
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
import { computeGateStatuses, getGateChain, getFrontierIndex } from '../lib/gates';
import type { PracticeCard, TenseConjugations, InputMode } from '../lib/types';
import { formatPronounVerb } from '../lib/utils';
import { db } from '../lib/db';

function getVerbsForTier(tierId: number, allVerbs: string[]): Set<string> {
  const tier = VERB_TIERS.find((t) => t.id === tierId);
  if (!tier) return new Set();
  if (tier.verbs.length > 0) return new Set(tier.verbs);
  const otherVerbs = new Set(VERB_TIERS.filter((t) => t.verbs.length > 0).flatMap((t) => t.verbs));
  return new Set(allVerbs.filter((v) => !otherVerbs.has(v)));
}

function normalizeAnswer(s: string): string {
  return s.trim().toLowerCase();
}

export function Practice() {
  const verbs = useVerbs();
  const { direction, showInfinitive, tenses, gateOverrides } = usePracticeSettings();
  const { sessionStats, recordCorrect, recordIncorrect, resetStats, resetSession } = useMastery();
  const { flipped, flip, reset: resetFlip } = useFlipState();
  const swipeRef = useRef<SwipeContainerHandle>(null);

  const [cards, setCards] = useState<PracticeCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasScheduledCards, setHasScheduledCards] = useState(false);
  const [nextReviewDate, setNextReviewDate] = useState<string | null>(null);
  const [typingResult, setTypingResult] = useState<'correct' | 'incorrect' | null>(null);

  useEffect(() => {
    if (!verbs) return;

    const buildCards = async () => {
      const allCards: PracticeCard[] = [];
      const today = new Date().toISOString().split('T')[0]!;
      const allVerbNames = verbs.map((v) => v.infinitive);
      let earliestFuture: string | null = null;

      for (const tense of tenses) {
        // Determine active gate for this tense
        const chain = getGateChain(direction);
        const statuses = await computeGateStatuses(tense, direction, allVerbNames);
        const override = gateOverrides[tense];
        let activeIndex: number;

        if (override) {
          const idx = chain.findIndex((g) => g.tier === override.tier && g.mode === override.mode);
          activeIndex = idx >= 0 && statuses[idx]?.unlocked ? idx : getFrontierIndex(statuses);
        } else {
          activeIndex = getFrontierIndex(statuses);
        }

        const activeGate = chain[activeIndex];
        if (!activeGate) continue;

        const mode: InputMode = direction === 'fr-en' ? 'flashcard' : activeGate.mode;
        const allowedVerbs = getVerbsForTier(activeGate.tier, allVerbNames);

        for (const verb of verbs) {
          if (!allowedVerbs.has(verb.infinitive)) continue;

          const tenseData = verb.tenses[tense];
          if (!tenseData) continue;

          for (const pronoun of PRONOUNS) {
            const conjugation = tenseData[pronoun];
            if (!conjugation) continue;

            const statId = `${verb.infinitive}_${pronoun}_${tense}_${mode}`;
            const stat = await db.stats.get(statId);

            if (stat && stat.nextReview > today) {
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
              mode,
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
  }, [verbs, tenses, direction, gateOverrides]);

  const currentCard = cards[currentIndex];
  const allDone = !loading && cards.length === 0;
  const cardMode: InputMode = currentCard?.mode ?? 'flashcard';

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
      setCurrentIndex(0);
    }
  }, [currentIndex, cards.length, resetFlip]);

  const handleSwipeRight = useCallback(async () => {
    if (!currentCard) return;
    const removed = await recordCorrect(currentCard.statId);
    if (removed) {
      setCards((prev) => {
        const next = prev.filter((c) => c.statId !== currentCard.statId);
        if (currentIndex >= next.length && next.length > 0) {
          setCurrentIndex(0);
        }
        return next;
      });
      resetFlip();
      setTypingResult(null);
    } else {
      nextCard();
    }
  }, [currentCard, recordCorrect, nextCard, resetFlip, currentIndex]);

  const handleSwipeLeft = useCallback(async () => {
    if (!currentCard) return;
    await recordIncorrect(currentCard.statId);
    nextCard();
  }, [currentCard, recordIncorrect, nextCard]);

  const handleTypingSubmit = useCallback((answer: string) => {
    if (!currentCard) return;
    const correct = normalizeAnswer(answer) === normalizeAnswer(currentCard.french);
    setTypingResult(correct ? 'correct' : 'incorrect');
    if (!flipped) flip();
  }, [currentCard, flipped, flip]);

  const handleTypingAdvance = useCallback(async () => {
    if (!typingResult || !currentCard) return;
    if (typingResult === 'correct') {
      await handleSwipeRight();
    } else {
      await handleSwipeLeft();
    }
  }, [typingResult, currentCard, handleSwipeRight, handleSwipeLeft]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (cardMode === 'typing') {
        if (e.key === 'Enter' && typingResult) {
          e.preventDefault();
          handleTypingAdvance();
        }
        return;
      }
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
  }, [flip, flipped, cardMode, typingResult, handleTypingAdvance]);

  const handleReset = async () => {
    await resetStats();
    resetSession();
    setLoading(true);
    window.location.reload();
  };

  const totalCards = cards.length + sessionStats.correct;

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
                : "You've mastered all cards in the selected tenses."}
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

  const frontContent = currentCard && (
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
          : cardMode === 'typing'
            ? `${currentCard.pronoun === 'je' && /^[aeéèêëàâùûüïîôœæh]/i.test(currentCard.french) ? "j'" : currentCard.pronoun + ' '}___`
            : formatPronounVerb(currentCard.pronoun, currentCard.french)}
      </p>
      {direction === 'en-fr' && currentCard.pronoun === 'tu' && (
        <p className="mt-2 text-xs italic text-slate-400 dark:text-slate-500">singular / informal</p>
      )}
      {direction === 'en-fr' && currentCard.pronoun === 'vous' && (
        <p className="mt-2 text-xs italic text-slate-400 dark:text-slate-500">plural / formal</p>
      )}
      {cardMode === 'flashcard' && (
        <p className="mt-6 text-xs text-slate-400 dark:text-slate-500">Tap to reveal</p>
      )}
    </div>
  );

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
          ? formatPronounVerb(currentCard.pronoun, currentCard.french)
          : currentCard.englishConjugation}
      </p>
      {currentTenseData && (
        <ConjugationTable tenseData={currentTenseData} highlightPronoun={currentCard.pronoun} />
      )}
      <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
        {cardMode === 'flashcard' ? 'Swipe right if correct, left if not' : 'Press Enter to continue'}
      </p>
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
            {cardMode === 'flashcard' ? (
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
                  front={frontContent}
                  back={backContent}
                />
              </SwipeContainer>
            ) : (
              <div>
                <Flashcard
                  flipped={flipped}
                  onFlip={typingResult ? handleTypingAdvance : () => {}}
                  front={frontContent}
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

**Step 2: Verify full project compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```
git add src/pages/Practice.tsx
git commit -m "feat: rewrite Practice page with per-card input mode from gate system"
```

---

### Task 6: Build, verify, and bump version

**Step 1: Run the build**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 2: Start dev server and verify in browser**

Run: `npm run dev`

Verify:
- Practice Setup shows direction toggle, infinitive hint, tense selection, and per-tense progression tracks
- Progression tracks show gate indicators (T1F should be active/highlighted, rest locked)
- Clicking Start Practice opens practice with flashcard mode for T1
- Cards use the new stat ID format (check IndexedDB in browser dev tools)
- After answering some cards correctly, gate progress bar updates on setup page
- Switching direction to fr-en hides typing gates from progression tracks

**Step 3: Bump version in `package.json`**

Change `"version": "5.1.0"` to `"version": "6.0.0"` (major version bump due to stat ID format change and DB migration).

**Step 4: Commit**

```
git add package.json
git commit -m "feat: per-tense tier gating with linear progression chain (v6.0.0)"
```

---

## Verification Checklist

After all tasks, verify end-to-end:

1. **Fresh user experience:** Clear IndexedDB, reload. T1 Flashcard should be the only unlocked gate for each tense.
2. **Migration:** If the user had existing stats from v5.x, they should appear as `_flashcard` stats after migration.
3. **Progression:** After getting 70% of T1 flashcard cards to box 3+, T1 Typing should unlock.
4. **Per-card mode:** When practicing a tense at a typing gate, cards render with typing input. When practicing a tense at a flashcard gate, cards render with swipe.
5. **fr-en direction:** Only flashcard gates shown, no typing gates.
6. **Gate override:** Tapping a completed gate on setup page selects it for practice instead of frontier.
7. **Multi-tense session:** Selecting two tenses at different progression levels produces a mixed deck with per-card modes.
