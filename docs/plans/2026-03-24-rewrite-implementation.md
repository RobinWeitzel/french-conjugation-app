# French Conjugation App Rewrite — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rewrite the French conjugation PWA from vanilla HTML/CSS/JS to React + Vite + Tailwind with a clean, minimal UI redesign and dark mode support.

**Architecture:** SPA with React 19 + TypeScript, Vite build, Tailwind CSS v4 for styling, Framer Motion for card flip/swipe animations, Dexie.js for IndexedDB, vite-plugin-pwa for service worker generation. HashRouter for GitHub Pages compatibility.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS v4, Framer Motion, Dexie.js, React Router, vite-plugin-pwa (Workbox)

**Design doc:** `docs/plans/2026-03-24-rewrite-design.md`

**Branch:** `rewrite/react-vite` (create from main)

---

## Task 1: Project Scaffolding

**Goal:** Create the Vite + React + TypeScript project, install dependencies, configure Tailwind and PWA plugin.

**Step 1: Create branch and scaffold Vite project**

```bash
git checkout -b rewrite/react-vite
```

Initialize a new Vite project in-place. Since we're rewriting, we need to set up the new project alongside existing files. Create the Vite project structure:

**Step 2: Create package.json**

Create: `package.json`

```json
{
  "name": "french-conjugation-app",
  "private": true,
  "version": "3.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  }
}
```

**Step 3: Install dependencies**

```bash
npm install react react-dom react-router-dom framer-motion dexie
npm install -D typescript @types/react @types/react-dom vite @vitejs/plugin-react tailwindcss @tailwindcss/vite vite-plugin-pwa
```

**Step 4: Create tsconfig.json**

Create: `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "paths": {
      "@/*": ["./src/*"]
    },
    "baseUrl": "."
  },
  "include": ["src"]
}
```

**Step 5: Create vite.config.ts**

Create: `vite.config.ts`

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icons/*.png'],
      manifest: {
        name: 'French Conjugation Practice',
        short_name: 'French Verbs',
        description: 'Practice French verb conjugation offline with flashcards',
        start_url: './',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#6366f1',
        orientation: 'any',
        categories: ['education'],
        icons: [
          { src: './icons/manifest-icon-192.maskable.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: './icons/manifest-icon-192.maskable.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: './icons/manifest-icon-512.maskable.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: './icons/manifest-icon-512.maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /\/words\.json$/,
            handler: 'NetworkFirst',
            options: { cacheName: 'data-cache', expiration: { maxEntries: 5 } },
          },
          {
            urlPattern: /\/sentences\.json$/,
            handler: 'NetworkFirst',
            options: { cacheName: 'data-cache', expiration: { maxEntries: 5 } },
          },
          {
            urlPattern: /\/audio\/.*\.mp3$/,
            handler: 'CacheFirst',
            options: { cacheName: 'audio-cache', expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
          {
            urlPattern: /\/version\.json$/,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  base: './',
});
```

**Step 6: Create index.html**

Create: `index.html` (replace existing — save old as `index.old.html` first)

Rename existing HTML/JS/CSS files to `*.old.*` so they're preserved but not served. The new `index.html` is the Vite entry point:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="theme-color" content="#6366f1" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <link rel="apple-touch-icon" href="/icons/apple-icon-180.png" />
    <link rel="icon" type="image/png" href="/icons/favicon-196.png" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <title>French Practice</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Step 7: Create entry point files**

Create: `src/main.tsx`

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

Create: `src/index.css`

```css
@import 'tailwindcss';

:root {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  @apply bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100;
  min-height: 100dvh;
}

/* Safe area padding for notched devices */
@supports (padding-top: env(safe-area-inset-top)) {
  body {
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
  }
}
```

Create: `src/App.tsx`

```tsx
import { HashRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { Home } from './pages/Home';

export function App() {
  return (
    <ThemeProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </HashRouter>
    </ThemeProvider>
  );
}
```

**Step 8: Move existing data files to public/**

```bash
mkdir -p public
cp words.json public/words.json
cp sentences.json public/sentences.json
cp version.json public/version.json
cp -r icons public/icons
cp -r audio public/audio
```

**Step 9: Verify it runs**

```bash
npm run dev
```

Open browser, verify Vite dev server loads with no errors.

**Step 10: Commit**

```bash
git add -A
git commit -m "feat: scaffold Vite + React + TypeScript project with Tailwind and PWA"
```

---

## Task 2: TypeScript Types & Constants

**Goal:** Define all TypeScript interfaces and constants used throughout the app.

**Files:**
- Create: `src/lib/types.ts`
- Create: `src/lib/constants.ts`

**Step 1: Create types**

Create: `src/lib/types.ts`

```ts
export interface VerbConjugation {
  french: string;
  english: string;
}

export interface TenseConjugations {
  je: VerbConjugation | null;
  tu: VerbConjugation | null;
  il: VerbConjugation | null;
  nous: VerbConjugation | null;
  vous: VerbConjugation | null;
  ils: VerbConjugation | null;
}

export interface Verb {
  infinitive: string;
  english: string;
  tenses: Record<TenseKey, TenseConjugations>;
}

export interface VerbsData {
  version: string;
  verbs: Verb[];
}

export interface Sentence {
  id: string;
  category: string;
  french: string;
  english: string;
}

export interface SentencesData {
  version: string;
  audioCategories: string[];
  categories: Record<string, string>;
  sentences: Sentence[];
}

export interface Stat {
  id: string;
  correctCount: number;
  mastered: boolean;
  lastPracticed: string;
}

export interface Metadata {
  key: string;
  value: string;
}

export type TenseKey = 'present' | 'passe_compose' | 'imparfait' | 'futur' | 'conditionnel';
export type Pronoun = 'je' | 'tu' | 'il' | 'nous' | 'vous' | 'ils';
export type Direction = 'en-fr' | 'fr-en';

export interface PracticeCard {
  infinitive: string;
  english: string;
  tense: TenseKey;
  pronoun: Pronoun;
  french: string;
  englishConjugation: string;
  statId: string;
}

export interface ListeningCard {
  id: string;
  category: string;
  french: string;
  english: string;
  statId: string;
}

export interface SessionStats {
  correct: number;
  incorrect: number;
}
```

**Step 2: Create constants**

Create: `src/lib/constants.ts`

```ts
import type { TenseKey, Pronoun } from './types';

export const APP_VERSION = '3.0.0';

export const TENSES: Record<TenseKey, string> = {
  present: 'Présent',
  passe_compose: 'Passé Composé',
  imparfait: 'Imparfait',
  futur: 'Futur Simple',
  conditionnel: 'Conditionnel',
};

export const PRONOUNS: Pronoun[] = ['je', 'tu', 'il', 'nous', 'vous', 'ils'];

export const MASTERY_THRESHOLD = 3;

export const SWIPE_THRESHOLD = 75;
```

**Step 3: Commit**

```bash
git add src/lib/types.ts src/lib/constants.ts
git commit -m "feat: add TypeScript types and constants"
```

---

## Task 3: Dexie Database Setup

**Goal:** Set up the Dexie.js IndexedDB wrapper with typed tables.

**Files:**
- Create: `src/lib/db.ts`

**Step 1: Create database definition**

Create: `src/lib/db.ts`

```ts
import Dexie, { type EntityTable } from 'dexie';
import type { Verb, Sentence, Stat, Metadata } from './types';

const db = new Dexie('FrenchPracticeDB') as Dexie & {
  verbs: EntityTable<Verb, 'infinitive'>;
  sentences: EntityTable<Sentence, 'id'>;
  stats: EntityTable<Stat, 'id'>;
  metadata: EntityTable<Metadata, 'key'>;
};

db.version(1).stores({
  verbs: 'infinitive',
  sentences: 'id, category',
  stats: 'id',
  metadata: 'key',
});

export { db };
```

**Step 2: Commit**

```bash
git add src/lib/db.ts
git commit -m "feat: add Dexie.js database definition"
```

---

## Task 4: Theme Context (Dark/Light Mode)

**Goal:** Create the theme context that handles system preference detection, manual toggle, and Tailwind dark class application.

**Files:**
- Create: `src/context/ThemeContext.tsx`
- Create: `src/components/ThemeToggle.tsx`

**Step 1: Create ThemeContext**

Create: `src/context/ThemeContext.tsx`

```tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolved: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || 'system';
  });

  const [systemDark, setSystemDark] = useState(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const resolved = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolved === 'dark');
  }, [resolved]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem('theme', t);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolved }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
