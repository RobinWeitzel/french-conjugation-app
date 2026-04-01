# Unlock Mechanic Rework Design

## Problem Statement

The current unlocking system has three key issues:
1. **Unlocks too fast**: Box >= 2 threshold means a single correct answer per card counts toward unlock. 70% of a tier can be "completed" in one session without any spaced review.
2. **Shared progress across directions**: Stat IDs lack direction — FR->EN and EN->FR flashcard practice write to the same stat key, cross-pollinating progress.
3. **No persistent unlock state**: Gate completions are recomputed from live stats every time. No permanent record of completed gates.

## Design Decisions

- **Approach A selected**: Direction encoded in stat ID + persistent gate completions in IndexedDB.
- **Completely separate direction tracking**: Zero cross-pollination between FR->EN and EN->FR.
- **Permanent unlocks**: Once a gate is completed, it stays completed forever.
- **Gate chain structure unchanged**: en-fr gets 8 gates (flashcard+typing per tier), fr-en gets 4 gates (flashcard only).
- **Progress visualization**: Tier badges for completed gates + stacked color bar for active gate.

## Data Model Changes

### Stat ID Format

Old: `{infinitive}_{pronoun}_{tense}_{mode}`
New: `{infinitive}_{pronoun}_{tense}_{mode}_{direction}`

Direction values: `enfr`, `fren`.

Example: `être_je_present_flashcard_enfr`

### New IndexedDB Store: `gateCompletions`

```ts
interface GateCompletion {
  id: string;          // "present_enfr_1_flashcard"
  tense: TenseKey;
  direction: Direction; // "en-fr" | "fr-en"
  tier: number;        // 1-4
  mode: InputMode;     // "flashcard" | "typing"
  completedAt: string; // ISO date
}
```

KeyPath: `id`. Once written, never deleted.

### DB Migration (v4 -> v5)

1. Read all existing stats from the `stats` store.
2. For each stat with a practice stat ID (not listening stats):
   - Create two new entries: one with `_enfr` suffix, one with `_fren` suffix.
   - Both copies retain the same box, nextReview, correctCount, lastPracticed values.
3. Delete old stat entries.
4. Create `gateCompletions` object store.
5. Evaluate all gates against migrated stats and pre-populate `gateCompletions` for any thresholds already met.

### Activity Store Update

Add `direction` field to activity log entries so statistics can show per-direction breakdowns.

## Unlock Logic

### Constants

```ts
TIER_UNLOCK_MIN_BOX = 3  // up from 2
TIER_UNLOCK_THRESHOLD = 0.7  // unchanged
```

### Gate Evaluation

1. Check `gateCompletions` store for this gate's ID. If found, gate is complete (permanent).
2. If not found, compute live:
   - Count cards in this tier where `stat.box >= TIER_UNLOCK_MIN_BOX`
   - Compute `ratio = count / total`
3. If `ratio >= TIER_UNLOCK_THRESHOLD`:
   - Write a `GateCompletion` record to IndexedDB (permanent).
   - Gate is now complete.
4. Frontier gate = first incomplete gate in the chain.

### Gate Chain (unchanged)

- en-fr: T1/flashcard -> T1/typing -> T2/flashcard -> T2/typing -> T3/flashcard -> T3/typing -> T4/flashcard -> T4/typing
- fr-en: T1/flashcard -> T2/flashcard -> T3/flashcard -> T4/flashcard

Evaluated per-tense, per-direction independently.

## Progress Visualization

### Setup Screen (per tense row)

Each tense displays:
- **Tier badges**: Compact icons/pills for each completed gate. For en-fr tiers with two gates (flashcard + typing), show two indicators per tier.
- **Stacked progress bar** for the active (frontier) gate.
- **70% threshold marker** on the bar.

### Stacked Bar Segments

The bar represents all cards in the active gate's tier:

| Segment | Color | Meaning |
|---------|-------|---------|
| Empty | Grey | Cards at box 1 (untouched or regressed) |
| In progress | Orange | Cards at box 2 (one correct, awaiting review) |
| Counting | Green | Cards at box 3+ (counting toward 70% unlock) |

The bar is always full-width. As the user progresses, grey shrinks, orange appears, then converts to green after successful reviews.

A vertical marker at 70% shows the unlock threshold. When green reaches past the marker, the gate completes, a new badge appears, and the bar resets for the next gate.

### Gate Override

Users can still tap completed gates to practice earlier tiers. Overrides are scoped to `{tense}_{direction}`.

## Scope Exclusions

No changes to:
- Leitner box intervals (0/1/3/7/30 days)
- Spaced repetition core logic
- Tier verb groupings (Essential, Common -er, Irregulars, Advanced)
- Listening mode (separate stat namespace)
- Typing vs flashcard mode mechanics
