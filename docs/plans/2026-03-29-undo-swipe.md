# Undo Swipe Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a single-level undo button to flashcard and listening swipe modes that reverts the last swipe's stat recording and returns the user to the answer card.

**Architecture:** Before each stat write, snapshot the previous state. The `undo()` function restores the snapshot to IndexedDB, deletes the activity record, and decrements session counters. Pages re-insert the card and restore the flip state.

**Tech Stack:** React 19, Dexie 4 (IndexedDB), Tailwind 4, framer-motion.

---

### Task 1: Add undo capability to useMastery hook

**Files:**
- Modify: `src/hooks/useMastery.ts`

**Step 1: Add the UndoSnapshot type and ref**

Add `useRef` to the React import (line 1). After the `SessionStats` state declaration (line 17), add:

```typescript
const lastActionRef = useRef<{
  statId: string;
  previousStat: Stat | null;
  activityId: number;
  wasCorrect: boolean;
} | null>(null);
```

**Step 2: Modify recordCorrect to capture snapshot**

Replace the `recordCorrect` implementation (lines 24-40) with:

```typescript
const recordCorrect = useCallback(async (id: string): Promise<boolean> => {
  const stat = await getStat(id);
  const previousStat = (await db.stats.get(id)) ?? null;
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
  const activityId = await db.activity.add({ date: today, mode, correct: true });
  lastActionRef.current = { statId: id, previousStat, activityId: activityId as number, wasCorrect: true };
  return interval > 0;
}, [getStat, mode]);
```

**Step 3: Modify recordIncorrect to capture snapshot**

Replace the `recordIncorrect` implementation (lines 42-54) with:

```typescript
const recordIncorrect = useCallback(async (id: string) => {
  const previousStat = (await db.stats.get(id)) ?? null;
  const stat = await getStat(id);
  const today = getToday();
  await db.stats.put({
    ...stat,
    correctCount: 0,
    box: 1,
    nextReview: today,
    lastPracticed: new Date().toISOString(),
  });
  setSessionStats((s) => ({ ...s, incorrect: s.incorrect + 1 }));
  const activityId = await db.activity.add({ date: today, mode, correct: false });
  lastActionRef.current = { statId: id, previousStat, activityId: activityId as number, wasCorrect: false };
}, [getStat, mode]);
```

**Step 4: Add the undo function**

After `recordIncorrect`, add:

```typescript
const undo = useCallback(async () => {
  const action = lastActionRef.current;
  if (!action) return null;

  // Restore previous stat
  if (action.previousStat) {
    await db.stats.put(action.previousStat);
  } else {
    await db.stats.delete(action.statId);
  }

  // Delete the activity record
  await db.activity.delete(action.activityId);

  // Decrement session counter
  setSessionStats((s) => ({
    correct: s.correct - (action.wasCorrect ? 1 : 0),
    incorrect: s.incorrect - (action.wasCorrect ? 0 : 1),
  }));

  lastActionRef.current = null;
  return action;
}, []);
```

**Step 5: Add canUndo flag and export undo**

After the `undo` function, add:

```typescript
const canUndo = lastActionRef.current !== null;
```

Update the return statement (line 76) to include `undo` and `canUndo`:

```typescript
return { sessionStats, recordCorrect, recordIncorrect, isDue, resetStats, resetSession, undo, canUndo };
```

**Step 6: Verify no type errors**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 7: Commit**

```bash
git add src/hooks/useMastery.ts
git commit -m "feat(undo): add undo capability to useMastery hook"
```

---

### Task 2: Add undo button to StatsBar

**Files:**
- Modify: `src/components/StatsBar.tsx`

**Step 1: Add onUndo prop**

Update the `StatsBarProps` interface and component to accept an optional `onUndo` callback:

```typescript
import type { SessionStats } from '../lib/types';

interface StatsBarProps {
  stats: SessionStats;
  remaining: number;
  total: number;
  onUndo?: () => void;
}

export function StatsBar({ stats, remaining, total, onUndo }: StatsBarProps) {
  const attempted = stats.correct + stats.incorrect;
  const accuracy = attempted > 0 ? Math.round((stats.correct / attempted) * 100) : 0;

  return (
    <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
      <div className="flex items-center gap-4">
        <span className="text-emerald-600 dark:text-emerald-400">{stats.correct} correct</span>
        <span className="text-rose-600 dark:text-rose-400">{stats.incorrect} incorrect</span>
        {onUndo && (
          <button
            onClick={onUndo}
            className="rounded-lg px-2 py-0.5 text-xs font-medium text-indigo-500 transition-colors hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-500/10"
          >
            Undo
          </button>
        )}
      </div>
      <div className="flex gap-4">
        {attempted > 0 && <span>{accuracy}%</span>}
        <span>{remaining}/{total} left</span>
      </div>
    </div>
  );
}
```