```

**Step 2: Create ThemeToggle component**

Create: `src/components/ThemeToggle.tsx`

```tsx
import { useTheme } from '../context/ThemeContext';

export function ThemeToggle() {
  const { resolved, setTheme } = useTheme();

  const toggle = () => {
    setTheme(resolved === 'dark' ? 'light' : 'dark');
  };

  return (
    <button
      onClick={toggle}
      className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
      aria-label={`Switch to ${resolved === 'dark' ? 'light' : 'dark'} mode`}
    >
      {resolved === 'dark' ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5">
          <path d="M12 2.25a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM7.5 12a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM18.894 6.166a.75.75 0 0 0-1.06-1.06l-1.591 1.59a.75.75 0 1 0 1.06 1.061l1.591-1.59ZM21.75 12a.75.75 0 0 1-.75.75h-2.25a.75.75 0 0 1 0-1.5H21a.75.75 0 0 1 .75.75ZM17.834 18.894a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 1 0-1.061 1.06l1.59 1.591ZM12 18a.75.75 0 0 1 .75.75V21a.75.75 0 0 1-1.5 0v-2.25A.75.75 0 0 1 12 18ZM7.758 17.303a.75.75 0 0 0-1.061-1.06l-1.591 1.59a.75.75 0 0 0 1.06 1.061l1.591-1.59ZM6 12a.75.75 0 0 1-.75.75H3a.75.75 0 0 1 0-1.5h2.25A.75.75 0 0 1 6 12ZM6.697 7.757a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 0 0-1.061 1.06l1.59 1.591Z" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5">
          <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 0 1 .162.819A8.97 8.97 0 0 0 9 6a9 9 0 0 0 9 9 8.97 8.97 0 0 0 3.463-.69.75.75 0 0 1 .981.98 10.503 10.503 0 0 1-9.694 6.46c-5.799 0-10.5-4.7-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 0 1 .818.162Z" clipRule="evenodd" />
        </svg>
      )}
    </button>
  );
}
```

**Step 3: Commit**

```bash
git add src/context/ThemeContext.tsx src/components/ThemeToggle.tsx
git commit -m "feat: add dark/light theme context with system detection"
```

---

## Task 5: Navigation Component & Layout

**Goal:** Create the shared navigation/back-button component and page layout wrapper.

**Files:**
- Create: `src/components/Navigation.tsx`
- Create: `src/components/PageLayout.tsx`

**Step 1: Create Navigation**

Create: `src/components/Navigation.tsx`

```tsx
import { useNavigate } from 'react-router-dom';

interface NavigationProps {
  title: string;
  rightElement?: React.ReactNode;
}

export function Navigation({ title, rightElement }: NavigationProps) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between">
      <button
        onClick={() => navigate(-1)}
        className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        aria-label="Go back"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5">
          <path fillRule="evenodd" d="M7.72 12.53a.75.75 0 0 1 0-1.06l7.5-7.5a.75.75 0 1 1 1.06 1.06L9.31 12l6.97 6.97a.75.75 0 1 1-1.06 1.06l-7.5-7.5Z" clipRule="evenodd" />
        </svg>
      </button>
      <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
      <div className="w-9">{rightElement}</div>
    </div>
  );
}
```

**Step 2: Create PageLayout**

Create: `src/components/PageLayout.tsx`

```tsx
import type { ReactNode } from 'react';

interface PageLayoutProps {
  children: ReactNode;
  className?: string;
}

