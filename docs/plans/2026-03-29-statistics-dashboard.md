# Statistics Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a flat statistics dashboard showing count-based metrics for conjugation and listening practice, with a 14-day activity chart.

**Architecture:** Compute all metrics from the existing `stats` IndexedDB store. Add a lightweight `activity` store (one row per answer) for the daily activity chart. New `/statistics` route with a single scrollable dashboard page.

**Tech Stack:** React 19, Dexie 4 (IndexedDB), Tailwind 4, React Router 7, plain SVG for charts.

---

### Task 1: Add Activity type to types.ts

**Files:**
- Modify: `src/lib/types.ts:46` (after `Stat` interface)

**Step 1: Add the Activity interface**

After the `Stat` interface (line 46), add:

```typescript
export interface Activity {
  id?: number;
  date: string;       // "YYYY-MM-DD"
  mode: 'conjugation' | 'listening';
  correct: boolean;
}
```

**Step 2: Verify no type errors**

Run: `npx tsc --noEmit`
Expected: No errors (new type is unused so far, which is fine)

**Step 3: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat(stats): add Activity type definition"
```

---

### Task 2: Add activity store to IndexedDB (version 4)

**Files:**
- Modify: `src/lib/db.ts`

**Step 1: Import Activity type and add to db type**

At line 2, add `Activity` to the import:

```typescript
import type { Verb, Sentence, Stat, Metadata, Activity } from './types';
```

Add the `activity` table to the Dexie type cast (line 4):

```typescript
const db = new Dexie('FrenchConjugationDB') as Dexie & {
  verbs: EntityTable<Verb, 'infinitive'>;
  sentences: EntityTable<Sentence, 'id'>;
  stats: EntityTable<Stat, 'id'>;
  metadata: EntityTable<Metadata, 'key'>;
  activity: EntityTable<Activity, 'id'>;
};
```

**Step 2: Add version 4 schema**

After the version(3) block (after line 58), add:

```typescript
db.version(4).stores({
  verbs: 'infinitive',
  sentences: 'id, category',
  stats: 'id, nextReview',
  metadata: 'key',
  activity: '++id, date',
});
```

No migration needed — new store with auto-increment.

**Step 3: Verify no type errors**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/lib/db.ts
git commit -m "feat(stats): add activity store to IndexedDB v4"
```

---

### Task 3: Write activity records from useMastery

**Files:**
- Modify: `src/hooks/useMastery.ts`

**Step 1: Add activity logging to recordCorrect and recordIncorrect**

The hook needs a `mode` parameter so it knows whether to log `"conjugation"` or `"listening"`. Change the hook signature to accept an optional mode:

```typescript
export function useMastery(mode: 'conjugation' | 'listening' = 'conjugation') {
```

Import `db` is already there. Add the activity write inside both `recordCorrect` and `recordIncorrect`.

In `recordCorrect`, after `setSessionStats` (line 36), add:

```typescript
    await db.activity.add({
      date: today,
      mode,
      correct: true,
    });
```

In `recordIncorrect`, after `setSessionStats` (line 51), add:

```typescript
    await db.activity.add({
      date: getToday(),
      mode,
      correct: false,
    });
```

**Step 2: Update callers to pass the mode**

In `src/pages/Practice.tsx`, find the `useMastery()` call and change to:
```typescript
const { sessionStats, recordCorrect, recordIncorrect, isDue, resetStats, resetSession } = useMastery('conjugation');
```

In `src/pages/Listening.tsx`, find the `useMastery()` call and change to:
```typescript
const { sessionStats, recordCorrect, recordIncorrect, isDue, resetSession } = useMastery('listening');
```

**Step 3: Verify no type errors**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Verify the app still works**

Run: `npm run dev`
Open the app, do one practice answer, check browser DevTools > Application > IndexedDB > FrenchConjugationDB > activity. Should see a row.

**Step 5: Commit**

```bash
git add src/hooks/useMastery.ts src/pages/Practice.tsx src/pages/Listening.tsx
git commit -m "feat(stats): log activity records on every answer"
```

---

### Task 4: Create useStatistics hook

**Files:**
- Create: `src/hooks/useStatistics.ts`

**Step 1: Create the hook**

This hook queries the `stats` and `activity` stores and computes all dashboard aggregates. Uses `useLiveQuery` from `dexie-react-hooks` (already used in `src/hooks/useDatabase.ts`).

