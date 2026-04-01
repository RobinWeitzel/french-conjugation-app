# Unlock Mechanic Rework Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rework the unlock/progression system so that directions (en-fr / fr-en) track progress independently, gates require deeper mastery (box >= 3) to unlock, completions persist permanently in IndexedDB, and the setup screen shows a stacked color bar with tier badges.

**Architecture:** Direction is added to stat IDs (`_enfr` / `_fren` suffix) and a new `gateCompletions` IndexedDB store records permanently completed gates. The gate computation checks this store first, then falls back to live stat evaluation. The PracticeSetup UI replaces the single-color progress bar with a grey/orange/green stacked bar showing card distribution across boxes.

**Tech Stack:** React, TypeScript, Dexie (IndexedDB), Tailwind CSS, Vite

**Note:** This project has no test framework. Verification is done via `tsc -b` (type checking) and `vite build` (build). Visual changes are verified in the dev server preview.

---

### Task 1: Update Types

**Files:**
- Modify: `src/lib/types.ts`

**Step 1: Add GateCompletion type and update Activity type**

Add to `src/lib/types.ts`:

```ts
export interface GateCompletion {
  id: string;          // "present_enfr_1_flashcard"
  tense: TenseKey;
  direction: Direction;
  tier: number;
  mode: InputMode;
  completedAt: string; // ISO date
}
```

Update the `Activity` interface to add an optional `direction` field:

```ts
export interface Activity {
  id?: number;
  date: string;
  mode: 'conjugation' | 'listening';
  correct: boolean;
  direction?: Direction;  // new: track which direction was practiced
}
```

Update `GateStatus` to include box distribution for the stacked bar:

```ts
export interface GateStatus {
  gate: Gate;
  unlocked: boolean;
  completed: boolean;
  progress: { current: number; total: number };
  boxDistribution: { box1: number; box2: number; box3plus: number };
}
```

**Step 2: Verify types compile**

Run: `cd /Users/robinweitzel/Documents/Code/french-conjugation-app && npx tsc -b --noEmit 2>&1 | head -30`

Expected: Type errors in files that use `GateStatus` without `boxDistribution` — that's fine, we'll fix those in later tasks.

**Step 3: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: add GateCompletion type, direction to Activity, boxDistribution to GateStatus"
```

---

### Task 2: Update Constants

**Files:**
- Modify: `src/lib/constants.ts`

**Step 1: Change TIER_UNLOCK_MIN_BOX from 2 to 3**

In `src/lib/constants.ts`, change line 36:

```ts
export const TIER_UNLOCK_MIN_BOX = 3;
```

**Step 2: Commit**

```bash
git add src/lib/constants.ts
git commit -m "feat: raise unlock threshold to box >= 3"
```

---

### Task 3: Database Migration (v4 -> v5)

**Files:**
- Modify: `src/lib/db.ts`

**Step 1: Add gateCompletions store and migration logic**

Add the Dexie type for `gateCompletions`:

```ts
import type { Verb, Sentence, Stat, Metadata, Activity, GateCompletion } from './types';