export function PageLayout({ children, className = '' }: PageLayoutProps) {
  return (
    <div className={`mx-auto flex min-h-dvh max-w-md flex-col px-4 py-6 ${className}`}>
      {children}
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add src/components/Navigation.tsx src/components/PageLayout.tsx
git commit -m "feat: add Navigation and PageLayout components"
```

---

## Task 6: Settings Hook

**Goal:** Create a hook for localStorage-backed settings with type safety.

**Files:**
- Create: `src/hooks/useSettings.ts`

**Step 1: Create useSettings**

Create: `src/hooks/useSettings.ts`

```ts
import { useState, useCallback } from 'react';
import type { TenseKey, Direction } from '../lib/types';

function useLocalStorage<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  const [state, setState] = useState<T>(() => {
    const stored = localStorage.getItem(key);
    if (stored === null) return defaultValue;
    try {
      return JSON.parse(stored) as T;
    } catch {
      return stored as unknown as T;
    }
  });

  const setValue = useCallback(
    (value: T) => {
      setState(value);
      localStorage.setItem(key, JSON.stringify(value));
    },
    [key]
  );

  return [state, setValue];
}

export function usePracticeSettings() {
  const [direction, setDirection] = useLocalStorage<Direction>('practiceDirection', 'en-fr');
  const [showInfinitive, setShowInfinitive] = useLocalStorage<boolean>('practiceShowInfinitive', true);
  const [tenses, setTenses] = useLocalStorage<TenseKey[]>('practiceTenses', ['present']);

  return { direction, setDirection, showInfinitive, setShowInfinitive, tenses, setTenses };
}

export function useListeningSettings() {
  const [categories, setCategories] = useLocalStorage<string[]>('listeningCategories', []);
  const [speed, setSpeed] = useLocalStorage<number>('listeningSpeed', 1);

  return { categories, setCategories, speed, setSpeed };
}
```

**Step 2: Commit**

```bash
git add src/hooks/useSettings.ts
git commit -m "feat: add localStorage-backed settings hooks"
```

---

## Task 7: Database Hook (Data Loading & Version Checking)

**Goal:** Create the hook that loads verbs/sentences from the server, compares versions, and updates IndexedDB.

**Files:**
- Create: `src/hooks/useDatabase.ts`

**Step 1: Create useDatabase**

Create: `src/hooks/useDatabase.ts`

```ts
import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import type { Verb, Sentence, VerbsData, SentencesData } from '../lib/types';

async function fetchAndUpdateVerbs(): Promise<void> {
  try {
    const response = await fetch('./words.json', { cache: 'no-cache' });
    if (!response.ok) return;
    const data: VerbsData = await response.json();

    const stored = await db.metadata.get('verbsVersion');
    if (stored?.value === data.version) return;

    await db.transaction('rw', db.verbs, db.metadata, async () => {
      await db.verbs.clear();
      await db.verbs.bulkPut(data.verbs);
      await db.metadata.put({ key: 'verbsVersion', value: data.version });
    });
  } catch {
    // Offline — use cached data
  }
}

async function fetchAndUpdateSentences(): Promise<void> {
  try {
    const response = await fetch('./sentences.json', { cache: 'no-cache' });
    if (!response.ok) return;
    const data: SentencesData = await response.json();

    const stored = await db.metadata.get('sentencesVersion');
    if (stored?.value === data.version) return;

    await db.transaction('rw', db.sentences, db.metadata, async () => {
      await db.sentences.clear();
      await db.sentences.bulkPut(data.sentences);
      await db.metadata.put({ key: 'sentencesVersion', value: data.version });
      await db.metadata.put({ key: 'sentenceCategories', value: JSON.stringify(data.categories) });
      await db.metadata.put({ key: 'audioCategories', value: JSON.stringify(data.audioCategories) });
    });
  } catch {
    // Offline — use cached data
  }
}

export function useVerbs(): Verb[] | undefined {
  useEffect(() => { fetchAndUpdateVerbs(); }, []);
  return useLiveQuery(() => db.verbs.toArray());
}

export function useSentences(categories?: string[]): Sentence[] | undefined {
  useEffect(() => { fetchAndUpdateSentences(); }, []);
  return useLiveQuery(() => {
    if (categories && categories.length > 0) {
      return db.sentences.where('category').anyOf(categories).toArray();
    }
    return db.sentences.toArray();
  }, [categories]);
}

export function useSentenceCategories(): Record<string, string> | undefined {
  return useLiveQuery(async () => {
    const stored = await db.metadata.get('sentenceCategories');
    if (stored?.value) return JSON.parse(stored.value) as Record<string, string>;
    return undefined;
  });
}

export function useAudioCategories(): string[] | undefined {
  return useLiveQuery(async () => {
    const stored = await db.metadata.get('audioCategories');
    if (stored?.value) return JSON.parse(stored.value) as string[];
    return undefined;
  });
}

export function useUpdateCheck() {
  const [updateAvailable, setUpdateAvailable] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const checkForUpdate = async () => {
    setChecking(true);
    try {
      const response = await fetch('./version.json', { cache: 'no-store' });
      if (!response.ok) return;
      const data = await response.json();
      const { APP_VERSION } = await import('../lib/constants');
      if (data.version !== APP_VERSION) {
        setUpdateAvailable(data.version);
      }
    } catch {
      // Offline
    } finally {
      setChecking(false);
    }
  };

  const applyUpdate = async () => {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const reg of registrations) await reg.unregister();
    const cacheNames = await caches.keys();
    for (const name of cacheNames) await caches.delete(name);
    window.location.reload();
  };

  useEffect(() => { checkForUpdate(); }, []);

  return { updateAvailable, checking, checkForUpdate, applyUpdate };
}
```

**Note:** Also install the dexie-react-hooks peer dependency:

```bash
npm install dexie-react-hooks
```

**Step 2: Commit**

```bash
git add src/hooks/useDatabase.ts
git commit -m "feat: add database hooks for verbs, sentences, and update checking"
```

---

## Task 8: Mastery Hook

**Goal:** Create the hook that manages mastery tracking (stats in IndexedDB, card pool management).

**Files:**
- Create: `src/hooks/useMastery.ts`

**Step 1: Create useMastery**

Create: `src/hooks/useMastery.ts`

```ts
import { useState, useCallback } from 'react';
import { db } from '../lib/db';
import { MASTERY_THRESHOLD } from '../lib/constants';
import type { Stat, SessionStats } from '../lib/types';

export function useMastery() {
  const [sessionStats, setSessionStats] = useState<SessionStats>({ correct: 0, incorrect: 0 });

  const getStat = useCallback(async (id: string): Promise<Stat> => {
    const stat = await db.stats.get(id);
    return stat ?? { id, correctCount: 0, mastered: false, lastPracticed: '' };
  }, []);

  const recordCorrect = useCallback(async (id: string) => {
    const stat = await getStat(id);
    const newCount = stat.correctCount + 1;
    const mastered = newCount >= MASTERY_THRESHOLD;
    await db.stats.put({
      id,
      correctCount: newCount,
      mastered,
      lastPracticed: new Date().toISOString(),
    });
    setSessionStats((s) => ({ ...s, correct: s.correct + 1 }));
    return mastered;
  }, [getStat]);

  const recordIncorrect = useCallback(async (id: string) => {
    await db.stats.put({
      id,
      correctCount: 0,
      mastered: false,
      lastPracticed: new Date().toISOString(),
    });
    setSessionStats((s) => ({ ...s, incorrect: s.incorrect + 1 }));
  }, []);

  const isMastered = useCallback(async (id: string): Promise<boolean> => {
    const stat = await db.stats.get(id);
    return stat?.mastered ?? false;
  }, []);

  const resetStats = useCallback(async (prefix?: string) => {
    if (prefix) {
      const stats = await db.stats.where('id').startsWith(prefix).toArray();
      await db.stats.bulkDelete(stats.map((s) => s.id));
    } else {
      await db.stats.clear();
    }
    setSessionStats({ correct: 0, incorrect: 0 });
  }, []);

  const resetSession = useCallback(() => {
    setSessionStats({ correct: 0, incorrect: 0 });
  }, []);

  return { sessionStats, recordCorrect, recordIncorrect, isMastered, resetStats, resetSession };
}
```

**Step 2: Commit**

```bash
git add src/hooks/useMastery.ts
git commit -m "feat: add mastery tracking hook"
```

---

## Task 9: Flashcard Component

**Goal:** Build the 3D flip card using Framer Motion with spring animation.

**Files:**
- Create: `src/components/Flashcard.tsx`

**Step 1: Create Flashcard**

Create: `src/components/Flashcard.tsx`

```tsx
import { useState, useCallback, type ReactNode } from 'react';
import { motion } from 'framer-motion';

interface FlashcardProps {
  front: ReactNode;
  back: ReactNode;
  flipped: boolean;
  onFlip: () => void;
}