```typescript
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { TENSES } from '../lib/constants';
import type { TenseKey } from '../lib/types';

interface BoxDistribution {
  [box: number]: number; // box 1-5 → count
}

interface GroupStats {
  total: number;
  mastered: number;
  boxes: BoxDistribution;
}

interface DailyActivity {
  date: string;
  conjugation: number;
  listening: number;
}

export interface StatisticsData {
  // Overview
  totalCards: number;
  mastered: number;
  masteredPercent: number;
  totalAnswers: number;
  correctAnswers: number;
  accuracy: number;
  // Per-tense conjugation breakdown
  tenses: Record<string, GroupStats>;
  // Listening breakdown by category
  listeningCategories: Record<string, GroupStats>;
  // Overall listening
  listeningOverall: GroupStats;
  // Daily activity (last 14 days)
  dailyActivity: DailyActivity[];
}

function emptyGroupStats(): GroupStats {
  return { total: 0, mastered: 0, boxes: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
}

export function useStatistics(): StatisticsData | undefined {
  return useLiveQuery(async () => {
    const [allStats, allActivity, allSentences] = await Promise.all([
      db.stats.toArray(),
      db.activity.toArray(),
      db.sentences.toArray(),
    ]);

    // Build sentence category lookup
    const sentenceCategoryMap = new Map<string, string>();
    for (const s of allSentences) {
      sentenceCategoryMap.set(s.id, s.category);
    }

    // Separate conjugation vs listening stats
    const conjugationStats = allStats.filter((s) => !s.id.startsWith('listening_'));
    const listeningStats = allStats.filter((s) => s.id.startsWith('listening_'));

    // Overall
    const totalCards = allStats.length;
    const mastered = allStats.filter((s) => s.box >= 5).length;
    const masteredPercent = totalCards > 0 ? Math.round((mastered / totalCards) * 100) : 0;

    // Accuracy from activity log
    const totalAnswers = allActivity.length;
    const correctAnswers = allActivity.filter((a) => a.correct).length;
    const accuracy = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;

    // Per-tense breakdown
    // Stat ID format: {infinitive}_{pronoun}_{tense}_{mode}
    // Tense is the third segment (index 2) when splitting by '_'
    // But tense keys like 'passe_compose' contain underscores, so we need smarter parsing.
    // Strategy: try matching known tense keys in the stat ID.
    const tenseKeys = Object.keys(TENSES) as TenseKey[];
    const tenses: Record<string, GroupStats> = {};

    for (const stat of conjugationStats) {
      let matchedTense: string | null = null;
      // Try longest tense keys first to avoid partial matches
      const sortedKeys = [...tenseKeys].sort((a, b) => b.length - a.length);
      for (const tk of sortedKeys) {
        if (stat.id.includes(`_${tk}_`)) {
          matchedTense = tk;
          break;
        }
      }
      if (!matchedTense) continue;

      if (!tenses[matchedTense]) tenses[matchedTense] = emptyGroupStats();
      const group = tenses[matchedTense];
      group.total++;
      if (stat.box >= 5) group.mastered++;
      group.boxes[stat.box] = (group.boxes[stat.box] ?? 0) + 1;
    }

    // Listening breakdown by category
    const listeningCategories: Record<string, GroupStats> = {};
    const listeningOverall = emptyGroupStats();

    for (const stat of listeningStats) {
      const sentenceId = stat.id.replace('listening_', '');
      const category = sentenceCategoryMap.get(sentenceId) ?? 'Unknown';

      if (!listeningCategories[category]) listeningCategories[category] = emptyGroupStats();
      const group = listeningCategories[category];
      group.total++;
      if (stat.box >= 5) group.mastered++;
      group.boxes[stat.box] = (group.boxes[stat.box] ?? 0) + 1;

      listeningOverall.total++;
      if (stat.box >= 5) listeningOverall.mastered++;
      listeningOverall.boxes[stat.box] = (listeningOverall.boxes[stat.box] ?? 0) + 1;
    }

    // Daily activity (last 14 days)
    const today = new Date();
    const days: DailyActivity[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0]!;
      days.push({ date: dateStr, conjugation: 0, listening: 0 });
    }
    const dayMap = new Map(days.map((d) => [d.date, d]));

    for (const a of allActivity) {
      const day = dayMap.get(a.date);
      if (!day) continue;
      if (a.mode === 'conjugation') day.conjugation++;
      else day.listening++;
    }

    return {
      totalCards,
      mastered,
      masteredPercent,
      totalAnswers,
      correctAnswers,
      accuracy,
      tenses,
      listeningCategories,
      listeningOverall,
      dailyActivity: days,
    };
  });
}
```

