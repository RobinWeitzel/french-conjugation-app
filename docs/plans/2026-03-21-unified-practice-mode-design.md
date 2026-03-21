# Unified Practice Mode — Design Document

**Date**: 2026-03-21
**Status**: Approved

## Summary

Rework the French Conjugation app to replace the separate "Conjugation Practice" and "Tense Practice" modes with a single unified practice mode. The new mode combines tense and conjugation practice using flashcards with swipe gestures. Users can choose English→French or French→English direction and optionally show the verb infinitive as a hint.

## Architecture

### Approach: Clean File Structure (Approach B)

New purpose-named files replace all old mode-specific files.

### File Structure

**Keep (modified):**
- `index.html` — Home screen with mode cards (one mode now, extensible)
- `shared.js` — DB layer, verb loading, utilities
- `shared.css` — Common styles (absorb duplicated CSS)
- `settings.html` / `settings.js` / `settings.css` — Cache/data management
- `sw.js` — Service worker (updated file list + cache bump)
- `words.json` — Unified data (expanded with all tenses + English phrases)

**New files:**
- `practice-setup.html` / `practice-setup.js` — Config: tense selection, direction toggle, infinitive toggle
- `practice.html` / `practice.js` / `practice.css` — Flashcard practice with swipe

**Delete:**
- `conjugation.html`, `conjugation-mode.html`, `conjugation-multiple-choice.html`
- `tenses.html`, `tenses-mode.html`, `tenses-practice.html`, `tenses-multiple-choice.html`
- `app.js`, `tenses-practice.js`, `conjugation-multiple-choice.js`, `tenses-multiple-choice.js`
- `styles.css`, `tenses-practice.css`, `multiple-choice.css`
- `tense-practice-words.json`

### Navigation Flow

```
index.html → practice-setup.html → practice.html
     ↓
settings.html
```

## Unified Data Format

Single `words.json` (version bumped to 2.0.0). Each verb has conjugation tables per tense with English translations:

```json
{
  "version": "2.0.0",
  "verbs": [
    {
      "infinitive": "aller",
      "english": "to go",
      "tenses": {
        "present": {
          "je": { "french": "vais", "english": "I go" },
          "tu": { "french": "vas", "english": "you go" },
          "il": { "french": "va", "english": "he goes" },
          "nous": { "french": "allons", "english": "we go" },
          "vous": { "french": "allez", "english": "you go" },
          "ils": { "french": "vont", "english": "they go" }
        },
        "passe_compose": { ... },
        "imparfait": { ... },
        "futur": { ... },
        "conditionnel": { ... }
      }
    }
  ]
}
```

The old `conjugations` field is removed. `tense-practice-words.json` is deleted.

## Practice Setup Screen

`practice-setup.html` — single config page:

1. **Header**: "Practice Setup" + back button to home
2. **Direction toggle**: "English → French" | "French → English" (two-option toggle)
3. **Show infinitive toggle**: Checkbox — "Show verb infinitive as hint"
4. **Tense selection**: Checkboxes for Présent, Passé Composé, Imparfait, Futur Simple, Conditionnel. Select All/Deselect All button.
5. **Start button**: "Start Practice" (disabled if no tenses selected)

All selections saved to `localStorage`. Config passed to practice.html via URL params.

## Flashcard Practice

### Card Content

**English → French mode:**
- Front: English phrase (e.g., "he goes"). Optional infinitive hint "(aller)".
- Back: French conjugation (e.g., "il va") + tense name.

**French → English mode:**
- Front: French conjugation (e.g., "il va") + tense name. Optional infinitive hint "(aller)".
- Back: English phrase (e.g., "he goes").

### Interactions (preserved from current app)

- Tap/click to flip (3D card animation)
- Swipe right = correct, swipe left = incorrect
- Keyboard: Space to flip, Arrow keys to swipe
- Visual swipe feedback (translateX + rotate + opacity)
- Touch (50px threshold) + mouse (100px threshold) gesture detection

### Stats Bar

Top of screen: Incorrect (red) | Accuracy (blue) | Correct (green). Session-scoped.

### Mastery System

- Key format: `${infinitive}_${pronoun}_${tense}` (e.g., "aller_je_present")
- 3 consecutive correct = mastered, removed from card pool
- Incorrect answer resets counter to 0
- Stats stored in IndexedDB `stats` store
- All mastered → congratulations message + "Reset Progress" option

### Footer

- "X cards remaining" count
- Reset button for current session's progress

## Cleanup & Improvements

1. **CSS consolidation**: Merge duplicated session-stats, card, swipe, and animation styles into `shared.css` + `practice.css`
2. **Remove inline JS**: Extract inline JavaScript from old HTML files into `practice-setup.js`
3. **Service worker update**: New file list in `sw.js`, pattern-based network-first strategy instead of hardcoded filenames
4. **Unified data loading**: Both screens use `shared.js` `loadVerbs()` with version checking
5. **Stats key format**: `${infinitive}_${pronoun}_${tense}` for the unified mode
6. **Remove redundancy**: Drop old `conjugations` field from data format