**Step 2: Verify no type errors**

Run: `npx tsc --noEmit`
Expected: No errors (existing callers don't pass `onUndo`, which is fine since it's optional)

**Step 3: Commit**

```bash
git add src/components/StatsBar.tsx
git commit -m "feat(undo): add optional undo button to StatsBar"
```

---

### Task 3: Wire undo into Practice page (flashcard mode only)

**Files:**
- Modify: `src/pages/Practice.tsx`

**Step 1: Destructure undo from useMastery**

On line 25, add `undo` to the destructured return:

```typescript
const { sessionStats, recordCorrect, recordIncorrect, resetStats, resetSession, undo } = useMastery('conjugation');
```

**Step 2: Add lastSwipe ref**

After the `swipeRef` declaration (line 27), add:

```typescript
const lastSwipeRef = useRef<{
  card: PracticeCard;
  index: number;
  wasRemoved: boolean;
} | null>(null);
```

**Step 3: Track canUndo state**

After the `typingResult` state (line 34), add:

```typescript
const [undoAvailable, setUndoAvailable] = useState(false);
```

**Step 4: Modify handleSwipeRight to save snapshot**

Replace `handleSwipeRight` (lines 143-159) with:

```typescript
const handleSwipeRight = useCallback(async () => {
  if (!currentCard) return;
  lastSwipeRef.current = { card: currentCard, index: currentIndex, wasRemoved: false };
  const removed = await recordCorrect(currentCard.statId);
  if (removed) {
    lastSwipeRef.current.wasRemoved = true;
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
  setUndoAvailable(true);
}, [currentCard, recordCorrect, nextCard, resetFlip, currentIndex]);
```

**Step 5: Modify handleSwipeLeft to save snapshot**

Replace `handleSwipeLeft` (lines 161-165) with:

```typescript
const handleSwipeLeft = useCallback(async () => {
  if (!currentCard) return;
  lastSwipeRef.current = { card: currentCard, index: currentIndex, wasRemoved: false };
  await recordIncorrect(currentCard.statId);
  nextCard();
  setUndoAvailable(true);
}, [currentCard, currentIndex, recordIncorrect, nextCard]);
```

**Step 6: Add handleUndo function**

After `handleSwipeLeft`, add:

```typescript
const handleUndo = useCallback(async () => {
  const lastSwipe = lastSwipeRef.current;
  if (!lastSwipe) return;

  const action = await undo();
  if (!action) return;

  if (lastSwipe.wasRemoved) {
    // Re-insert card at its original position
    setCards((prev) => {
      const next = [...prev];
      const insertAt = Math.min(lastSwipe.index, next.length);
      next.splice(insertAt, 0, lastSwipe.card);
      return next;
    });
    setCurrentIndex(lastSwipe.index);
  } else {
    // Card wasn't removed, just go back to it
    setCurrentIndex(lastSwipe.index);
  }

  // Show the answer side
  resetFlip();
  // Use setTimeout to flip after the card renders
  setTimeout(() => flip(), 50);

  setTypingResult(null);
  lastSwipeRef.current = null;
  setUndoAvailable(false);
}, [undo, resetFlip, flip]);
```

**Step 7: Clear undo on next normal swipe (already done in steps 4-5 via overwriting lastSwipeRef)**

The `setUndoAvailable(true)` at the end of each swipe handler replaces the previous undo state. But we should also clear it when typing mode handles swipes (since undo is flashcard-only). In `handleTypingAdvance` (around line 175), the function calls `handleSwipeRight` or `handleSwipeLeft` which will set undo — but we want to suppress undo for typing mode. Add this after the `handleTypingAdvance` function:

No, actually the design says typing mode should NOT have undo. Since `handleTypingAdvance` calls the same swipe handlers, we need to clear undo after typing advances. Modify `handleTypingAdvance`:

```typescript
const handleTypingAdvance = useCallback(async () => {
  if (!typingResult || !currentCard) return;
  if (typingResult === 'correct') {
    await handleSwipeRight();
  } else {
    await handleSwipeLeft();
  }
  // No undo for typing mode
  lastSwipeRef.current = null;
  setUndoAvailable(false);
}, [typingResult, currentCard, handleSwipeRight, handleSwipeLeft]);
```

**Step 8: Pass onUndo to StatsBar**

Find the main practice view's `StatsBar` (line 362) and update:

```typescript
<StatsBar
  stats={sessionStats}
  remaining={cards.length}
  total={totalCards}
  onUndo={undoAvailable && cardMode === 'flashcard' ? handleUndo : undefined}
/>
```

Also update the "all done" StatsBar (line 260) — no undo there, so leave it as-is.

**Step 9: Verify no type errors**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 10: Commit**

```bash
git add src/pages/Practice.tsx
git commit -m "feat(undo): wire undo into Practice page for flashcard mode"
```