**Step 2: Verify no type errors**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/hooks/useStatistics.ts
git commit -m "feat(stats): create useStatistics hook for dashboard aggregates"
```

---

### Task 5: Create Statistics page

**Files:**
- Create: `src/pages/Statistics.tsx`

**Step 1: Create the page component**

```typescript
import { useState } from 'react';
import { PageLayout } from '../components/PageLayout';
import { Navigation } from '../components/Navigation';
import { useStatistics, type StatisticsData } from '../hooks/useStatistics';
import { TENSES } from '../lib/constants';
import type { TenseKey } from '../lib/types';

function OverviewCards({ data }: { data: StatisticsData }) {
  const cards = [
    { label: 'Total Cards', value: data.totalCards },
    { label: 'Mastered', value: `${data.mastered} (${data.masteredPercent}%)` },
    { label: 'Accuracy', value: data.totalAnswers > 0 ? `${data.accuracy}%` : '—' },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border border-slate-200 bg-white p-4 text-center dark:border-slate-700 dark:bg-slate-800"
        >
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{card.value}</div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{card.label}</div>
        </div>
      ))}
    </div>
  );
}

function ActivityChart({ data }: { data: StatisticsData['dailyActivity'] }) {
  const maxCount = Math.max(1, ...data.map((d) => d.conjugation + d.listening));

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Last 14 Days</h3>
      <svg viewBox="0 0 280 120" className="w-full" role="img" aria-label="Daily activity chart">
        {data.map((day, i) => {
          const x = i * 20;
          const totalHeight = ((day.conjugation + day.listening) / maxCount) * 90;
          const conjHeight = (day.conjugation / maxCount) * 90;
          const listenHeight = (day.listening / maxCount) * 90;
          const dayLabel = new Date(day.date + 'T00:00:00').toLocaleDateString('en', { weekday: 'narrow' });

          return (
            <g key={day.date}>
              {/* Listening bar (bottom) */}
              <rect
                x={x + 2}
                y={100 - totalHeight}
                width={16}
                height={listenHeight}
                rx={2}
                className="fill-amber-400 dark:fill-amber-500"
              />
              {/* Conjugation bar (top) */}
              <rect
                x={x + 2}
                y={100 - totalHeight + listenHeight}
                width={16}
                height={conjHeight}
                rx={2}
                className="fill-indigo-500 dark:fill-indigo-400"
              />
              {/* Day label */}
              <text
                x={x + 10}
                y={115}
                textAnchor="middle"
                className="fill-slate-400 text-[8px] dark:fill-slate-500"
              >
                {dayLabel}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="mt-2 flex items-center justify-center gap-4 text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1">
          <span className="inline-block size-2 rounded-sm bg-indigo-500 dark:bg-indigo-400" />
          Conjugation
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block size-2 rounded-sm bg-amber-400 dark:bg-amber-500" />
          Listening
        </span>
      </div>
    </div>
  );
}

function BoxBar({ boxes, total }: { boxes: Record<number, number>; total: number }) {
  if (total === 0) return null;
  const colors: Record<number, string> = {
    1: 'bg-rose-500',
    2: 'bg-orange-400',
    3: 'bg-yellow-400',
    4: 'bg-lime-400',
    5: 'bg-emerald-500',
  };

  return (
    <div className="flex h-3 w-full overflow-hidden rounded-full">
      {[1, 2, 3, 4, 5].map((box) => {
        const count = boxes[box] ?? 0;
        if (count === 0) return null;
        const pct = (count / total) * 100;
        return (
          <div
            key={box}
            className={`${colors[box]} transition-all`}
            style={{ width: `${pct}%` }}
            title={`Box ${box}: ${count}`}
          />
        );
      })}
    </div>
  );
}

function CollapsibleSection({
  title,
  mastered,
  total,
  boxes,
}: {
  title: string;
  mastered: number;
  total: number;
  boxes: Record<number, number>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-slate-100 dark:border-slate-700/50">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-3 text-left"
      >
        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{title}</span>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {mastered}/{total} mastered
          <span className="ml-2 inline-block transition-transform" style={{ transform: open ? 'rotate(90deg)' : '' }}>
            ›
          </span>
        </span>
      </button>
      {open && (
        <div className="pb-3">
          <BoxBar boxes={boxes} total={total} />
          <div className="mt-2 flex justify-between text-[10px] text-slate-400 dark:text-slate-500">
            <span>Box 1 (new)</span>
            <span>Box 5 (mastered)</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function Statistics() {
  const data = useStatistics();

  if (!data) {
    return (
      <PageLayout>
        <Navigation title="Statistics" />
        <div className="flex flex-1 items-center justify-center text-slate-400">Loading...</div>
      </PageLayout>
    );
  }

  const tenseKeys = Object.keys(data.tenses) as TenseKey[];
  const categoryKeys = Object.keys(data.listeningCategories).sort();

  return (
    <PageLayout>
      <Navigation title="Statistics" />

      <div className="mt-4 flex flex-col gap-6">
        {/* Overview */}
        <OverviewCards data={data} />

        {/* Activity Chart */}
        <ActivityChart data={data.dailyActivity} />

        {/* Conjugation Breakdown */}
        <div className="rounded-xl border border-slate-200 bg-white px-4 dark:border-slate-700 dark:bg-slate-800">
          <h3 className="py-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
            Conjugation by Tense
          </h3>
          {tenseKeys.length === 0 ? (
            <p className="pb-3 text-sm text-slate-400">No conjugation data yet</p>
          ) : (
            tenseKeys.map((tk) => (
              <CollapsibleSection
                key={tk}
                title={TENSES[tk] ?? tk}
                mastered={data.tenses[tk]!.mastered}
                total={data.tenses[tk]!.total}
                boxes={data.tenses[tk]!.boxes}
              />
            ))
          )}
        </div>

        {/* Listening Breakdown */}
        <div className="rounded-xl border border-slate-200 bg-white px-4 dark:border-slate-700 dark:bg-slate-800">
          <h3 className="py-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
            Listening by Category
          </h3>
          {categoryKeys.length === 0 ? (
            <p className="pb-3 text-sm text-slate-400">No listening data yet</p>
          ) : (
            categoryKeys.map((cat) => (
              <CollapsibleSection
                key={cat}
                title={cat}
                mastered={data.listeningCategories[cat]!.mastered}
                total={data.listeningCategories[cat]!.total}
                boxes={data.listeningCategories[cat]!.boxes}
              />
            ))
          )}
        </div>
      </div>
    </PageLayout>
  );
}
```

**Step 2: Verify no type errors**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/pages/Statistics.tsx
git commit -m "feat(stats): create Statistics dashboard page"
```

---

### Task 6: Add route and home screen button

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/pages/Home.tsx`

**Step 1: Add route in App.tsx**

Add import at the top (after the Settings import, line 9):

```typescript
import { Statistics } from './pages/Statistics';
```

Add route after the settings route (line 26):

```typescript
          <Route path="/statistics" element={<Statistics />} />
```

**Step 2: Add Statistics button to Home.tsx**

Add a new button in `Home.tsx` after the Grammar Reference button (after line 67, before the closing `</div>` of the button container). Use a chart/bar-chart SVG icon:

```typescript
        <button
          onClick={() => navigate('/statistics')}
          className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5">
              <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75ZM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 0 1-1.875-1.875V8.625ZM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 0 1 3 19.875v-6.75Z" />
            </svg>
          </div>
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">Statistics</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              View your learning progress and activity
            </p>
          </div>
        </button>
```

**Step 3: Verify no type errors**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/App.tsx src/pages/Home.tsx
git commit -m "feat(stats): add statistics route and home screen button"
```

---

### Task 7: Visual verification and version bump

**Files:**
- Modify: `package.json` (version bump)

**Step 1: Start dev server and verify the dashboard**

Run: `npm run dev`

Verify:
1. Home screen shows "Statistics" button with bar chart icon
2. Clicking it navigates to `/statistics`
3. Navigation shows "Statistics" title with back button
4. Overview cards render (may show 0s if no data yet)
5. Activity chart renders (empty bars if no activity logged yet)
6. Conjugation/Listening sections show "No data yet" or collapsible entries
7. Dark mode works correctly (toggle theme)
8. Back button returns to home

**Step 2: Do a quick practice session to generate data**

1. Go to Verb Conjugation → do 2-3 cards
2. Check Statistics page — should show updated counts and activity chart bar for today
3. Check IndexedDB in DevTools — `activity` store should have entries

**Step 3: Bump version in package.json**

Change the `version` field in `package.json` to the next minor version (e.g., `"6.0.0"` → `"6.1.0"`).

**Step 4: Build check**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 5: Commit**

```bash
git add package.json
git commit -m "chore: bump version to 6.1.0 for statistics dashboard"
```

---

### Task 8: Add activity clearing to settings reset

**Files:**
- Modify: `src/pages/Settings.tsx`

**Step 1: Update the "Reset All Progress" handler**

Find the reset handler that calls `db.stats.clear()` and add `db.activity.clear()` alongside it:

```typescript
await db.stats.clear();
await db.activity.clear();
```

**Step 2: Verify the "Clear All Data & Cache" handler**

The nuclear reset that calls `db.delete()` already deletes the entire database, so `activity` is already covered. No change needed there.

**Step 3: Verify no type errors**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/pages/Settings.tsx
git commit -m "feat(stats): clear activity data on progress reset"
```
