# Undo Swipe Design

## Goal

Add a single-level undo button to flashcard/listening swipe modes that reverts the last swipe, restoring stats, activity records, session counters, and card state so the user can re-swipe.

## Approach

**Snapshot + Restore (Approach A):** Before each swipe's stat write, snapshot the previous state. Undo restores the snapshot to IndexedDB, deletes the activity record, and re-inserts the card into the session.

## Scope

- Flashcard swipe mode in Practice page
- Listening page swipe mode
- NOT typing mode (user requested exclusion)
- Single level only (one undo, cleared on next swipe)

## Data Layer (useMastery)

### UndoSnapshot

```typescript
interface UndoSnapshot {
  statId: string;
  previousStat: Stat | null;  // null if card was new
  activityId: number;          // auto-increment ID to delete
  wasCorrect: boolean;
}
```

### Changes to recordCorrect / recordIncorrect

- Before writing to IndexedDB, capture current stat via `getStat(id)`
- After `db.activity.add()`, capture the returned auto-increment ID
- Store both in a `lastAction` ref

### New undo() function

1. Restore previous stat (`db.stats.put` or `db.stats.delete` if new card)
2. Delete activity record by ID (`db.activity.delete`)
3. Decrement session counter (correct or incorrect)
4. Clear `lastAction` ref
5. Return the snapshot for UI restoration

## UI Layer (Practice + Listening pages)

### Per-page state

A `lastSwipe` ref storing:
- The card object that was swiped
- Its index in the cards array
- Whether it was removed from the array

### On swipe

Save current card/index to `lastSwipe` before calling record functions.

### Undo button behavior

1. Call `useMastery.undo()`
2. If card was removed, re-insert at original index
3. Set `currentIndex` to saved index
4. Show card on answer side (flipped)
5. Clear `lastSwipe` (button disappears)

### Button placement

Inline in StatsBar area via optional `onUndo` prop. Only visible when `lastSwipe` is set.

### Clearing

`lastSwipe` is cleared on: undo press, next normal swipe, or session end.

## Files

### Modified
- `src/hooks/useMastery.ts` — snapshot capture, `undo()` function
- `src/pages/Practice.tsx` — `lastSwipe` ref, undo button (flashcard only)
- `src/pages/Listening.tsx` — same undo logic
- `src/components/StatsBar.tsx` — optional `onUndo` prop for undo button

### No new files needed

## Constraints

- No new dependencies
- Single undo level only
- Must correctly handle: card removal/re-insertion, stat restoration, activity deletion, session counter adjustment
- Version bump to 6.2.0