const db = new Dexie('FrenchConjugationDB') as Dexie & {
  verbs: EntityTable<Verb, 'infinitive'>;
  sentences: EntityTable<Sentence, 'id'>;
  stats: EntityTable<Stat, 'id'>;
  metadata: EntityTable<Metadata, 'key'>;
  activity: EntityTable<Activity, 'id'>;
  gateCompletions: EntityTable<GateCompletion, 'id'>;
};
```

Add version 5 with migration:

```ts
db.version(5).stores({
  verbs: 'infinitive',
  sentences: 'id, category',
  stats: 'id, nextReview',
  metadata: 'key',
  activity: '++id, date',
  gateCompletions: 'id',
}).upgrade(async (tx) => {
  // Migrate practice stats: add direction suffix
  // Listening stats (prefixed with "listening_") are unchanged
  const stats = await tx.table('stats').toArray();
  for (const stat of stats) {
    if (stat.id.startsWith('listening_')) continue;
    // Already migrated if it ends with _enfr or _fren
    if (stat.id.endsWith('_enfr') || stat.id.endsWith('_fren')) continue;

    // Create copies for both directions
    const enfrId = `${stat.id}_enfr`;
    const frenId = `${stat.id}_fren`;
    await tx.table('stats').add({ ...stat, id: enfrId });
    await tx.table('stats').add({ ...stat, id: frenId });
    await tx.table('stats').delete(stat.id);
  }

  // Note: gateCompletions pre-population will be done at app startup
  // by computeGateStatuses, not during migration, to avoid importing
  // the full gate logic into the migration code.
});
```

**Step 2: Verify build**

Run: `cd /Users/robinweitzel/Documents/Code/french-conjugation-app && npx tsc -b --noEmit 2>&1 | head -30`

Expected: May have errors from other files not yet updated — that's expected.

**Step 3: Commit**

```bash
git add src/lib/db.ts
git commit -m "feat: add gateCompletions store and v5 migration for direction-specific stats"
```

---

### Task 4: Update Gate Logic

**Files:**
- Modify: `src/lib/gates.ts`

This is the core logic change. `computeGateStatuses` must:
1. Accept direction parameter (already does, but now uses it in stat ID)
2. Include direction in stat ID lookups
3. Check `gateCompletions` store for permanent completions
4. Track box distribution (box1, box2, box3+) for the stacked bar
5. Write new `GateCompletion` when a gate is completed for the first time

**Step 1: Rewrite computeGateStatuses**

```ts
import { db } from './db';
import { PRONOUNS, VERB_TIERS, TIER_UNLOCK_THRESHOLD, TIER_UNLOCK_MIN_BOX } from './constants';
import type { Gate, GateStatus, TenseKey, Verb, Direction } from './types';

// ... keep FULL_GATE_CHAIN, FLASHCARD_ONLY_CHAIN, getGateChain, getVerbsForTier unchanged ...

function directionSuffix(direction: Direction): string {
  return direction === 'en-fr' ? 'enfr' : 'fren';
}

export function makeStatId(
  infinitive: string,
  pronoun: string,
  tense: TenseKey,
  mode: string,
  direction: Direction,
): string {
  return `${infinitive}_${pronoun}_${tense}_${mode}_${directionSuffix(direction)}`;
}

function makeGateCompletionId(
  tense: TenseKey,
  direction: Direction,
  tier: number,
  mode: string,
): string {
  return `${tense}_${directionSuffix(direction)}_${tier}_${mode}`;
}

