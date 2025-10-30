# French Conjugation Practice App

## Project Overview
A frontend-only application for practicing French verb conjugation, hosted on GitHub Pages with offline support.

## Requirements

### Core Functionality
- Display French verbs in their infinitive form
- Ask user to conjugate the verb in present tense for a specific form (e.g., je, tu, il/elle, nous, vous, ils/elles)
- Flashcard interface with flip functionality to reveal the answer
- Swipe left (incorrect) or swipe right (correct) to navigate to the next card
- Spaced repetition-style practice

### Technical Requirements
- **Frontend Only**: Pure HTML, CSS, and JavaScript (no backend)
- **GitHub Pages Hosting**: Static site deployment
- **Offline Support**: Must work without internet connection after initial load
- **Data Storage**: IndexedDB for local verb storage
- **Data Source**: Static JSON file hosted on GitHub Pages
- **Auto-Update**: Check for new version of words file on load and update IndexedDB if available

### Architecture

#### Files Structure
```
/
├── index.html              # Home page with mode selection
├── conjugation.html        # Conjugation practice mode
├── tenses.html             # Tense selection page
├── tenses-practice.html    # Tense practice mode
├── app.js                  # Conjugation mode logic
├── tenses-practice.js      # Tense practice mode logic
├── shared.js               # Shared DB and utility functions
├── styles.css              # Conjugation mode styles
├── tenses-practice.css     # Tense practice mode styles
├── shared.css              # Shared styles for all pages
├── sw.js                   # Service worker for offline support
└── words.json              # French verbs data file
```

#### IMPORTANT: Service Worker Cache Management
**ALWAYS bump the `CACHE_NAME` version in `sw.js` when making ANY changes to:**
- HTML files (index.html, conjugation.html, tenses.html, etc.)
- JavaScript files (app.js, shared.js, tenses-practice.js, etc.)
- CSS files (styles.css, shared.css, tenses-practice.css, etc.)
- Any other cached assets

This ensures users get the latest version and prevents old cached files from causing issues.
Current version: `french-conjugation-v7` (increment the number)

Don't forget to also add new files to the `urlsToCache` array and the network-first strategy condition!

#### IndexedDB Schema
- **Database**: `FrenchConjugationDB`
- **Object Store**: `verbs`
- **Metadata Store**: `metadata` (for version tracking)

#### Words Data Format
```json
{
  "version": "1.0.0",
  "verbs": [
    {
      "infinitive": "être",
      "english": "to be",
      "conjugations": {
        "je": "suis",
        "tu": "es",
        "il": "est",
        "nous": "sommes",
        "vous": "êtes",
        "ils": "sont"
      },
      "tenses": {
        "present": {
          "je": "suis",
          "tu": "es",
          "il": "est",
          "nous": "sommes",
          "vous": "êtes",
          "ils": "sont"
        },
        "passe_compose": {
          "je": "ai été",
          "tu": "as été",
          "il": "a été",
          "nous": "avons été",
          "vous": "avez été",
          "ils": "ont été"
        },
        "imparfait": {
          "je": "étais",
          "tu": "étais",
          "il": "était",
          "nous": "étions",
          "vous": "étiez",
          "ils": "étaient"
        },
        "futur": {
          "je": "serai",
          "tu": "seras",
          "il": "sera",
          "nous": "serons",
          "vous": "serez",
          "ils": "seront"
        },
        "conditionnel": {
          "je": "serais",
          "tu": "serais",
          "il": "serait",
          "nous": "serions",
          "vous": "seriez",
          "ils": "seraient"
        }
      }
    }
  ]
}
```

**Note:** The `conjugations` field is used for the conjugation practice mode (present tense only).
The `tenses` field is used for the tense practice mode and includes all supported tenses.

### Features to Implement
1. ✅ Card flip animation
2. ✅ Swipe gesture detection (left/right)
3. ✅ IndexedDB integration
4. ✅ Version checking and auto-update
5. ✅ Offline mode (Service Worker or PWA capabilities)
6. ✅ Random verb selection
7. ✅ Progress tracking (optional enhancement)

### User Flow
1. App loads and checks for internet connection
2. If online, fetch latest `words.json` and compare version with IndexedDB
3. If newer version available, update IndexedDB
4. Display random verb infinitive with a pronoun (e.g., "parler - je")
5. User thinks of answer and clicks/taps to flip card
6. Correct conjugation is revealed
7. User swipes right (correct) or left (incorrect)
8. Next card is displayed
9. App continues working offline after initial data load

### GitHub Pages Deployment
1. Create repository (e.g., `french-conjugation-practice`)
2. Push code to main branch
3. Enable GitHub Pages in repository settings
4. Set source to main branch / root directory
5. Access at `https://RobinWeitzelg.github.io/french-conjugation-practice/`

### Future Enhancements
- Track statistics (accuracy, streak, etc.)
- Filter by verb difficulty or frequency
- Support for other tenses (imparfait, passé composé, futur, etc.)
- Audio pronunciation
- Dark mode
