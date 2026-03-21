# French Verb Practice

> **Disclaimer:** This app is entirely vibe coded with [Claude Code](https://claude.ai/claude-code). Use at your own risk.

A mobile-friendly PWA for practicing French verb conjugation and listening comprehension, hosted on GitHub Pages with full offline support.

## Features

### Verb Practice
- Flashcard-based conjugation practice across 5 tenses (Present, Passe Compose, Imparfait, Futur Simple, Conditionnel)
- 100 verbs with all pronoun forms
- English to French and French to English directions
- Optional verb infinitive hints
- Mastery tracking (3 consecutive correct removes a card)

### Listening Practice
- 360 French sentences across 12 real-world categories (greetings, restaurant, shopping, directions, travel, phone, hotel, doctor, weather, work, family, emergencies)
- Pre-recorded audio via ElevenLabs TTS with Web Speech API fallback
- Autoplay on new cards with replay button on the answer side
- Speed control (1x / 0.75x)
- Category selection and mastery tracking

### Offline Support
- Service worker with network-first caching for app files
- Progressive audio caching (cached on first play)
- Bulk audio download from Settings for full offline use
- Update detection with in-app notification banner

## Tech Stack

- Pure HTML, CSS, JavaScript (no build tools, no framework)
- IndexedDB for local data storage
- Service Worker for offline support
- GitHub Pages for hosting
- ElevenLabs for audio generation (Python script in `scripts/`)

## Development

Serve locally:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Audio Generation

See [`scripts/README.md`](scripts/README.md) for instructions on generating audio files with ElevenLabs.

## Deployment

Push to `main` branch. GitHub Pages serves from the root directory automatically.

When making changes, always update all three version references:
1. `APP_VERSION` in `shared.js`
2. `CACHE_NAME` in `sw.js`
3. `version` in `version.json`