export function Flashcard({ front, back, flipped, onFlip }: FlashcardProps) {
  return (
    <div
      className="perspective-[1000px] h-72 w-full cursor-pointer select-none sm:h-80"
      onClick={onFlip}
    >
      <motion.div
        className="relative h-full w-full"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm backface-hidden dark:border-slate-700 dark:bg-slate-800"
        >
          {front}
        </div>
        {/* Back */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm backface-hidden dark:border-slate-700 dark:bg-slate-800"
          style={{ transform: 'rotateY(180deg)' }}
        >
          {back}
        </div>
      </motion.div>
    </div>
  );
}

export function useFlipState() {
  const [flipped, setFlipped] = useState(false);
  const flip = useCallback(() => setFlipped((f) => !f), []);
  const reset = useCallback(() => setFlipped(false), []);
  return { flipped, flip, reset };
}
```

**Step 2: Add backface-hidden utility to index.css if needed**

Tailwind v4 should have `backface-hidden` as a built-in utility. If not, add to `src/index.css`:

```css
.backface-hidden {
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
```

**Step 3: Commit**

```bash
git add src/components/Flashcard.tsx src/index.css
git commit -m "feat: add Flashcard component with 3D flip animation"
```

---

## Task 10: SwipeContainer Component

**Goal:** Build the swipe-to-answer container using Framer Motion drag gestures.

**Files:**
- Create: `src/components/SwipeContainer.tsx`
- Create: `src/components/StatsBar.tsx`

**Step 1: Create SwipeContainer**

Create: `src/components/SwipeContainer.tsx`

```tsx
import { type ReactNode, useCallback } from 'react';
import { motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion';
import { SWIPE_THRESHOLD } from '../lib/constants';

interface SwipeContainerProps {
  children: ReactNode;
  enabled: boolean;
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
  onCardExit?: () => void;
}

export function SwipeContainer({ children, enabled, onSwipeRight, onSwipeLeft, onCardExit }: SwipeContainerProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-15, 0, 15]);
  const correctOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 0.3]);
  const incorrectOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [0.3, 0]);

  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      if (!enabled) return;
      if (info.offset.x > SWIPE_THRESHOLD) {
        onSwipeRight();
      } else if (info.offset.x < -SWIPE_THRESHOLD) {
        onSwipeLeft();
      }
    },
    [enabled, onSwipeRight, onSwipeLeft]
  );

  return (
    <div className="relative">
      <motion.div
        className="relative"
        style={{ x, rotate }}
        drag={enabled ? 'x' : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.8}
        onDragEnd={handleDragEnd}
        whileDrag={{ scale: 0.98 }}
      >
        {/* Correct overlay */}
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-2xl bg-emerald-500"
          style={{ opacity: correctOpacity }}
        />
        {/* Incorrect overlay */}
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-2xl bg-rose-500"
          style={{ opacity: incorrectOpacity }}
        />
        {children}
      </motion.div>
    </div>
  );
}
```

**Step 2: Create StatsBar**

Create: `src/components/StatsBar.tsx`

```tsx
import type { SessionStats } from '../lib/types';

interface StatsBarProps {
  stats: SessionStats;
  remaining: number;
  total: number;
}

