# French Conjugation Practice App

## Project Overview
A frontend-only application for practicing French verb conjugation, hosted on GitHub Pages with offline support.

## Requirements

### Core Functionality
- Unified practice mode combining conjugation and tense practice
- Flashcard interface with flip functionality and swipe gestures
- English → French and French → English direction options
- Optional verb infinitive hint
- Tense selection (Présent, Passé Composé, Imparfait, Futur Simple, Conditionnel)
- Mastery tracking: 3 consecutive correct = mastered, incorrect resets counter
- Spaced repetition-style practice with progress persistence

### Technical Requirements
- **Frontend Only**: Pure HTML, CSS, and JavaScript (no backend)
- **GitHub Pages Hosting**: Static site deployment
- **Offline Support**: Must work without internet connection after initial load
- **Data Storage**: IndexedDB for local verb storage and stats
- **Data Source**: Static JSON file hosted on GitHub Pages
- **Auto-Update**: Check for new version of words file on load and update IndexedDB if available

### Architecture

#### Files Structure
```
/
├── index.html              # Home page with mode selection
├── practice-setup.html     # Practice configuration (direction, tenses, hints)
├── practice-setup.js       # Practice setup logic
├── practice.html           # Flashcard practice page
├── practice.js             # Practice mode logic (swipe, mastery, stats)
├── practice.css            # Practice mode styles (cards, stats, animations)
├── listening-setup.html    # Listening practice configuration (categories)
├── listening-setup.js      # Listening setup logic
├── listening.html          # Listening practice page with TTS
├── listening.js            # Listening mode logic (TTS, swipe, mastery)
├── listening.css           # Listening mode styles (play button, cards)
├── shared.js               # Shared DB and utility functions
├── shared.css              # Shared styles for all pages
├── settings.html           # Settings page
├── settings.js             # Settings logic
├── settings.css            # Settings styles
├── sw.js                   # Service worker for offline support
├── words.json              # French verbs data file (v2.0.0)
├── sentences.json          # French sentences data file (v1.2.0)
└── version.json            # App version for update checking (never cached by SW)
```

#### IMPORTANT: Version Management
**When making ANY changes, ALWAYS update ALL THREE:**
1. `APP_VERSION` in `shared.js` (e.g., '2.4.0' → '2.4.1')
2. `CACHE_NAME` in `sw.js` (e.g., 'french-conjugation-v44' → 'french-conjugation-v45')
3. `version` in `version.json` — **must match `APP_VERSION`**

`version.json` is never cached by the service worker. It's fetched fresh on every page load to detect if an update is available. If `version.json` differs from `APP_VERSION`, the app shows an update banner.

This ensures users get the latest version and prevents old cached files from causing issues.
Current version: `french-conjugation-v44` (increment the number)

Don't forget to also add new files to the `urlsToCache` array!

`version.json` is never cached by the service worker. It's fetched fresh on every page load to detect if an update is available. If `version.json` differs from `APP_VERSION`, the app shows an update banner.

This ensures users get the latest version and prevents old cached files from causing issues.
Current version: `french-conjugation-v41` (increment the number)

Don't forget to also add new files to the `urlsToCache` array!

#### IndexedDB Schema
- **Database**: `FrenchConjugationDB` (version 4)
- **Object Store**: `verbs` (keyPath: `infinitive`)
- **Metadata Store**: `metadata` (keyPath: `key`, for version tracking)
- **Stats Store**: `stats` (keyPath: `id`, format: `${infinitive}_${pronoun}_${tense}`)

#### Words Data Format (v2.0.0)
```json
{
  "version": "2.0.0",
  "verbs": [
    {
      "infinitive": "être",
      "english": "to be",
      "tenses": {
        "present": {
          "je": { "french": "suis", "english": "I am" },
          "tu": { "french": "es", "english": "you are" },
          "il": { "french": "est", "english": "he is" },
          "nous": { "french": "sommes", "english": "we are" },
          "vous": { "french": "êtes", "english": "you are" },
          "ils": { "french": "sont", "english": "they are" }
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

Each pronoun entry has `{ "french": "conjugated form", "english": "English translation" }`.
Impersonal verbs (falloir) use `null` for non-applicable pronouns.

### Features
1. ✅ Card flip animation (3D with perspective)
2. ✅ Swipe gesture detection (touch + mouse + keyboard)
3. ✅ IndexedDB integration
4. ✅ Version checking and auto-update
5. ✅ Offline mode (Service Worker)
6. ✅ Random verb selection
7. ✅ Mastery tracking (3 consecutive correct)
8. ✅ English ↔ French direction toggle
9. ✅ Verb infinitive hint toggle
10. ✅ Multi-tense support (5 tenses)

### User Flow
1. Home screen → select "Verb Practice"
2. Practice Setup → choose direction, infinitive hint, tenses
3. App loads verbs from IndexedDB (auto-updates from server if newer)
4. Flashcard shows question based on direction
5. User taps to flip, sees answer
6. Swipe right (correct) or left (incorrect)
7. Stats tracked per verb+pronoun+tense combination
8. 3 consecutive correct = mastered, card removed from pool
9. All mastered → congratulations + reset option

### GitHub Pages Deployment
1. Push code to main branch
2. Enable GitHub Pages in repository settings
3. Set source to main branch / root directory

### Future Enhancements
- Additional practice modes (home screen supports multiple mode cards)
- Audio pronunciation
- Dark mode
- Filter by verb difficulty or frequency
