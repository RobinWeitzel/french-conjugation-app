# Design: Spaced Repetition, Typed Input, Conjugation Table, Verb Tiers

Date: 2026-03-29

## 1. Spaced Repetition (Leitner 5-Box)

### Schema
Replace `mastered: boolean` with box-based SRS fields on `Stat`:

```typescript
interface Stat {
  id: string;
  correctCount: number;  // consecutive correct streak
  box: number;           // 1-5 Leitner box
  nextReview: string;    // ISO date string (date only, e.g. "2026-03-30")
  lastPracticed: string; // ISO timestamp
}
```

### Box Intervals
| Box | Interval | Meaning |
|-----|----------|---------|
| 1   | 0 days   | New / failed — review immediately |
| 2   | 1 day    | First success |
| 3   | 3 days   | Second success |
| 4   | 7 days   | Third success |
| 5   | 30 days  | Long-term retention |

### Logic
- **Correct**: Move card to next box (max 5). Set `nextReview = today + box interval`.
- **Incorrect**: Reset to Box 1. Set `nextReview = today` (review now).
- **Card pool**: Include cards where `nextReview <= today` OR no stat exists.
- **"All caught up"**: When no cards are due but some exist with future `nextReview`, show "All caught up! Next review in X" instead of "All mastered!".
- **Migration**: Existing stats with `mastered: true` → Box 5, `nextReview = lastPracticed + 30 days`. Stats with `mastered: false` → Box 1, `nextReview = today`.
- **DB version bump**: Dexie version 2, add index on `nextReview` for efficient queries.

## 2. Typed Input Mode

### Setup
New toggle on PracticeSetup: **Input Mode** — "Flashcard" (default) vs "Typing".
Persisted to localStorage key `practiceInputMode`.

### Typing Mode UI
- Front of card shows the prompt (same as flashcard mode).
- Below the card: text input field + accent button bar + Check button.
- **Accent bar**: Single row of buttons: `é è ê ë à â ù û ü ï î ô ç æ œ`
  - Tapping inserts character at cursor position in the input.
  - Styled as small pill buttons.
- Submit: Enter key or Check button.
- **Comparison**: Case-insensitive, trimmed. Accept "j'" as equivalent to "je" prefix for contracted forms. Compare only the conjugated form (not the pronoun).

### After Submit
- **Correct**: Green flash, show conjugation table, auto-count as correct (same as swipe right). Tap/Enter to advance.
- **Incorrect**: Red flash, show correct answer prominently + conjugation table, count as incorrect (same as swipe left). Tap/Enter to advance.
- Both feed into the same SRS box logic.

### Keyboard Shortcuts
- Enter: submit answer (if input has text) or advance to next card (after result shown)
- No space-to-flip in typing mode

## 3. Full Conjugation Table on Answer Side

### Display
After revealing the answer (flip in flashcard mode, or after submit in typing mode), show a compact conjugation table below the main answer:

```
je    suis        nous  sommes
tu    es          vous  êtes
il    est         ils   sont
```

- 3-row, 2-column layout (je/nous, tu/vous, il/ils).
- Current pronoun row highlighted with indigo background.
- Uses data from `verb.tenses[currentTense]`.
- Skips null entries (impersonal verbs).
- Shown on the back of the flashcard (scrollable if needed).

## 4. Verb Tiers with Progressive Unlocking

### Tier Definitions (in constants.ts)

**Tier 1 — Essential** (15 verbs):
être, avoir, aller, faire, pouvoir, vouloir, devoir, savoir, prendre, venir, dire, voir, falloir, donner, mettre

**Tier 2 — Common -er** (25 verbs):
parler, trouver, passer, demander, montrer, continuer, rester, porter, commencer, compter, penser, arriver, laisser, jouer, aimer, chercher, travailler, essayer, changer, créer, entrer, préparer, utiliser, proposer, apporter

**Tier 3 — -ir/-re & Common Irregulars** (20 verbs):
partir, sortir, servir, agir, réussir, choisir, rendre, répondre, attendre, perdre, défendre, suivre, vivre, lire, écrire, ouvrir, produire, atteindre, connaître, croire

**Tier 4 — Advanced** (40 verbs):
All remaining verbs not in Tiers 1-3.

### Unlock Logic
- Tier 1: Always unlocked.
- Tier N+1: Unlocked when ≥70% of Tier N's cards (across all selected tenses) are in Box 3 or higher.
- Unlock status computed dynamically from stats — no separate storage needed.

### Setup UI
- PracticeSetup shows tiers as selectable groups (similar to tense checkboxes).
- Locked tiers show a lock icon and progress bar toward unlock (e.g., "45/63 cards in Box 3+ — 71% needed").
- User selects which unlocked tiers to include.
- Persisted to localStorage key `practiceTiers`.
- Default: `[1]` (Tier 1 only for new users).

### Card Count Display
Each tier shows verb count and total card count for selected tenses.
