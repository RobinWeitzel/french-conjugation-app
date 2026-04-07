# Fix Practice Progression Logic Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make session stats, completion screens, and daily practice flow cohesive and meaningful for language learning.

**Architecture:** All changes are in `src/pages/Practice.tsx`. The StatsBar denominator is changed from total gate cards to today's due cards. The completion screen is split into three states (no cards due, session complete, all mastered). The destructive reset button is replaced with safe navigation.

**Tech Stack:** React, TypeScript, IndexedDB (Dexie), Vite

---

## Background

Three problems with the practice page:

1. **Misleading remaining/total**: `gateTotalCards` counted ALL cards in the active gate (including scheduled-out ones). If 20 cards were due today out of 90 in the gate, the display showed "20/90 left" - progress felt invisible.

2. **Empty screen on session completion**: When all due cards were answered, users could end up staring at a blank card area with no clear message about what to do next.

3. **Destructive reset button**: "Reset & Practice Again" called `resetStats()` which wiped ALL spaced repetition progress from IndexedDB - a nuclear option that destroyed learning history.

## Key Files

- `src/pages/Practice.tsx` - Practice page component (all changes here)
- `src/hooks/useMastery.ts` - Session stats + IndexedDB stat updates (read-only reference)
- `src/components/StatsBar.tsx` - Stats display component (no changes needed)
- `src/lib/gates.ts` - Gate/tier computation (read-only reference)
- `src/lib/constants.ts` - BOX_INTERVALS, thresholds (read-only reference)

---

### Task 1: Fix StatsBar Denominator

**Files:**
- Modify: `src/pages/Practice.tsx:86` (state declaration)
- Modify: `src/pages/Practice.tsx:99` (remove `totalInGate` counter)
- Modify: `src/pages/Practice.tsx:136` (remove `totalInGate++`)
- Modify: `src/pages/Practice.tsx:169` (set `initialPoolSize`)
- Modify: `src/pages/Practice.tsx:330` (update `totalCards` alias)

**Step 1: Replace state variable**

Change:
```tsx
const [gateTotalCards, setGateTotalCards] = useState(0);
```
To:
```tsx
const [initialPoolSize, setInitialPoolSize] = useState(0);
```

**Step 2: Remove `totalInGate` counter from `buildCards`**

Remove `let totalInGate = 0;` declaration and `totalInGate++;` increment inside the loop.

**Step 3: Set `initialPoolSize` from actual card pool**

Change:
```tsx
setGateTotalCards(totalInGate);
```
To:
```tsx
setInitialPoolSize(allCards.length);
```

**Step 4: Update `totalCards` alias**

Change:
```tsx
const totalCards = gateTotalCards;
```
To:
```tsx
const totalCards = initialPoolSize;
```

**Step 5: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 6: Commit**

```bash
git add src/pages/Practice.tsx
git commit -m "fix: use session pool size as StatsBar denominator instead of gate total"
```

---

### Task 2: Replace Destructive Reset with Safe Navigation

**Files:**
- Modify: `src/pages/Practice.tsx:57` (remove unused destructured values)
- Modify: `src/pages/Practice.tsx:323-328` (replace `handleReset`)

**Step 1: Remove unused `resetStats` and `resetSession` from destructuring**

Change:
```tsx
const { sessionStats, recordCorrect, recordIncorrect, resetStats, resetSession, undo } = useMastery('conjugation');
```
To:
```tsx
const { sessionStats, recordCorrect, recordIncorrect, undo } = useMastery('conjugation');
```

**Step 2: Replace `handleReset` with `handleBackToSetup`**

Change:
```tsx
const handleReset = async () => {
  await resetStats();
  resetSession();
  setLoading(true);
  window.location.reload();
};
```
To:
```tsx
const handleBackToSetup = () => {
  window.location.href = '/practice-setup';
};
```

**Step 3: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/pages/Practice.tsx
git commit -m "fix: replace destructive reset with safe navigation back to setup"
```

---

### Task 3: Implement Three-State Completion Screen

**Files:**
- Modify: `src/pages/Practice.tsx:349-400` (the `allDone` render branch)

**Step 1: Replace the `allDone` render block**

The completion screen must handle three distinct states:

1. **`noPracticeDone`** (`initialPoolSize === 0`): User entered practice but all cards were already scheduled for future dates. Show "Nothing to practice right now" with next review date. Hide StatsBar. Show "Back to Setup" button.

2. **`hasScheduledCards`** (session completed, more cards scheduled later): Show "All caught up!" with session summary (X cards practiced, Y% accuracy) and next review date.

3. **All mastered** (no scheduled cards remain): Show "All mastered!" celebration.

Replace:
```tsx
if (allDone) {
  return (
    <PageLayout>
      <Navigation title="Practice" backTo="/practice-setup" />
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
```

With:
```tsx
if (allDone) {
  const attempted = sessionStats.correct + sessionStats.incorrect;
  const noPracticeDone = initialPoolSize === 0;

  return (
    <PageLayout>
      <Navigation title="Practice" backTo="/practice-setup" />
      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <div className="text-center">
          {noPracticeDone ? (
            <>
              <p className="text-4xl">📅</p>
              <h2 className="mt-4 text-xl font-semibold">Nothing to practice right now</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {nextReviewLabel
                  ? `Next review ${nextReviewLabel}. Come back then!`
                  : 'All cards are scheduled for later.'}
              </p>
            </>
          ) : hasScheduledCards ? (
            <>
              <p className="text-4xl">✅</p>
              <h2 className="mt-4 text-xl font-semibold">All caught up!</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                You practiced {attempted} {attempted === 1 ? 'card' : 'cards'}
                {attempted > 0 && ` (${Math.round((sessionStats.correct / attempted) * 100)}% accuracy)`}.
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Next review {nextReviewLabel}. Come back then to keep your streak!
              </p>
            </>
          ) : (
            <>
              <p className="text-4xl">🎉</p>
              <h2 className="mt-4 text-xl font-semibold">All mastered!</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                You've mastered all cards in the selected tenses.
              </p>
            </>
          )}
        </div>
        <button
          onClick={handleBackToSetup}
          className="rounded-xl bg-indigo-500 px-8 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-indigo-600"
        >
          Back to Setup
        </button>
      </div>
      {!noPracticeDone && (
        <StatsBar stats={sessionStats} remaining={0} total={totalCards} />
      )}
    </PageLayout>
  );
}
```

**Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Manual verification**

Start dev server: `npm run dev`

Test scenarios:
1. **Normal session**: Start practice with due cards -> verify "X/Y left" where Y = number of due cards (not gate total) -> answer cards -> verify counter decrements correctly
2. **Session completion**: Answer all due cards -> verify "All caught up!" screen shows with session summary and accuracy
3. **No cards due**: Schedule all cards for future via IndexedDB -> reload -> verify "Nothing to practice right now" screen with next review date and no StatsBar
4. **Back to Setup button**: Click button -> verify it navigates to `/practice-setup` WITHOUT wiping IndexedDB stats

**Step 4: Commit**

```bash
git add src/pages/Practice.tsx
git commit -m "fix: add three-state completion screen for practice sessions"
```

---

## Verification Summary

| Scenario | Before | After |
|----------|--------|-------|
| Stats display | "18/90 left" (gate total) | "18/20 left" (today's due cards) |
| Session completed | Generic "All caught up!" | "All caught up! You practiced 20 cards (85% accuracy). Next review tomorrow." |
| No cards due on entry | Blank card area, "0/0 left" | "Nothing to practice right now. Next review tomorrow. Come back then!" |
| Reset button | Wipes ALL spaced repetition data | Navigates to setup (preserves progress) |
