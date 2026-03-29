# Statistics Dashboard Design

## Goal

Add a flat dashboard page showing count-based statistics for both conjugation and listening practice, with a simple 14-day activity chart.

## Approach

**Pure Computed Stats (Approach A):** Compute all metrics from the existing `stats` store. Add a lightweight `activity` store for the daily activity chart. No changes to existing stat schema.

## Data Layer

### New IndexedDB store: `activity` (DB version 4)

Schema: keyPath `id` (auto-increment), indexed by `date`.

```typescript
interface Activity {
  id?: number;
  date: string;       // "YYYY-MM-DD"
  mode: "conjugation" | "listening";
  correct: boolean;
}
```

Written on every answer via `recordCorrect` / `recordIncorrect` in `useMastery`.

### Computed from existing `stats` store

- **Mastery counts:** count stats where `box >= 5` vs total
- **Box distribution:** group by box number (1-5)
- **Per-tense breakdown:** parse stat `id` format `{infinitive}_{pronoun}_{tense}_{mode}` to extract tense
- **Listening stats:** filter stats with `listening_` prefix, group by category

## Dashboard Layout

Single `/statistics` page, vertical scroll:

### 1. Overview Cards (top row)
- Total Cards Practiced (unique stat entries)
- Mastered (box 5 count / total, with percentage)
- Overall Accuracy (correct / total from activity log)

### 2. Daily Activity Chart
- Bar chart: cards practiced per day, last 14 days
- Stacked bars: conjugation vs listening
- Plain SVG (no chart library)

### 3. Conjugation Breakdown
- One collapsible section per tense (Present, Passe Compose, Imparfait, Futur, Conditionnel)
- Each shows: mastered/total, box distribution bar (box 1=red to box 5=green)

### 4. Listening Breakdown
- Same format, grouped by sentence category

## Files

### New
- `src/pages/Statistics.tsx` — dashboard page
- `src/hooks/useStatistics.ts` — queries stats + activity, computes aggregates

### Modified
- `src/lib/db.ts` — version 4 with `activity` store
- `src/lib/types.ts` — `Activity` type
- `src/hooks/useMastery.ts` — write to `activity` on each answer
- `src/pages/Home.tsx` — add Statistics button
- `src/App.tsx` — add `/statistics` route

## Constraints

- No external chart libraries (plain SVG)
- Follows existing Tailwind + dark mode patterns
- No time-based metrics (counts only)
- Activity data is forward-looking only (no retroactive history)