export function StatsBar({ stats, remaining, total }: StatsBarProps) {
  const attempted = stats.correct + stats.incorrect;
  const accuracy = attempted > 0 ? Math.round((stats.correct / attempted) * 100) : 0;

  return (
    <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
      <div className="flex gap-4">
        <span className="text-emerald-600 dark:text-emerald-400">{stats.correct} correct</span>
        <span className="text-rose-600 dark:text-rose-400">{stats.incorrect} incorrect</span>
      </div>
      <div className="flex gap-4">
        {attempted > 0 && <span>{accuracy}%</span>}
        <span>{remaining}/{total} left</span>
      </div>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add src/components/SwipeContainer.tsx src/components/StatsBar.tsx
git commit -m "feat: add SwipeContainer with drag gestures and StatsBar"
```

---

## Task 11: Home Page

**Goal:** Build the home page with mode selection cards and theme toggle.

**Files:**
- Create: `src/pages/Home.tsx`

**Step 1: Create Home page**

Create: `src/pages/Home.tsx`

```tsx
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '../components/PageLayout';
import { ThemeToggle } from '../components/ThemeToggle';

export function Home() {
  const navigate = useNavigate();

  return (
    <PageLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">French Practice</h1>
        <ThemeToggle />
      </div>

      <div className="mt-8 flex flex-1 flex-col gap-4">
        <button
          onClick={() => navigate('/practice-setup')}
          className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5">
              <path d="M11.25 4.533A9.707 9.707 0 0 0 6 3a9.735 9.735 0 0 0-3.25.555.75.75 0 0 0-.5.707v14.25a.75.75 0 0 0 1 .707A8.237 8.237 0 0 1 6 18.75c1.995 0 3.823.707 5.25 1.886V4.533ZM12.75 20.636A8.214 8.214 0 0 1 18 18.75c.966 0 1.89.166 2.75.47a.75.75 0 0 0 1-.708V4.262a.75.75 0 0 0-.5-.707A9.735 9.735 0 0 0 18 3a9.707 9.707 0 0 0-5.25 1.533v16.103Z" />
            </svg>
          </div>
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">Verb Conjugation</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Practice French verb forms with flashcards
            </p>
          </div>
        </button>

        <button
          onClick={() => navigate('/listening-setup')}
          className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5">
              <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 0 0 1.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06ZM18.584 5.106a.75.75 0 0 1 1.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 0 1-1.06-1.06 8.25 8.25 0 0 0 0-11.668.75.75 0 0 1 0-1.06Z" />
              <path d="M15.932 7.757a.75.75 0 0 1 1.061 0 6 6 0 0 1 0 8.486.75.75 0 0 1-1.06-1.061 4.5 4.5 0 0 0 0-6.364.75.75 0 0 1 0-1.06Z" />
            </svg>
          </div>
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">Listening Practice</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Listen to French sentences and test comprehension
            </p>
          </div>
        </button>
      </div>

      <div className="mt-auto pt-6">
        <button
          onClick={() => navigate('/settings')}
          className="w-full rounded-xl py-3 text-sm text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          Settings
        </button>
      </div>
    </PageLayout>
  );
}
```

**Step 2: Verify it renders**

```bash
npm run dev
```

Open browser — should see the Home page with two mode cards, theme toggle, and settings button.

**Step 3: Commit**

```bash
git add src/pages/Home.tsx
git commit -m "feat: add Home page with mode selection cards"
```

---

## Task 12: Practice Setup Page

**Goal:** Build the practice configuration page with direction toggle, infinitive hint, and tense selection.

**Files:**
- Create: `src/pages/PracticeSetup.tsx`
- Modify: `src/App.tsx` — add route

**Step 1: Create PracticeSetup**

Create: `src/pages/PracticeSetup.tsx`

```tsx
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '../components/PageLayout';
import { Navigation } from '../components/Navigation';
import { usePracticeSettings } from '../hooks/useSettings';
import { TENSES } from '../lib/constants';
import type { TenseKey, Direction } from '../lib/types';

export function PracticeSetup() {
  const navigate = useNavigate();
  const { direction, setDirection, showInfinitive, setShowInfinitive, tenses, setTenses } = usePracticeSettings();

  const toggleTense = (tense: TenseKey) => {
    if (tenses.includes(tense)) {
      if (tenses.length > 1) setTenses(tenses.filter((t) => t !== tense));
    } else {
      setTenses([...tenses, tense]);
    }
  };

  return (
    <PageLayout>
      <Navigation title="Practice Setup" />

      <div className="mt-8 space-y-8">
        {/* Direction */}
        <div>
          <label className="mb-3 block text-sm font-medium text-slate-500 dark:text-slate-400">Direction</label>
          <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800/50">
            {(['en-fr', 'fr-en'] as Direction[]).map((d) => (
              <button
                key={d}
                onClick={() => setDirection(d)}
                className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all ${
                  direction === d
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {d === 'en-fr' ? 'English → French' : 'French → English'}
              </button>
            ))}
          </div>
        </div>

        {/* Infinitive hint */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-slate-900 dark:text-slate-100">Show infinitive hint</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Display the verb infinitive on cards</p>
          </div>
          <button
            onClick={() => setShowInfinitive(!showInfinitive)}
            className={`relative h-7 w-12 rounded-full transition-colors ${
              showInfinitive ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-600'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 size-6 rounded-full bg-white shadow-sm transition-transform ${
                showInfinitive ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>

        {/* Tense selection */}
        <div>
          <label className="mb-3 block text-sm font-medium text-slate-500 dark:text-slate-400">Tenses</label>
          <div className="space-y-2">
            {(Object.entries(TENSES) as [TenseKey, string][]).map(([key, name]) => (
              <button
                key={key}
                onClick={() => toggleTense(key)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors ${
                  tenses.includes(key)
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                <div
                  className={`flex size-5 items-center justify-center rounded border ${
                    tenses.includes(key)
                      ? 'border-indigo-500 bg-indigo-500 dark:border-indigo-400 dark:bg-indigo-400'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {tenses.includes(key) && (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="size-3">
                      <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span className="text-sm font-medium">{name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-auto pt-8">
        <button
          onClick={() => navigate('/practice')}
          className="w-full rounded-xl bg-indigo-500 py-3.5 font-semibold text-white shadow-sm transition-colors hover:bg-indigo-600 active:bg-indigo-700"
        >
          Start Practice
        </button>
      </div>
    </PageLayout>
  );
}
```

**Step 2: Add route to App.tsx**

Modify: `src/App.tsx` — add import and Route for PracticeSetup.

```tsx
import { PracticeSetup } from './pages/PracticeSetup';
// ... inside Routes:
<Route path="/practice-setup" element={<PracticeSetup />} />
```

**Step 3: Verify and commit**

```bash
npm run dev
# Navigate to Practice Setup — verify direction toggle, hint switch, tense checkboxes
git add src/pages/PracticeSetup.tsx src/App.tsx
git commit -m "feat: add Practice Setup page"
```

---

## Task 13: Practice Page

**Goal:** Build the main verb conjugation practice page combining Flashcard, SwipeContainer, mastery tracking, and keyboard shortcuts.

**Files:**
- Create: `src/pages/Practice.tsx`
- Modify: `src/App.tsx` — add route

**Step 1: Create Practice page**

Create: `src/pages/Practice.tsx`

This page must:
1. Load verbs from IndexedDB
2. Build card pool from selected tenses (filter out mastered and null conjugations)
3. Show flashcard with flip/swipe
4. Track mastery and session stats
5. Handle keyboard shortcuts (Space to flip, ArrowLeft/Right to swipe)
6. Show completion state when all cards mastered

```tsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { PageLayout } from '../components/PageLayout';
import { Navigation } from '../components/Navigation';
import { Flashcard, useFlipState } from '../components/Flashcard';
import { SwipeContainer } from '../components/SwipeContainer';
import { StatsBar } from '../components/StatsBar';
import { useMastery } from '../hooks/useMastery';
import { usePracticeSettings } from '../hooks/useSettings';
import { useVerbs } from '../hooks/useDatabase';
import { TENSES, PRONOUNS } from '../lib/constants';
import type { PracticeCard, TenseKey, Pronoun } from '../lib/types';
import { db } from '../lib/db';

export function Practice() {
  const verbs = useVerbs();
  const { direction, showInfinitive, tenses } = usePracticeSettings();
  const { sessionStats, recordCorrect, recordIncorrect, resetStats, resetSession } = useMastery();
  const { flipped, flip, reset: resetFlip } = useFlipState();

  const [cards, setCards] = useState<PracticeCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Build card pool
  useEffect(() => {
    if (!verbs) return;

    const buildCards = async () => {
      const allCards: PracticeCard[] = [];

      for (const verb of verbs) {
        for (const tense of tenses) {
          const tenseData = verb.tenses[tense];
          if (!tenseData) continue;

          for (const pronoun of PRONOUNS) {
            const conjugation = tenseData[pronoun];
            if (!conjugation) continue;

            const statId = `${verb.infinitive}_${pronoun}_${tense}`;
            const stat = await db.stats.get(statId);
            if (stat?.mastered) continue;

            allCards.push({
              infinitive: verb.infinitive,
              english: verb.english,
              tense,
              pronoun,
              french: conjugation.french,
              englishConjugation: conjugation.english,
              statId,
            });
          }
        }
      }

      // Shuffle
      for (let i = allCards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allCards[i], allCards[j]] = [allCards[j], allCards[i]];
      }

      setCards(allCards);
      setCurrentIndex(0);
      setLoading(false);
    };

    buildCards();
  }, [verbs, tenses]);

  const currentCard = cards[currentIndex];
  const allDone = !loading && cards.length === 0;

  const nextCard = useCallback(() => {
    resetFlip();
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      // Rebuild pool (remove newly mastered)
      setCards((prev) => prev.filter((_, i) => i > currentIndex));
      setCurrentIndex(0);
      // If no cards remain after filter, allDone will be true on re-render
    }
  }, [currentIndex, cards.length, resetFlip]);

  const handleSwipeRight = useCallback(async () => {
    if (!currentCard) return;
    const mastered = await recordCorrect(currentCard.statId);
    if (mastered) {
      setCards((prev) => prev.filter((c) => c.statId !== currentCard.statId));
      resetFlip();
      // Don't increment index — the next card slides into the same position
    } else {
      nextCard();
    }
  }, [currentCard, recordCorrect, nextCard, resetFlip]);

  const handleSwipeLeft = useCallback(async () => {
    if (!currentCard) return;
    await recordIncorrect(currentCard.statId);
    nextCard();
  }, [currentCard, recordIncorrect, nextCard]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        flip();
      } else if (e.key === 'ArrowRight' && flipped) {
        handleSwipeRight();
      } else if (e.key === 'ArrowLeft' && flipped) {
        handleSwipeLeft();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [flip, flipped, handleSwipeRight, handleSwipeLeft]);

  const handleReset = async () => {
    await resetStats();
    resetSession();
    setLoading(true);
    // Trigger rebuild by re-running effect — increment a counter or just reload
    window.location.reload();
  };

  const totalCards = useMemo(() => {
    if (!verbs) return 0;
    let count = 0;
    for (const verb of verbs) {
      for (const tense of tenses) {
        const tenseData = verb.tenses[tense];
        if (!tenseData) continue;
        for (const pronoun of PRONOUNS) {
          if (tenseData[pronoun]) count++;
        }
      }
    }
    return count;
  }, [verbs, tenses]);

  if (loading) {
    return (
      <PageLayout>
        <Navigation title="Practice" />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-slate-500 dark:text-slate-400">Loading...</p>
        </div>
      </PageLayout>
    );
  }

  if (allDone) {
    return (
      <PageLayout>
        <Navigation title="Practice" />
        <div className="flex flex-1 flex-col items-center justify-center gap-6">
          <div className="text-center">
            <p className="text-4xl">🎉</p>
            <h2 className="mt-4 text-xl font-semibold">All mastered!</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              You've mastered all cards in the selected tenses.
            </p>
          </div>
          <button
            onClick={handleReset}
            className="rounded-xl bg-indigo-500 px-8 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-indigo-600"
          >
            Reset & Practice Again
          </button>
        </div>
        <StatsBar stats={sessionStats} remaining={0} total={totalCards} />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Navigation
        title="Practice"
        rightElement={
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {cards.length} left
          </span>
        }
      />

      <div className="flex flex-1 flex-col justify-center gap-6 py-4">
        <SwipeContainer
          enabled={flipped}
          onSwipeRight={handleSwipeRight}
          onSwipeLeft={handleSwipeLeft}
        >
          <Flashcard
            flipped={flipped}
            onFlip={flip}
            front={
              <div className="text-center">
                {showInfinitive && (
                  <p className="mb-2 text-xs font-medium text-slate-400 dark:text-slate-500">
                    {currentCard.infinitive} ({currentCard.english})
                  </p>
                )}
                <p className="text-xs text-slate-400 dark:text-slate-500">{TENSES[currentCard.tense]}</p>
                <p className="mt-4 text-2xl font-semibold">
                  {direction === 'en-fr'
                    ? currentCard.englishConjugation
                    : `${currentCard.pronoun} ${currentCard.french}`}
                </p>
                <p className="mt-6 text-xs text-slate-400 dark:text-slate-500">Tap to reveal</p>
              </div>
            }
            back={
              <div className="text-center">
                <p className="text-xs text-slate-400 dark:text-slate-500">{TENSES[currentCard.tense]}</p>
                <p className="mt-4 text-2xl font-semibold">
                  {direction === 'en-fr'
                    ? `${currentCard.pronoun} ${currentCard.french}`
                    : currentCard.englishConjugation}
                </p>
                <p className="mt-6 text-xs text-slate-400 dark:text-slate-500">
                  Swipe right if correct, left if not
                </p>
              </div>
            }
          />
        </SwipeContainer>

        <StatsBar stats={sessionStats} remaining={cards.length} total={totalCards} />
      </div>
    </PageLayout>
  );
}
```

**Step 2: Add route to App.tsx**

```tsx
import { Practice } from './pages/Practice';
// ... inside Routes:
<Route path="/practice" element={<Practice />} />
```

**Step 3: Verify and commit**

```bash
npm run dev
# Test: navigate through Home → Practice Setup → Practice
# Verify: card flip, swipe left/right, keyboard shortcuts, stats bar
git add src/pages/Practice.tsx src/App.tsx
git commit -m "feat: add Practice page with flashcard, swipe, and mastery"
```

---

## Task 14: Listening Setup Page

**Goal:** Build the listening practice category selection page.

**Files:**
- Create: `src/pages/ListeningSetup.tsx`
- Modify: `src/App.tsx` — add route

**Step 1: Create ListeningSetup**

Create: `src/pages/ListeningSetup.tsx`

```tsx
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '../components/PageLayout';
import { Navigation } from '../components/Navigation';
import { useListeningSettings } from '../hooks/useSettings';
import { useSentenceCategories } from '../hooks/useDatabase';

export function ListeningSetup() {
  const navigate = useNavigate();
  const { categories, setCategories } = useListeningSettings();
  const allCategories = useSentenceCategories();

  const toggleCategory = (key: string) => {
    if (categories.includes(key)) {
      setCategories(categories.filter((c) => c !== key));
    } else {
      setCategories([...categories, key]);
    }
  };

  const selectAll = () => {
    if (allCategories) setCategories(Object.keys(allCategories));
  };

  if (!allCategories) {
    return (
      <PageLayout>
        <Navigation title="Listening Setup" />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-slate-500 dark:text-slate-400">Loading categories...</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Navigation title="Listening Setup" />

      <div className="mt-8 space-y-6">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Categories</label>
          <button onClick={selectAll} className="text-sm text-indigo-500 hover:text-indigo-600 dark:text-indigo-400">
            Select all
          </button>
        </div>

        <div className="space-y-2">
          {Object.entries(allCategories).map(([key, name]) => (
            <button
              key={key}
              onClick={() => toggleCategory(key)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors ${
                categories.includes(key)
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <div
                className={`flex size-5 items-center justify-center rounded border ${
                  categories.includes(key)
                    ? 'border-indigo-500 bg-indigo-500 dark:border-indigo-400 dark:bg-indigo-400'
                    : 'border-slate-300 dark:border-slate-600'
                }`}
              >
                {categories.includes(key) && (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="size-3">
                    <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <span className="text-sm font-medium">{name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-auto pt-8">
        <button
          onClick={() => navigate('/listening')}
          disabled={categories.length === 0}
          className="w-full rounded-xl bg-indigo-500 py-3.5 font-semibold text-white shadow-sm transition-colors hover:bg-indigo-600 active:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Start Listening
        </button>
      </div>
    </PageLayout>
  );
}
```

**Step 2: Add route, verify, commit**

```bash
git add src/pages/ListeningSetup.tsx src/App.tsx
git commit -m "feat: add Listening Setup page with category selection"
```

---

## Task 15: Audio Hook

**Goal:** Create the hook that handles MP3 playback with TTS fallback and speed control.

**Files:**
- Create: `src/hooks/useAudio.ts`

**Step 1: Create useAudio**

Create: `src/hooks/useAudio.ts`

```ts
import { useRef, useCallback, useEffect, useState } from 'react';

export function useAudio(speed: number) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [frenchVoice, setFrenchVoice] = useState<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    const findVoice = () => {
      const voices = speechSynthesis.getVoices();
      const french = voices.find((v) => v.lang.startsWith('fr-FR'))
        ?? voices.find((v) => v.lang.startsWith('fr'));
      if (french) setFrenchVoice(french);
    };

    findVoice();
    speechSynthesis.addEventListener('voiceschanged', findVoice);
    return () => speechSynthesis.removeEventListener('voiceschanged', findVoice);
  }, []);

  const playAudio = useCallback(
    async (text: string, audioFile?: string) => {
      // Stop any playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      speechSynthesis.cancel();

      // Try MP3 first
      if (audioFile) {
        try {
          const audio = new Audio(audioFile);
          audio.playbackRate = speed;
          audioRef.current = audio;
          await audio.play();
          return;
        } catch {
          // Fall through to TTS
        }
      }

      // TTS fallback
      if (frenchVoice) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = frenchVoice;
        utterance.rate = speed;
        utterance.lang = 'fr-FR';
        speechSynthesis.speak(utterance);
      }
    },
    [speed, frenchVoice]
  );

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    speechSynthesis.cancel();
  }, []);

  useEffect(() => {
    return () => { stop(); };
  }, [stop]);

  return { playAudio, stop, hasTTS: !!frenchVoice };
}
```

**Step 2: Commit**

```bash
git add src/hooks/useAudio.ts
git commit -m "feat: add audio hook with MP3 + TTS fallback"
```

---

## Task 16: Listening Practice Page

**Goal:** Build the listening practice page with audio playback, flashcards, and swipe gestures.

**Files:**
- Create: `src/pages/Listening.tsx`
- Modify: `src/App.tsx` — add route

**Step 1: Create Listening page**

Create: `src/pages/Listening.tsx`

```tsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { PageLayout } from '../components/PageLayout';
import { Navigation } from '../components/Navigation';
import { Flashcard, useFlipState } from '../components/Flashcard';
import { SwipeContainer } from '../components/SwipeContainer';
import { StatsBar } from '../components/StatsBar';
import { useMastery } from '../hooks/useMastery';
import { useListeningSettings } from '../hooks/useSettings';
import { useSentences, useAudioCategories } from '../hooks/useDatabase';
import { useAudio } from '../hooks/useAudio';
import type { ListeningCard } from '../lib/types';
import { db } from '../lib/db';

export function Listening() {
  const { categories, speed, setSpeed } = useListeningSettings();
  const sentences = useSentences(categories);
  const audioCategories = useAudioCategories();
  const { sessionStats, recordCorrect, recordIncorrect, resetStats, resetSession } = useMastery();
  const { flipped, flip, reset: resetFlip } = useFlipState();
  const { playAudio, stop } = useAudio(speed);

  const [cards, setCards] = useState<ListeningCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sentences) return;

    const buildCards = async () => {
      const allCards: ListeningCard[] = [];

      for (const sentence of sentences) {
        const statId = `listening_${sentence.id}`;
        const stat = await db.stats.get(statId);
        if (stat?.mastered) continue;

        allCards.push({
          id: sentence.id,
          category: sentence.category,
          french: sentence.french,
          english: sentence.english,
          statId,
        });
      }

      // Shuffle
      for (let i = allCards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allCards[i], allCards[j]] = [allCards[j], allCards[i]];
      }

      setCards(allCards);
      setCurrentIndex(0);
      setLoading(false);
    };

    buildCards();
  }, [sentences]);

  const currentCard = cards[currentIndex];
  const allDone = !loading && cards.length === 0;

  const hasAudioFile = useCallback(
    (card: ListeningCard) => audioCategories?.includes(card.category) ?? false,
    [audioCategories]
  );

  const playCurrentCard = useCallback(() => {
    if (!currentCard) return;
    const audioFile = hasAudioFile(currentCard) ? `./audio/${currentCard.id}.mp3` : undefined;
    playAudio(currentCard.french, audioFile);
  }, [currentCard, hasAudioFile, playAudio]);

  // Auto-play on card load
  useEffect(() => {
    if (currentCard && !flipped) {
      const timeout = setTimeout(playCurrentCard, 300);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, currentCard, flipped]);

  const nextCard = useCallback(() => {
    stop();
    resetFlip();
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setCards((prev) => prev.filter((_, i) => i > currentIndex));
      setCurrentIndex(0);
    }
  }, [currentIndex, cards.length, resetFlip, stop]);

  const handleSwipeRight = useCallback(async () => {
    if (!currentCard) return;
    const mastered = await recordCorrect(currentCard.statId);
    if (mastered) {
      setCards((prev) => prev.filter((c) => c.statId !== currentCard.statId));
      stop();
      resetFlip();
    } else {
      nextCard();
    }
  }, [currentCard, recordCorrect, nextCard, resetFlip, stop]);

  const handleSwipeLeft = useCallback(async () => {
    if (!currentCard) return;
    await recordIncorrect(currentCard.statId);
    nextCard();
  }, [currentCard, recordIncorrect, nextCard]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault();
        if (!flipped) playCurrentCard();
        else flip();
      } else if (e.key === 'ArrowRight' && flipped) {
        handleSwipeRight();
      } else if (e.key === 'ArrowLeft' && flipped) {
        handleSwipeLeft();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [flip, flipped, handleSwipeRight, handleSwipeLeft, playCurrentCard]);

  const handleReset = async () => {
    await resetStats('listening_');
    resetSession();
    window.location.reload();
  };

  const toggleSpeed = () => setSpeed(speed === 1 ? 0.75 : 1);

  const totalCards = sentences?.length ?? 0;

  if (loading) {
    return (
      <PageLayout>
        <Navigation title="Listening" />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-slate-500 dark:text-slate-400">Loading...</p>
        </div>
      </PageLayout>
    );
  }

  if (allDone) {
    return (
      <PageLayout>
        <Navigation title="Listening" />
        <div className="flex flex-1 flex-col items-center justify-center gap-6">
          <div className="text-center">
            <p className="text-4xl">🎉</p>
            <h2 className="mt-4 text-xl font-semibold">All mastered!</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              You've mastered all listening cards.
            </p>
          </div>
          <button
            onClick={handleReset}
            className="rounded-xl bg-indigo-500 px-8 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-indigo-600"
          >
            Reset & Practice Again
          </button>
        </div>
        <StatsBar stats={sessionStats} remaining={0} total={totalCards} />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Navigation
        title="Listening"
        rightElement={
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {cards.length} left
          </span>
        }
      />

      <div className="flex flex-1 flex-col justify-center gap-6 py-4">
        <SwipeContainer
          enabled={flipped}
          onSwipeRight={handleSwipeRight}
          onSwipeLeft={handleSwipeLeft}
        >
          <Flashcard
            flipped={flipped}
            onFlip={flip}
            front={
              <div className="flex flex-col items-center gap-4">
                <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
                  {currentCard.category}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playCurrentCard();
                  }}
                  className="flex size-20 items-center justify-center rounded-full bg-indigo-50 text-indigo-500 transition-colors hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-8">
                    <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSpeed();
                  }}
                  className="rounded-lg px-3 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
                >
                  {speed}x
                </button>
                <p className="text-xs text-slate-400 dark:text-slate-500">Tap card to reveal</p>
              </div>
            }
            back={
              <div className="flex flex-col items-center gap-4 text-center">
                <p className="text-lg font-semibold">{currentCard.french}</p>
                <div className="h-px w-16 bg-slate-200 dark:bg-slate-600" />
                <p className="text-sm text-slate-500 dark:text-slate-400">{currentCard.english}</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playCurrentCard();
                  }}
                  className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-4">
                    <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
                  </svg>
                </button>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Swipe right if correct, left if not
                </p>
              </div>
            }
          />
        </SwipeContainer>

        <StatsBar stats={sessionStats} remaining={cards.length} total={totalCards} />
      </div>
    </PageLayout>
  );
}
```

**Step 2: Add route, verify, commit**

```bash
git add src/pages/Listening.tsx src/App.tsx
git commit -m "feat: add Listening page with audio playback and swipe"
```

---

## Task 17: Settings Page

**Goal:** Build the settings page with app info, update checking, audio management, and data management.

**Files:**
- Create: `src/pages/Settings.tsx`
- Modify: `src/App.tsx` — add route

**Step 1: Create Settings page**

Create: `src/pages/Settings.tsx`

```tsx
import { useState } from 'react';
import { PageLayout } from '../components/PageLayout';
import { Navigation } from '../components/Navigation';
import { ThemeToggle } from '../components/ThemeToggle';
import { useUpdateCheck } from '../hooks/useDatabase';
import { APP_VERSION } from '../lib/constants';
import { db } from '../lib/db';

export function Settings() {
  const { updateAvailable, checking, checkForUpdate, applyUpdate } = useUpdateCheck();
  const [clearing, setClearing] = useState(false);

  const clearAllData = async () => {
    setClearing(true);
    try {
      await db.delete();
      localStorage.clear();
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) await reg.unregister();
      const cacheNames = await caches.keys();
      for (const name of cacheNames) await caches.delete(name);
      window.location.reload();
    } catch {
      setClearing(false);
    }
  };

  const clearStats = async () => {
    await db.stats.clear();
    alert('Stats cleared successfully.');
  };

  return (
    <PageLayout>
      <Navigation title="Settings" rightElement={<ThemeToggle />} />

      <div className="mt-8 space-y-8">
        {/* App Info */}
        <section>
          <h2 className="mb-4 text-sm font-medium text-slate-500 dark:text-slate-400">App Info</h2>
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Version</span>
              <span className="font-medium">{APP_VERSION}</span>
            </div>
          </div>
        </section>

        {/* Updates */}
        <section>
          <h2 className="mb-4 text-sm font-medium text-slate-500 dark:text-slate-400">Updates</h2>
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            {updateAvailable ? (
              <div className="space-y-3">
                <p className="text-sm">
                  Version <span className="font-medium">{updateAvailable}</span> available
                </p>
                <button
                  onClick={applyUpdate}
                  className="w-full rounded-xl bg-indigo-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-600"
                >
                  Update Now
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {checking ? 'Checking...' : 'You're up to date.'}
                </p>
                <button
                  onClick={checkForUpdate}
                  disabled={checking}
                  className="w-full rounded-xl bg-slate-100 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 disabled:opacity-50 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                >
                  Check for Updates
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Data Management */}
        <section>
          <h2 className="mb-4 text-sm font-medium text-slate-500 dark:text-slate-400">Data</h2>
          <div className="space-y-3">
            <button
              onClick={clearStats}
              className="w-full rounded-xl border border-slate-200 bg-white py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Reset All Progress
            </button>
            <button
              onClick={clearAllData}
              disabled={clearing}
              className="w-full rounded-xl border border-rose-200 bg-white py-3 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50 dark:border-rose-800 dark:bg-slate-800 dark:text-rose-400 dark:hover:bg-rose-500/10"
            >
              {clearing ? 'Clearing...' : 'Clear All Data & Cache'}
            </button>
          </div>
        </section>
      </div>
    </PageLayout>
  );
}
```

**Step 2: Add route, verify, commit**

```bash
git add src/pages/Settings.tsx src/App.tsx
git commit -m "feat: add Settings page with updates and data management"
```

---

## Task 18: Update Banner Component

**Goal:** Show an update notification banner when a new version is available.

**Files:**
- Create: `src/components/UpdateBanner.tsx`
- Modify: `src/App.tsx` — add banner to layout

**Step 1: Create UpdateBanner**

Create: `src/components/UpdateBanner.tsx`

```tsx
import { useUpdateCheck } from '../hooks/useDatabase';

export function UpdateBanner() {
  const { updateAvailable, applyUpdate } = useUpdateCheck();

  if (!updateAvailable) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-between bg-indigo-500 px-4 py-2 text-sm text-white">
      <span>Version {updateAvailable} available</span>
      <button
        onClick={applyUpdate}
        className="rounded-lg bg-white/20 px-3 py-1 text-xs font-medium transition-colors hover:bg-white/30"
      >
        Update
      </button>
    </div>
  );
}
```

**Step 2: Add to App.tsx layout**

Modify `src/App.tsx` to include `<UpdateBanner />` before the `<Routes>`.

**Step 3: Commit**

```bash
git add src/components/UpdateBanner.tsx src/App.tsx
git commit -m "feat: add update notification banner"
```

---

## Task 19: Final App.tsx Assembly

**Goal:** Ensure App.tsx has all routes and the complete layout.

**Files:**
- Modify: `src/App.tsx`

**Step 1: Write final App.tsx**

```tsx
import { HashRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { UpdateBanner } from './components/UpdateBanner';
import { Home } from './pages/Home';
import { PracticeSetup } from './pages/PracticeSetup';
import { Practice } from './pages/Practice';
import { ListeningSetup } from './pages/ListeningSetup';
import { Listening } from './pages/Listening';
import { Settings } from './pages/Settings';

export function App() {
  return (
    <ThemeProvider>
      <UpdateBanner />
      <HashRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/practice-setup" element={<PracticeSetup />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/listening-setup" element={<ListeningSetup />} />
          <Route path="/listening" element={<Listening />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </HashRouter>
    </ThemeProvider>
  );
}
```

**Step 2: Commit**

```bash
git add src/App.tsx
git commit -m "feat: assemble all routes in App.tsx"
```

---

## Task 20: Move Old Files & Clean Up

**Goal:** Move the old vanilla JS/HTML/CSS files out of the root so they don't conflict with the Vite build, and ensure `public/` has all needed assets.

**Step 1: Create `legacy/` directory and move old files**

```bash
mkdir -p legacy
mv index.html legacy/ 2>/dev/null || true  # Already replaced by Vite's index.html
mv practice-setup.html practice-setup.js legacy/
mv practice.html practice.js practice.css legacy/
mv listening-setup.html listening-setup.js legacy/
mv listening.html listening.js listening.css legacy/
mv settings.html settings.js settings.css legacy/
mv shared.js shared.css legacy/
mv sw.js legacy/
mv manifest.json legacy/
```

Note: Only move files that have been replaced. Keep `words.json`, `sentences.json`, `version.json`, `audio/`, `icons/` in place if they're symlinked to `public/`, OR ensure they exist in `public/`.

**Step 2: Update .gitignore**

Add to `.gitignore`:
```
node_modules
dist
```

**Step 3: Verify build**

```bash
npm run build
```

Ensure the build succeeds and `dist/` is created.

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: move legacy files and clean up project structure"
```

---

## Task 21: GitHub Actions Deployment

**Goal:** Add a GitHub Actions workflow to build and deploy to GitHub Pages.

**Files:**
- Create: `.github/workflows/deploy.yml`

**Step 1: Create deployment workflow**

Create: `.github/workflows/deploy.yml`

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

**Step 2: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: add GitHub Actions workflow for Pages deployment"
```

---

## Task 22: End-to-End Verification

**Goal:** Run the full app locally, test all flows, fix any issues.

**Step 1: Start dev server**

```bash
npm run dev
```

**Step 2: Test all flows**

Walk through each flow:
1. Home → Theme toggle (light/dark)
2. Home → Practice Setup → change direction, toggle hint, select tenses → Start Practice
3. Practice: flip card, swipe right/left, verify stats update, keyboard shortcuts
4. Home → Listening Setup → select categories → Start Listening
5. Listening: play audio, flip, swipe, speed toggle
6. Settings: check for updates, reset progress, clear data

**Step 3: Test production build**

```bash
npm run build && npm run preview
```

Verify the built app works with HashRouter routing.

**Step 4: Fix any issues found during testing**

Address any bugs, styling issues, or broken flows.

**Step 5: Final commit**

```bash
git add -A
git commit -m "fix: address issues found during e2e testing"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Vite + React + TS scaffolding | package.json, vite.config.ts, tsconfig.json, index.html, src/main.tsx, src/App.tsx, src/index.css |
| 2 | Types & constants | src/lib/types.ts, src/lib/constants.ts |
| 3 | Dexie database | src/lib/db.ts |
| 4 | Theme context | src/context/ThemeContext.tsx, src/components/ThemeToggle.tsx |
| 5 | Navigation & layout | src/components/Navigation.tsx, src/components/PageLayout.tsx |
| 6 | Settings hook | src/hooks/useSettings.ts |
| 7 | Database hook | src/hooks/useDatabase.ts |
| 8 | Mastery hook | src/hooks/useMastery.ts |
| 9 | Flashcard component | src/components/Flashcard.tsx |
| 10 | SwipeContainer + StatsBar | src/components/SwipeContainer.tsx, src/components/StatsBar.tsx |
| 11 | Home page | src/pages/Home.tsx |
| 12 | Practice Setup page | src/pages/PracticeSetup.tsx |
| 13 | Practice page | src/pages/Practice.tsx |
| 14 | Listening Setup page | src/pages/ListeningSetup.tsx |
| 15 | Audio hook | src/hooks/useAudio.ts |
| 16 | Listening page | src/pages/Listening.tsx |
| 17 | Settings page | src/pages/Settings.tsx |
| 18 | Update banner | src/components/UpdateBanner.tsx |
| 19 | App.tsx assembly | src/App.tsx |
| 20 | Clean up legacy files | legacy/, .gitignore |
| 21 | GitHub Actions deploy | .github/workflows/deploy.yml |
| 22 | End-to-end verification | All files |
