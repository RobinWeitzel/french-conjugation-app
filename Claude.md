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
├── index.html          # Main app interface
├── app.js              # Core application logic
├── styles.css          # Styling and animations
└── words.json          # French verbs data file
```

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
      "conjugations": {
        "je": "suis",
        "tu": "es",
        "il": "est",
        "nous": "sommes",
        "vous": "êtes",
        "ils": "sont"
      }
    }
  ]
}
```

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