export async function computeGateStatuses(
  tense: TenseKey,
  direction: Direction,
  allVerbs: string[],
  verbData?: Verb[],
): Promise<GateStatus[]> {
  const chain = getGateChain(direction);
  const results: GateStatus[] = [];
  let previousCompleted = true;
  const verbMap = verbData ? new Map(verbData.map((v) => [v.infinitive, v])) : null;

  for (const gate of chain) {
    const tierVerbs = getVerbsForTier(gate.tier, allVerbs);
    let total = 0;
    let atLevel = 0;
    let box1 = 0;
    let box2 = 0;
    let box3plus = 0;

    // Check for permanent completion
    const completionId = makeGateCompletionId(tense, direction, gate.tier, gate.mode);
    const existingCompletion = await db.gateCompletions.get(completionId);

    for (const infinitive of tierVerbs) {
      for (const pronoun of PRONOUNS) {
        if (verbMap) {
          const verb = verbMap.get(infinitive);
          if (verb && !verb.tenses[tense]?.[pronoun]) continue;
        }
        const statId = makeStatId(infinitive, pronoun, tense, gate.mode, direction);
        total++;
        const stat = await db.stats.get(statId);
        if (stat && stat.box >= TIER_UNLOCK_MIN_BOX) {
          atLevel++;
          box3plus++;
        } else if (stat && stat.box === 2) {
          box2++;
        } else {
          box1++;
        }
      }
    }

    const ratio = total > 0 ? atLevel / total : 0;
    const unlocked: boolean = previousCompleted;
    let completed: boolean;

    if (existingCompletion) {
      // Permanently completed — never regresses
      completed = true;
    } else {
      completed = unlocked && ratio >= TIER_UNLOCK_THRESHOLD;
      // Persist new completion
      if (completed) {
        await db.gateCompletions.put({
          id: completionId,
          tense,
          direction,
          tier: gate.tier,
          mode: gate.mode,
          completedAt: new Date().toISOString(),
        });
      }
    }

    results.push({
      gate,
      unlocked,
      completed,
      progress: { current: atLevel, total },
      boxDistribution: { box1, box2, box3plus },
    });

    previousCompleted = completed;
  }

  return results;
}
```

**Step 2: Verify the file compiles**

Run: `cd /Users/robinweitzel/Documents/Code/french-conjugation-app && npx tsc -b --noEmit 2>&1 | head -30`

**Step 3: Commit**

```bash
git add src/lib/gates.ts
git commit -m "feat: direction-aware stat IDs, persistent gate completions, box distribution tracking"
```

---

### Task 5: Update useMastery Hook

**Files:**
- Modify: `src/hooks/useMastery.ts`

The hook's `recordCorrect` and `recordIncorrect` functions receive stat IDs from callers. The stat IDs are constructed in `Practice.tsx` (Task 6), so useMastery itself doesn't need to know about direction — it just operates on whatever stat ID it receives.

However, the `activity` record needs the `direction` field now.

**Step 1: Add direction parameter to useMastery**

Update the hook to accept and pass through direction:

```ts
export function useMastery(mode: 'conjugation' | 'listening' = 'conjugation', direction?: Direction) {
```

In `recordCorrect` and `recordIncorrect`, pass `direction` to the activity record:

```ts
const activityId = await db.activity.add({ date: today, mode, correct: true, direction });
```

```ts
const activityId = await db.activity.add({ date: today, mode, correct: false, direction });
```

Import the `Direction` type at the top.

**Step 2: Verify compilation**

Run: `cd /Users/robinweitzel/Documents/Code/french-conjugation-app && npx tsc -b --noEmit 2>&1 | head -30`

**Step 3: Commit**

```bash
git add src/hooks/useMastery.ts
git commit -m "feat: add direction to activity records in useMastery"
```

---

### Task 6: Update Practice.tsx

**Files:**
- Modify: `src/pages/Practice.tsx`

**Step 1: Update stat ID construction and useMastery call**

Import `makeStatId` from `gates.ts` and use it instead of inline string construction.

Change the `useMastery` call to pass direction:

```ts
const { sessionStats, recordCorrect, recordIncorrect, resetStats, resetSession, undo } = useMastery('conjugation', direction);
```

In `buildCards`, replace:
```ts
const statId = `${verb.infinitive}_${pronoun}_${tense}_${mode}`;
```
with:
```ts
const statId = makeStatId(verb.infinitive, pronoun, tense, mode, direction);
```

**Step 2: Verify build compiles**

Run: `cd /Users/robinweitzel/Documents/Code/french-conjugation-app && npx tsc -b --noEmit 2>&1 | head -30`

Expected: PASS (no type errors)

**Step 3: Commit**

```bash
git add src/pages/Practice.tsx
git commit -m "feat: use direction-aware stat IDs in practice card builder"
```

---

### Task 7: Update PracticeSetup.tsx — Stacked Progress Bar & Tier Badges

**Files:**
- Modify: `src/pages/PracticeSetup.tsx`

This is the UI-heavy task. Replace the single indigo progress bar with the stacked grey/orange/green bar.

**Step 1: Update the progress bar section**

Replace the current progress bar (lines 249-268) with the stacked bar implementation:

The stacked bar should:
- Show three segments: grey (box 1), orange (box 2), green (box 3+) proportionally
- Show the 70% threshold marker
- Show the count as `{box3plus}/{total}` since box3+ is what counts toward unlock

```tsx
{activeProgress && activeProgress.total > 0 && !activeGateStatus?.completed && (
  <div className="mt-3">
    <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
      {/* Green segment (box 3+) */}
      <div
        className="absolute left-0 top-0 h-full rounded-full bg-emerald-400 dark:bg-emerald-500 transition-all"
        style={{
          width: `${(activeGateStatus.boxDistribution.box3plus / activeProgress.total) * 100}%`
        }}
      />
      {/* Orange segment (box 2) — stacked after green */}
      <div
        className="absolute top-0 h-full bg-amber-400 dark:bg-amber-500 transition-all"
        style={{
          left: `${(activeGateStatus.boxDistribution.box3plus / activeProgress.total) * 100}%`,
          width: `${(activeGateStatus.boxDistribution.box2 / activeProgress.total) * 100}%`
        }}
      />
      {/* 70% threshold marker */}
      <div
        className="absolute top-1/2 h-3.5 w-0.5 -translate-y-1/2 rounded-full bg-slate-400 dark:bg-slate-500"
        style={{ left: `${TIER_UNLOCK_THRESHOLD * 100}%` }}
      />
    </div>
    <div className="mt-1 flex items-center justify-between">
      <div className="flex items-center gap-3 text-[10px]">
        <span className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
          <span className="inline-block size-2 rounded-full bg-emerald-400 dark:bg-emerald-500" />
          Mastered
        </span>
        <span className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
          <span className="inline-block size-2 rounded-full bg-amber-400 dark:bg-amber-500" />
          Learning
        </span>
      </div>
      <span className="text-xs text-slate-400 dark:text-slate-500">
        {activeGateStatus.boxDistribution.box3plus}/{activeProgress.total}
      </span>
    </div>
  </div>
)}
```

**Step 2: Update gate override scoping**

In `useSettings.ts`, the gate overrides key should incorporate direction awareness. However, since overrides are already cleared on direction change (line 70), the current approach is sufficient. No change needed here.

**Step 3: Verify build**

Run: `cd /Users/robinweitzel/Documents/Code/french-conjugation-app && npx tsc -b --noEmit 2>&1 | head -30`

**Step 4: Verify visually in dev server**

Run: `npm run dev`

Navigate to practice setup. Select a tense. Verify:
- Tier badge pills still show correctly
- The progress bar shows the stacked segments (may be all grey if no progress)
- The 70% marker is visible
- The legend shows "Mastered" and "Learning" labels

**Step 5: Commit**

```bash
git add src/pages/PracticeSetup.tsx
git commit -m "feat: stacked progress bar with box distribution and tier badges"
```

---

### Task 8: Full Integration Verification

**Files:** None (verification only)

**Step 1: Full build check**

Run: `cd /Users/robinweitzel/Documents/Code/french-conjugation-app && npm run build 2>&1 | tail -20`

Expected: Build succeeds with no errors.

**Step 2: Verify in dev server**

Run: `npm run dev`

Test the full flow:
1. Open practice setup, select en-fr direction and Présent tense
2. Verify the gate pills show (T1 active, rest locked)
3. Start practice — verify cards load
4. Answer a few cards correctly, go back to setup
5. Verify the progress bar shows orange segments (box 2 cards)
6. Switch to fr-en direction — verify progress resets to independent state
7. Switch back to en-fr — verify the orange segments are still there

**Step 3: Commit (if any fixes were needed)**

---

### Task 9: Bump Version

**Files:**
- Modify: `package.json`

**Step 1: Bump version**

Change version in `package.json` from `"6.8.1"` to `"6.9.0"` (minor bump for new feature).

**Step 2: Verify build generates version.json**

Run: `cd /Users/robinweitzel/Documents/Code/french-conjugation-app && npm run build 2>&1 | tail -10`

Expected: Build succeeds, `public/version.json` updated via prebuild script.

**Step 3: Commit**

```bash
git add package.json
git commit -m "chore: bump version to 6.9.0 for unlock mechanic rework"
```