---

### Task 4: Wire undo into Listening page

**Files:**
- Modify: `src/pages/Listening.tsx`

**Step 1: Destructure undo from useMastery**

On line 18, add `undo`:

```typescript
const { sessionStats, recordCorrect, recordIncorrect, resetStats, resetSession, undo } = useMastery('listening');
```

**Step 2: Add lastSwipe ref and undoAvailable state**

After the `loading` state (line 25), add:

```typescript
const lastSwipeRef = useRef<{
  card: ListeningCard;
  index: number;
  wasRemoved: boolean;
} | null>(null);
const [undoAvailable, setUndoAvailable] = useState(false);
```

**Step 3: Modify handleSwipeRight**

Replace `handleSwipeRight` (lines 94-110) with:

```typescript
const handleSwipeRight = useCallback(async () => {
  if (!currentCard) return;
  lastSwipeRef.current = { card: currentCard, index: currentIndex, wasRemoved: false };
  const removedFromSession = await recordCorrect(currentCard.statId);
  if (removedFromSession) {
    lastSwipeRef.current.wasRemoved = true;
    setCards((prev) => {
      const next = prev.filter((c) => c.statId !== currentCard.statId);
      if (currentIndex >= next.length && next.length > 0) {
        setCurrentIndex(0);
      }
      return next;
    });
    stop();
    resetFlip();
  } else {
    nextCard();
  }
  setUndoAvailable(true);
}, [currentCard, currentIndex, recordCorrect, nextCard, resetFlip, stop]);
```

**Step 4: Modify handleSwipeLeft**

Replace `handleSwipeLeft` (lines 112-116) with:

```typescript
const handleSwipeLeft = useCallback(async () => {
  if (!currentCard) return;
  lastSwipeRef.current = { card: currentCard, index: currentIndex, wasRemoved: false };
  await recordIncorrect(currentCard.statId);
  nextCard();
  setUndoAvailable(true);
}, [currentCard, currentIndex, recordIncorrect, nextCard]);
```

**Step 5: Add handleUndo function**

After `handleSwipeLeft`, add:

```typescript
const handleUndo = useCallback(async () => {
  const lastSwipe = lastSwipeRef.current;
  if (!lastSwipe) return;

  const action = await undo();
  if (!action) return;

  if (lastSwipe.wasRemoved) {
    setCards((prev) => {
      const next = [...prev];
      const insertAt = Math.min(lastSwipe.index, next.length);
      next.splice(insertAt, 0, lastSwipe.card);
      return next;
    });
    setCurrentIndex(lastSwipe.index);
  } else {
    setCurrentIndex(lastSwipe.index);
  }

  stop();
  resetFlip();
  setTimeout(() => flip(), 50);

  lastSwipeRef.current = null;
  setUndoAvailable(false);
}, [undo, resetFlip, flip, stop]);
```

**Step 6: Pass onUndo to StatsBar**

Update the main StatsBar (line 263):

```typescript
<StatsBar
  stats={sessionStats}
  remaining={cards.length}
  total={totalCards}
  onUndo={undoAvailable ? handleUndo : undefined}
/>
```

Leave the "all done" StatsBar (line 175) as-is.

**Step 7: Verify no type errors**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 8: Commit**

```bash
git add src/pages/Listening.tsx
git commit -m "feat(undo): wire undo into Listening page"
```

---

### Task 5: Visual verification and version bump

**Files:**
- Modify: `package.json` (version bump)

**Step 1: Start dev server and test undo in Practice (flashcard mode)**

Run: `npm run dev`

1. Navigate to Verb Conjugation → select a tense → start practice
2. Flip a card, swipe right (correct) — verify "Undo" button appears in stats bar
3. Press Undo — verify the card reappears with the answer showing
4. Swipe the card again (opposite direction this time)
5. Verify the stats bar counts are correct (no double counting)
6. Verify Undo disappears after being used
7. Swipe another card, then swipe the next card — verify Undo now refers to the latest swipe only

**Step 2: Test undo in Listening mode**

1. Navigate to Listening Practice → start
2. Flip, swipe right — verify Undo appears
3. Press Undo — card reappears with answer
4. Verify audio doesn't auto-play on undo (it shouldn't since the card shows answer side)

**Step 3: Test typing mode has no undo**

1. Set up practice in en-fr direction (typing mode)
2. Type an answer, advance — verify NO Undo button appears

**Step 4: Test dark mode**

Toggle dark mode, verify Undo button styling looks correct.

**Step 5: Bump version**

Change `package.json` version from `"6.1.0"` to `"6.2.0"`.

**Step 6: Build check**

Run: `npm run build`
Expected: Build succeeds

**Step 7: Commit**

```bash
git add package.json
git commit -m "chore: bump version to 6.2.0 for undo swipe feature"
```
