# French Conjugation App — Comprehensive Rewrite Design

**Date:** 2026-03-24
**Status:** Approved
**Branch:** `rewrite/react-vite`

## Goals

1. Modern, maintainable codebase (React + TypeScript)
2. Clean, minimal UI redesign (Apple/Linear-inspired) with light/dark mode
3. Preserve all existing features: verb practice, listening practice, flashcard flip/swipe, mastery tracking, offline PWA
4. State-of-the-art tech stack for a GitHub Pages-hosted PWA

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | React 19 + TypeScript | Component model, ecosystem, DX |
| Build | Vite | Fast builds, great DX, PWA plugin |
| Styling | Tailwind CSS v4 | Utility-first, effortless dark mode |
| Animations | Framer Motion | Card flip + swipe gestures in one system |
| Database | Dexie.js | TypeScript-first IndexedDB wrapper |
| PWA | vite-plugin-pwa (Workbox) | Auto-generated SW, caching strategies |
| Routing | React Router (HashRouter) | SPA routing that works on GitHub Pages |
| Font | Inter (Google Fonts) | Clean, modern, excellent readability |

## Project Structure

```
french-conjugation-app/
├── public/
│   ├── audio/               # MP3 files (existing)
│   ├── icons/               # PWA icons (existing)
│   ├── words.json           # Verb data
│   ├── sentences.json       # Sentence data
│   └── version.json         # Update detection (never cached)
├── src/
│   ├── main.tsx             # Entry point
│   ├── App.tsx              # Router + layout + theme
│   ├── components/
│   │   ├── Flashcard.tsx    # 3D flip card (Framer Motion)
│   │   ├── SwipeContainer.tsx # Drag-to-swipe gestures
│   │   ├── StatsBar.tsx     # Session stats
│   │   ├── UpdateBanner.tsx # Version update notification
│   │   ├── Navigation.tsx   # Back button
│   │   └── ThemeToggle.tsx  # Light/dark switch
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── PracticeSetup.tsx
│   │   ├── Practice.tsx
│   │   ├── ListeningSetup.tsx
│   │   ├── Listening.tsx
│   │   └── Settings.tsx
│   ├── hooks/
│   │   ├── useDatabase.ts   # Data loading + version checking
│   │   ├── useMastery.ts    # Mastery tracking logic
│   │   ├── useSwipe.ts      # Swipe gesture hook
│   │   ├── useAudio.ts      # TTS + MP3 playback
│   │   └── useSettings.ts   # localStorage-backed settings
│   ├── lib/
│   │   ├── db.ts            # Dexie database definition
│   │   ├── types.ts         # TypeScript interfaces
│   │   └── constants.ts     # Tense names, pronouns, etc.
│   ├── context/
│   │   └── ThemeContext.tsx  # Dark/light mode
│   └── index.css            # Tailwind directives
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## Design System

### Colors

| Token | Light | Dark |
|-------|-------|------|
| Background | white | slate-950 |
| Surface (cards) | white | slate-800 |
| Text primary | slate-900 | slate-100 |
| Text secondary | slate-500 | slate-400 |
| Border | slate-200 | slate-700 |
| Accent | indigo-500 | indigo-400 |
| Success | emerald-500 | emerald-400 |
| Error | rose-500 | rose-400 |

### Typography

- Font: Inter
- Headings: font-semibold, tracking-tight
- Body: font-normal
- Labels: text-sm, text-slate-500

### Components

- Cards: rounded-2xl, border, shadow-sm, p-6
- Buttons: rounded-xl, bg-indigo-500, text-white, py-3
- Toggles: standard switch component
- Checkboxes: rounded, indigo accent

### Animations

- Card flip: Framer Motion rotateY, spring (stiffness: 300, damping: 30)
- Swipe: drag on x-axis, 75px threshold, fly-off with spring, tilt during drag
- Green/red overlay tint based on swipe direction
- Page transitions: fade 150ms

### Dark Mode

- System preference as default (prefers-color-scheme)
- Manual toggle overrides, stored in localStorage
- Tailwind `dark:` class strategy

## Dexie.js Schema

```ts
const db = new Dexie('FrenchConjugationDB');
db.version(1).stores({
  verbs: 'infinitive',
  sentences: 'id, category',
  stats: 'id',
  metadata: 'key'
});
```

## PWA Caching Strategy (vite-plugin-pwa + Workbox)

| Resource | Strategy | Rationale |
|----------|----------|-----------|
| Built assets (JS/CSS/HTML) | Precache | Versioned by Vite, always fresh |
| words.json, sentences.json | NetworkFirst | Check for updates, fall back to cache |
| audio/*.mp3 | CacheFirst | Large, rarely change |
| version.json | NetworkOnly | Must always be fresh |

## Page Layouts

### Home
- App title, theme toggle top-right
- Two mode cards: "Verb Conjugation", "Listening Practice"
- Each card: icon, title, description

### Practice Setup
- Back arrow, heading
- Direction: segmented control (EN→FR / FR→EN)
- Infinitive hint: toggle switch
- Tense selection: checkboxes
- Start button (full-width, indigo)

### Practice (Flashcard)
- Back arrow, progress counter (e.g. "4/32")
- Centered flashcard with flip animation
- Front: question, tense/hint label
- Back: answer, tense label
- Stats bar below: correct, incorrect, accuracy
- Completion state: celebration + reset

### Listening Setup
- Category checkboxes
- Start button

### Listening Practice
- Flashcard with play button on front
- Speed toggle (1x / 0.75x)
- Back: French text, English translation, replay button
- Same swipe + stats as verb practice

### Settings
- Sections: App Info, Updates, Audio Management, Data Management
- Check for updates, download audio, clear cache/stats buttons

## GitHub Pages Deployment

- Vite builds to `dist/`
- GitHub Actions workflow: build on push to main, deploy `dist/` to gh-pages
- HashRouter ensures client-side routing works without server config
- `base` in vite.config.ts set to repo name if needed

## Migration Notes

- Existing `words.json`, `sentences.json`, and `audio/` files are copied to `public/`
- IndexedDB schema is fresh (new Dexie instance) — existing user data will need to be re-fetched on first load of the new version
- Service worker from old app will be replaced by Workbox-generated one
