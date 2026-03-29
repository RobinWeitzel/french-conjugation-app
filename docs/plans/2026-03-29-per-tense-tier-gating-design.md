# Per-Tense Tier Gating Design

**Goal:** Redesign the tier gating system so each tense has an independent progression chain through tiers and input modes (flashcard, then typing), replacing the current global tier/mode selection.

**Approach:** Compute unlock status on the fly from stats (no new DB tables). Expand stat IDs to include input mode. Restructure the setup UI to show per-tense progression detail.

---

## Progression Model

### Per-Tense Linear Chain (en-fr direction)

Each tense has 8 sequential gates:

```
T1 Flashcard → T1 Typing → T2 Flashcard → T2 Typing → T3 Flashcard → T3 Typing → T4 Flashcard → T4 Typing
```

### Per-Tense Chain (fr-en direction)

Typing doesn't apply for fr-en, so only 4 gates:

```
T1 Flashcard → T2 Flashcard → T3 Flashcard → T4 Flashcard
```

### Unlock Rules

- **Gate 1 (T1 Flashcard):** Always unlocked
- **Each subsequent gate:** Unlocks when the previous gate's tier+mode reaches 70% mastery (box >= 3)
- **Mastery is per-tense:** Présent and Passé Composé are fully independent tracks
- **Threshold:** `TIER_UNLOCK_THRESHOLD = 0.7`, `TIER_UNLOCK_MIN_BOX = 3` (unchanged)

### Unlock Dependency Table

| Gate | Unlocks when... |
|------|----------------|
| T1 Flashcard | Always |
| T1 Typing | 70% of T1 flashcard stats at box 3+ |
| T2 Flashcard | 70% of T1 typing stats at box 3+ |
| T2 Typing | 70% of T2 flashcard stats at box 3+ |
| T3 Flashcard | 70% of T2 typing stats at box 3+ |
| T3 Typing | 70% of T3 flashcard stats at box 3+ |
| T4 Flashcard | 70% of T3 typing stats at box 3+ |
| T4 Typing | 70% of T4 flashcard stats at box 3+ |

---

## Stat ID Format

**Old format:** `${infinitive}_${pronoun}_${tense}`

**New format:** `${infinitive}_${pronoun}_${tense}_${mode}`

Where `mode` is `flashcard` or `typing`.

### Migration

- DB version bump (version 3)
- On upgrade, all existing stats get `_flashcard` appended to their ID
- This gives users credit for existing flashcard progress
- Typing track starts fresh (correct — no typing practice has occurred)

---

## Settings Storage

### Removed

- `practiceInputMode` — no longer global; mode is determined by the gate
- `practiceTiers` — no longer global; tier is determined by the gate

### Kept

- `practiceDirection` — en-fr or fr-en
- `practiceShowInfinitive` — boolean
- `practiceTenses` — array of selected tenses

### Added

- `practiceGateOverrides` — `Record<TenseKey, { tier: number, mode: InputMode } | null>` — per-tense overrides when user taps a specific gate instead of using auto-frontier. `null` means use frontier. Defaults to `{}`.

---

## Practice Setup UI

### Layout

1. **Direction toggle** (en-fr / fr-en) — unchanged
2. **Show infinitive hint** — unchanged
3. **Tense selection** — multi-select grid (unchanged)
4. **Per-tense progression** — NEW: for each selected tense, show a compact progression track
5. **Start Practice** button

### Per-Tense Progression Track

For each selected tense, display a horizontal row of gate indicators:

```
Présent
[T1F ✓] [T1T ✓] [T2F ●] [T2T 🔒] [T3F 🔒] [T3T 🔒] [T4F 🔒] [T4T 🔒]
                  ▓▓▓▓░░ 45/63

Passé Composé
[T1F ●] [T1T 🔒] [T2F 🔒] [T2T 🔒] [T3F 🔒] [T3T 🔒] [T4F 🔒] [T4T 🔒]
 ▓▓▓░░░ 32/63
```

- **✓** = completed (70%+ at box 3+)
- **●** = current frontier (auto-selected for practice)
- **🔒** = locked
- Progress bar shows progress toward completing the current frontier gate
- Tapping any unlocked or completed gate overrides the auto-frontier selection

### fr-en Direction

When direction is fr-en, the track only shows flashcard gates (4 items instead of 8). The typing gates are hidden since typing doesn't apply.

---

## Practice Page Changes

### Per-Card Input Mode

Cards now carry their input mode. When building the card deck:

1. For each selected tense, determine the active gate (frontier or override)
2. Build cards for that gate's tier verbs
3. Tag each card with the gate's mode (`flashcard` or `typing`)
4. Use stat ID `${infinitive}_${pronoun}_${tense}_${mode}`

The practice page renders each card according to its mode — flashcard-style (flip + swipe) or typing-style (text input + flip to reveal).

### Direction Override

When direction is fr-en, all cards use flashcard mode regardless of gate (same as current behavior where fr-en forces flashcard).

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/types.ts` | Add `mode` field to `PracticeCard`. Add `Gate`, `GateStatus` types. |
| `src/lib/db.ts` | Add DB version 3 migration: append `_flashcard` to all stat IDs |
| `src/hooks/useSettings.ts` | Remove `practiceInputMode` and `practiceTiers`. Add `practiceGateOverrides`. |
| `src/hooks/useMastery.ts` | No changes needed (stat ID is constructed by caller) |
| `src/pages/PracticeSetup.tsx` | Rewrite `useTierUnlockStatus` to compute per (tense, tier, mode). New per-tense progression UI. Gate override selection. |
| `src/pages/Practice.tsx` | Build cards with mode from gate. Per-card flashcard/typing rendering. Remove global `inputMode` usage. |

### Not Changed

- Listening mode, Grammar Reference
- `words.json`, `sentences.json`
- `ConjugationTable`, `Flashcard`, `SwipeContainer`, `TypingInput` components
- Service worker, build config
