# Listening Comprehension Mode — Design

## Overview

A new practice mode where users listen to French sentences via text-to-speech and test their comprehension. Sentences are organized by real-world categories (greetings, restaurant, shopping, etc.). Uses the same flashcard/swipe/mastery pattern as verb practice.

## Data Format — sentences.json

```json
{
  "version": "1.0.0",
  "sentences": [
    {
      "id": "greetings_001",
      "category": "greetings",
      "french": "Bonjour, comment allez-vous ?",
      "english": "Hello, how are you?"
    }
  ],
  "categories": {
    "greetings": "Greetings & Small Talk",
    "restaurant": "At the Restaurant",
    "shopping": "Shopping",
    "directions": "Asking for Directions",
    "travel": "Travel & Transport",
    "phone": "Phone Conversations"
  }
}
```

Each sentence has a unique `id` used for stats tracking. Categories defined in the same file with display names.

## IndexedDB Changes

- **New object store:** `sentences` (keyPath: `id`)
- **DB version bump:** v3 → v4 to add the `sentences` store in `onupgradeneeded`
- **Stats store:** Reuse existing `stats` store with key format `listening_{id}` (e.g., `listening_greetings_001`)
  - Same schema: `{ id, correct, incorrect, totalAttempts, lastPracticed }`
- **Metadata:** Store sentences.json version as key `sentences_version` (independent from verb data version)

## New Files

```
├── listening-setup.html    # Category selection page
├── listening-setup.js      # Setup logic, localStorage persistence
├── listening.html          # Flashcard practice with audio
├── listening.js            # TTS, card flip, swipe, mastery
├── listening.css           # Audio-specific styles (play button, card)
└── sentences.json          # Sentence data
```

## Modified Files

- `index.html` — Add "Listening Practice" mode card
- `shared.js` — DB v4, new `sentences` store, sentence loading utilities, bump APP_VERSION
- `sw.js` — Add new files to urlsToCache, bump CACHE_NAME
- `version.json` — Match APP_VERSION
- `CLAUDE.md` — Update file structure and version references

## User Flow

1. Home screen → "Listening Practice" card
2. Listening Setup → checklist of categories (same UI pattern as tense selection)
3. Practice screen:
   - Card front: large play button + category label, tap to play French audio
   - User can replay unlimited times
   - Tap card to flip → see French text + English translation
   - Swipe right (understood) or left (didn't understand)
   - 3 consecutive correct = mastered, sentence removed from pool
   - All mastered → congratulations + reset option

## TTS Implementation

- **API:** Web Speech API (`speechSynthesis`) — built into all browsers, works offline, zero bundle size
- **Voice selection:** Prefer `fr-FR` voices, then any `fr-*` variant. Prefer `localService: true` (offline). Store selected voice for session.
- **Playback:** `rate: 0.9` (slightly slower for learners). Cancel + restart on replay tap. Visual feedback (pulse animation) while speaking.
- **Edge cases:**
  - Listen for `voiceschanged` event (voices load async on some browsers)
  - If no French voice found, show message to check device TTS settings
  - Disable play button until voice confirmed available

## Card UI

**Front (before flip):**
- Category label at top (small, muted)
- Large circular play button centered (app theme colors)
- Play icon (▶), switches to speaker icon while speaking
- "Tap to play" hint below (fades after first use)

**Back (after flip):**
- French sentence (large, bold, top)
- Divider
- English translation (lighter, below)

**Swipe/stats:** Same as verb practice — left/right indicators, three-stat footer (incorrect/accuracy/correct).

## localStorage Keys

- `listeningCategories` — JSON array of selected category keys

## Mastery Tracking

Same as verb practice: 3 consecutive correct swipes = mastered. Incorrect resets counter. Mastered sentences removed from pool.
