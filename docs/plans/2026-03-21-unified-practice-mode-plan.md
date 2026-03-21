# Unified Practice Mode Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace separate conjugation and tense practice modes with a single unified flashcard mode supporting EN→FR/FR→EN direction, infinitive hints, tense selection, and mastery tracking.

**Architecture:** Clean file structure (Approach B). Delete all old mode-specific files. Create `practice-setup.html/js` for configuration and `practice.html/js/css` for flashcard practice. Unify data into a single `words.json` v2.0.0 with tenses and English translations per entry.

**Tech Stack:** Pure HTML/CSS/JS, IndexedDB, Service Worker, localStorage.

---

### Task 1: Create unified words.json

**Files:**
- Modify: `words.json`

**Context:** Current `words.json` has 80+ verbs with only present-tense `conjugations`. Current `tense-practice-words.json` has 5 verbs with pre-composed phrases. The new format nests all tenses under each verb with `{ french, english }` objects per pronoun.

**Step 1: Rewrite words.json to v2.0.0 format**

Transform every verb in the current `words.json` to the new format. The new structure for each verb:

```json
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
    "passe_compose": {
      "je": { "french": "ai été", "english": "I was" },
      "tu": { "french": "as été", "english": "you were" },
      "il": { "french": "a été", "english": "he was" },
      "nous": { "french": "avons été", "english": "we were" },
      "vous": { "french": "avez été", "english": "you were" },
      "ils": { "french": "ont été", "english": "they were" }
    },
    "imparfait": {
      "je": { "french": "étais", "english": "I was being" },
      ...
    },
    "futur": {
      "je": { "french": "serai", "english": "I will be" },
      ...
    },
    "conditionnel": {
      "je": { "french": "serais", "english": "I would be" },
      ...
    }
  }
}
```

Remove the old `conjugations` field. Version: `"2.0.0"`.

This file will be large. Include all 80+ verbs with all 5 tenses. Each verb × 6 pronouns × 5 tenses = 30 entries per verb. All English translations must be natural (e.g., "he goes" not "he go"). Handle special cases:
- `falloir` is impersonal: only `il` forms are valid. For other pronouns, omit them or use `null`.
- Verbs using `être` as auxiliary in passé composé (aller, venir, partir, etc.) need agreement markers: `"allé(e)"`, `"allé(e)s"`.
- `je` before vowels uses `j'` in passé composé: `"j'ai été"`, `"j'ai eu"`.

**Step 2: Validate the JSON is well-formed**

Run: `python3 -c "import json; d=json.load(open('words.json')); print(f'{len(d[\"verbs\"])} verbs, version {d[\"version\"]}')"`

Expected: `XX verbs, version 2.0.0`

**Step 3: Commit**

```bash
git add words.json
git commit -m "feat: rewrite words.json to v2.0.0 unified format with all tenses"
```

---

### Task 2: Update shared.js for new data format

**Files:**
- Modify: `shared.js`

**Context:** The stats store currently uses `keyPath: 'infinitive'` but stores keys like `être_je`. The new key format is `être_je_present`. We need to bump DB_VERSION to trigger `onupgradeneeded` which will clear the old stats (acceptable since we're changing the key format).

**Step 1: Update shared.js**

Changes needed:
1. Bump `DB_VERSION` from `2` to `3`
2. In `onupgradeneeded`, delete and recreate the `stats` store when upgrading from v2 (old stats are incompatible with new key format)
3. No other changes needed — `loadVerbs()`, `saveVerbsToDB()`, `getVerbsFromDB()` all work the same since verbs are stored as objects with `infinitive` keyPath

```javascript
const DB_VERSION = 3;

request.onupgradeneeded = (event) => {
    const db = event.target.result;

    if (!db.objectStoreNames.contains(VERBS_STORE)) {
        db.createObjectStore(VERBS_STORE, { keyPath: 'infinitive' });
    }

    if (!db.objectStoreNames.contains(METADATA_STORE)) {
        db.createObjectStore(METADATA_STORE, { keyPath: 'key' });
    }

    // Recreate stats store for new key format (verb_pronoun_tense)
    if (db.objectStoreNames.contains(STATS_STORE)) {
        db.deleteObjectStore(STATS_STORE);
    }
    db.createObjectStore(STATS_STORE, { keyPath: 'id' });
};
```

Note: Changed `keyPath` from `'infinitive'` to `'id'` so the key field name matches its actual purpose.

**Step 2: Commit**

```bash
git add shared.js
git commit -m "feat: bump DB to v3, update stats store key format for unified mode"
```

---

### Task 3: Create practice-setup.html and practice-setup.js

**Files:**
- Create: `practice-setup.html`
- Create: `practice-setup.js`

**Context:** This replaces `tenses.html` (tense selection) + the mode selection pages. It has: direction toggle (EN→FR / FR→EN), show infinitive checkbox, tense checkboxes, and a start button. All selections persist to localStorage.

**Step 1: Create practice-setup.html**

Structure:
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <!-- Same meta tags as other pages -->
    <title>Practice Setup - French Verbs</title>
    <link rel="stylesheet" href="shared.css">
    <!-- Inline styles for this page only (like tenses.html pattern) -->
</head>
<body>
    <div class="container">
        <header>
            <a href="index.html" class="home-btn">← Home</a>
            <h1>Practice Setup</h1>
        </header>
        <main>
            <!-- Direction toggle: two buttons, one active -->
            <div class="setup-section">
                <h2>Direction</h2>
                <div class="toggle-group">
                    <button class="toggle-btn active" data-direction="en-fr">English → French</button>
                    <button class="toggle-btn" data-direction="fr-en">French → English</button>
                </div>
            </div>

            <!-- Show infinitive checkbox -->
            <div class="setup-section">
                <label class="checkbox-label">
                    <input type="checkbox" id="show-infinitive" checked>
                    <span class="checkmark"></span>
                    Show verb infinitive as hint
                </label>
            </div>

            <!-- Tense selection -->
            <div class="setup-section">
                <h2>Tenses</h2>
                <button id="select-all-btn" class="btn">Select All</button>
                <div class="tense-list">
                    <!-- Checkboxes for: present, passe_compose, imparfait, futur, conditionnel -->
                </div>
            </div>

            <!-- Start button -->
            <button id="start-btn" class="start-btn" disabled>Start Practice</button>
        </main>
    </div>
    <script src="shared.js"></script>
    <script src="practice-setup.js"></script>
</body>
</html>
```

Inline CSS styling for this page should follow the existing tenses.html aesthetic: white cards, purple gradient background, checkbox custom styling, rounded sections.

**Step 2: Create practice-setup.js**

Logic:
1. On load, restore selections from localStorage keys: `practiceDirection` (default: `'en-fr'`), `practiceShowInfinitive` (default: `true`), `practiceTenses` (default: `['present']`)
2. Direction toggle: clicking a button sets it active, saves to localStorage
3. Show infinitive: checkbox change saves to localStorage
4. Tense checkboxes: check/uncheck saves array to localStorage. If none selected, disable start button
5. Select All/Deselect All: toggles all tense checkboxes
6. Start button: navigates to `practice.html?direction=en-fr&showInfinitive=true&tenses=present,futur`

Available tenses (in order):
```javascript
const TENSES = [
    { key: 'present', name: 'Présent' },
    { key: 'passe_compose', name: 'Passé Composé' },
    { key: 'imparfait', name: 'Imparfait' },
    { key: 'futur', name: 'Futur Simple' },
    { key: 'conditionnel', name: 'Conditionnel' }
];
```

**Step 3: Commit**

```bash
git add practice-setup.html practice-setup.js
git commit -m "feat: add practice setup screen with direction, infinitive, and tense options"
```

---

### Task 4: Create practice.css

**Files:**
- Create: `practice.css`

**Context:** This consolidates the card, stats, swipe, and animation styles from `styles.css` and `tenses-practice.css` into a single file. These two CSS files are nearly identical — merge them, keeping the best of both.

**Step 1: Create practice.css**

Content to include (taken from existing `styles.css`):
- `.session-stats` + `.stat-item` + `.stat-value` + `.stat-label` + `.stat-correct` + `.stat-incorrect` + `.stat-accuracy` — the stats bar
- `.card-container` + `.card` + `.card.swiping` + `.card-inner` + `.card.flipped .card-inner` — card structure
- `.card-front` + `.card-back` — card faces with 3D flip
- `.verb-info` — text container
- `.question-text` — main question text (replaces both `.infinitive`/`.english-phrase` with a single class)
- `.hint-text` — for infinitive hint and tense label
- `.answer-text` — main answer text (replaces `.conjugation`)
- `.secondary-text` — for additional info on back (replaces `.english-translation`)
- `.instruction` + `.swipe-instruction` + `.swipe-left` + `.swipe-right` — tap/swipe hints
- `.reset-btn` — reset button styling (use `.btn` class from shared.css instead of duplicating)
- Swipe animations: `@keyframes swipeRight`, `@keyframes swipeLeft`
- Responsive breakpoint at 600px

**Step 2: Commit**

```bash
git add practice.css
git commit -m "feat: add consolidated practice.css with card, stats, and swipe styles"
```

---

### Task 5: Create practice.html

**Files:**
- Create: `practice.html`

**Context:** This is the flashcard practice page. Based on `conjugation.html` structure but with flexible content areas that work for both EN→FR and FR→EN directions.

**Step 1: Create practice.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <!-- Same meta tags as other pages -->
    <title>Practice - French Verbs</title>
    <link rel="stylesheet" href="shared.css">
    <link rel="stylesheet" href="practice.css">
</head>
<body>
    <div class="container">
        <header>
            <a href="practice-setup.html" class="home-btn">← Back</a>
            <h1>Practice</h1>
            <div id="status" class="status"></div>
        </header>

        <main>
            <div id="loading" class="loading">
                <div class="spinner"></div>
                <p>Loading verbs...</p>
            </div>

            <div id="card-container" class="card-container hidden">
                <div class="session-stats">
                    <div class="stat-item stat-incorrect">
                        <div class="stat-value" id="session-incorrect">0</div>
                        <div class="stat-label">Incorrect</div>
                    </div>
                    <div class="stat-item stat-accuracy">
                        <div class="stat-value" id="session-accuracy">—</div>
                        <div class="stat-label">Accuracy</div>
                    </div>
                    <div class="stat-item stat-correct">
                        <div class="stat-value" id="session-correct">0</div>
                        <div class="stat-label">Correct</div>
                    </div>
                </div>

                <div id="card" class="card">
                    <div class="card-inner">
                        <div class="card-front">
                            <div class="verb-info">
                                <div class="question-text" id="question"></div>
                                <div class="hint-text" id="hint"></div>
                            </div>
                            <div class="instruction">Tap to reveal answer</div>
                        </div>
                        <div class="card-back">
                            <div class="verb-info">
                                <div class="question-text" id="question-back"></div>
                                <div class="hint-text" id="hint-back"></div>
                            </div>
                            <div class="answer-text" id="answer"></div>
                            <div class="secondary-text" id="secondary"></div>
                            <div class="swipe-instruction">
                                <span class="swipe-left">← Wrong</span>
                                <span class="swipe-right">Right →</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div id="error" class="error hidden"></div>
        </main>

        <footer>
            <div class="stats">
                <span id="card-count">0 cards remaining</span>
            </div>
            <button id="reset-btn" class="btn" title="Reset all progress">Reset Progress</button>
        </footer>
    </div>

    <script src="shared.js"></script>
    <script src="practice.js"></script>
</body>
</html>
```

**Step 2: Commit**

```bash
git add practice.html
git commit -m "feat: add practice.html with flexible card layout for both directions"
```

---

### Task 6: Create practice.js

**Files:**
- Create: `practice.js`

**Context:** This is the core logic, adapted from `app.js` (mastery + swipe + stats) but handling both directions, all tenses, and the infinitive hint option. Key differences from old `app.js`:
- Reads config from URL params (direction, showInfinitive, tenses)
- Combinations are `{ verb, pronoun, tense }` triples instead of `{ verb, pronoun }` pairs
- Stats key format: `${infinitive}_${pronoun}_${tense}`
- Card content depends on direction setting

**Step 1: Create practice.js**

Key sections (adapted from existing `app.js` logic):

```javascript
// Config from URL params
const urlParams = new URLSearchParams(window.location.search);
const direction = urlParams.get('direction') || 'en-fr';
const showInfinitive = urlParams.get('showInfinitive') !== 'false';
const selectedTenses = (urlParams.get('tenses') || 'present').split(',');

// Tense display names
const TENSE_NAMES = {
    present: 'Présent',
    passe_compose: 'Passé Composé',
    imparfait: 'Imparfait',
    futur: 'Futur Simple',
    conditionnel: 'Conditionnel'
};

const PRONOUNS = ['je', 'tu', 'il', 'nous', 'vous', 'ils'];
const MASTERY_THRESHOLD = 3;

// State
let allVerbs = [];
let availableCombinations = []; // { verb, pronoun, tense }
let currentCombo = null;
let isFlipped = false;
// ... sessionStats, touch vars same as app.js

// Build combinations from verbs + selected tenses
function buildCombinations(verbs) {
    const combos = [];
    for (const verb of verbs) {
        for (const tense of selectedTenses) {
            if (!verb.tenses || !verb.tenses[tense]) continue;
            for (const pronoun of PRONOUNS) {
                const entry = verb.tenses[tense][pronoun];
                if (!entry || !entry.french) continue; // skip null entries (falloir)
                combos.push({ verb, pronoun, tense });
            }
        }
    }
    return combos;
}

// Stats key
function comboKey(infinitive, pronoun, tense) {
    return `${infinitive}_${pronoun}_${tense}`;
}

// getCombinationStats — same pattern as app.js but with id field and tense
function getCombinationStats(infinitive, pronoun, tense) {
    return new Promise((resolve, reject) => {
        const key = comboKey(infinitive, pronoun, tense);
        const transaction = db.transaction([STATS_STORE], 'readonly');
        const store = transaction.objectStore(STATS_STORE);
        const request = store.get(key);
        request.onsuccess = () => {
            resolve(request.result || {
                id: key,
                verb: infinitive,
                pronoun,
                tense,
                correct: 0,
                incorrect: 0,
                totalAttempts: 0,
                lastPracticed: null
            });
        };
        request.onerror = () => reject(request.error);
    });
}

// filterUnmasteredCombinations — same pattern as app.js
// updateCombinationStats — same pattern as app.js but uses `id` field
// resetAllStats — same as app.js

// showNextCard — direction-aware card content
function showNextCard() {
    if (availableCombinations.length === 0) return;

    isFlipped = false;
    elements.card.classList.remove('flipped');

    currentCombo = availableCombinations[Math.floor(Math.random() * availableCombinations.length)];
    const { verb, pronoun, tense } = currentCombo;
    const entry = verb.tenses[tense][pronoun];
    const tenseName = TENSE_NAMES[tense];

    if (direction === 'en-fr') {
        // Front: English phrase, Back: French conjugation + tense
        elements.question.textContent = entry.english;
        elements.questionBack.textContent = entry.english;
        elements.answer.textContent = entry.french;
        elements.secondary.textContent = tenseName;
        elements.hint.textContent = showInfinitive ? `(${verb.infinitive})` : '';
        elements.hintBack.textContent = showInfinitive ? `(${verb.infinitive})` : '';
    } else {
        // Front: French conjugation + tense, Back: English phrase
        elements.question.textContent = entry.french;
        elements.questionBack.textContent = entry.french;
        elements.answer.textContent = entry.english;
        elements.secondary.textContent = tenseName;
        elements.hint.textContent = showInfinitive ? `(${verb.infinitive}) — ${tenseName}` : tenseName;
        elements.hintBack.textContent = showInfinitive ? `(${verb.infinitive}) — ${tenseName}` : tenseName;
    }
}

// Event listeners — EXACT same swipe/flip/keyboard logic as app.js
// (touch events, mouse drag, keyboard Space/Arrow)
```

The swipe gesture code, flip card logic, session stats, and all event listeners are copied directly from `app.js` lines 249-330 with no changes to the interaction behavior.

**Step 2: Commit**

```bash
git add practice.js
git commit -m "feat: add practice.js with unified flashcard logic, mastery, and direction support"
```

---

### Task 7: Update index.html

**Files:**
- Modify: `index.html`

**Context:** Replace the two mode cards (Conjugation Practice + Tense Practice) with a single "Practice" card linking to `practice-setup.html`. Keep the extensible grid for future modes.

**Step 1: Update index.html mode grid**

Replace the two `<a>` mode cards with:

```html
<a href="practice-setup.html" class="mode-card">
    <div class="mode-icon">📝</div>
    <div class="mode-title">Verb Practice</div>
    <div class="mode-description">
        Practice French verb conjugation across all tenses with flashcards
    </div>
</a>

<!-- Future modes will be added here -->
```

**Step 2: Commit**

```bash
git add index.html
git commit -m "feat: update home screen with single unified practice mode"
```

---

### Task 8: Update sw.js

**Files:**
- Modify: `sw.js`

**Context:** Replace hardcoded file list with new files and use a simpler network-first strategy check.

**Step 1: Update sw.js**

1. Bump `CACHE_NAME` to `'french-conjugation-v31'`
2. Replace `urlsToCache` array:

```javascript
const urlsToCache = [
    './',
    './index.html',
    './practice-setup.html',
    './practice.html',
    './settings.html',
    './practice.js',
    './practice-setup.js',
    './shared.js',
    './settings.js',
    './practice.css',
    './shared.css',
    './settings.css',
    './words.json',
    './manifest.json',
    './icons/manifest-icon-192.maskable.png',
    './icons/manifest-icon-512.maskable.png',
    './icons/apple-icon-180.png',
    './icons/favicon-196.png'
];
```

3. Replace the hardcoded fetch condition with a pattern-based check:

```javascript
// Network-first for all app files (HTML, JS, CSS, JSON)
const pathname = url.pathname;
const isAppFile = pathname.endsWith('.html') || pathname.endsWith('.js') ||
                  pathname.endsWith('.css') || pathname.endsWith('.json');

if (isAppFile) {
    // ... network-first strategy (same logic as before)
}
```

**Step 2: Commit**

```bash
git add sw.js
git commit -m "feat: update service worker with new file list and pattern-based strategy"
```

---

### Task 9: Delete old files

**Files:**
- Delete: `conjugation.html`, `conjugation-mode.html`, `conjugation-multiple-choice.html`
- Delete: `tenses.html`, `tenses-mode.html`, `tenses-practice.html`, `tenses-multiple-choice.html`
- Delete: `app.js`, `tenses-practice.js`, `conjugation-multiple-choice.js`, `tenses-multiple-choice.js`
- Delete: `styles.css`, `tenses-practice.css`, `multiple-choice.css`
- Delete: `tense-practice-words.json`

**Step 1: Delete all old files**

```bash
git rm conjugation.html conjugation-mode.html conjugation-multiple-choice.html
git rm tenses.html tenses-mode.html tenses-practice.html tenses-multiple-choice.html
git rm app.js tenses-practice.js conjugation-multiple-choice.js tenses-multiple-choice.js
git rm styles.css tenses-practice.css multiple-choice.css
git rm tense-practice-words.json
```

**Step 2: Commit**

```bash
git commit -m "chore: remove old mode-specific files replaced by unified practice mode"
```

---

### Task 10: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Update CLAUDE.md**

Update the file structure section to reflect new files. Update the data format section. Bump the service worker cache version reference. Remove references to conjugation mode and tense mode as separate entities.

Key changes:
- File structure: list new files (practice-setup.html/js, practice.html/js/css), remove old files
- Data format: show new v2.0.0 format with tenses + english per entry
- Service worker: update current version to `french-conjugation-v31`
- Remove old `conjugations` field from data format docs

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md to reflect unified practice mode architecture"
```

---

### Task 11: Manual browser test

**Step 1: Start a local server and test**

Run: `python3 -m http.server 8000`

Test checklist:
- [ ] Home screen shows single "Verb Practice" card
- [ ] Settings page still works (clear cache, show stats)
- [ ] Practice setup: direction toggle persists to localStorage
- [ ] Practice setup: infinitive toggle persists
- [ ] Practice setup: tense checkboxes persist, select all works
- [ ] Practice setup: start button disabled when no tenses selected
- [ ] EN→FR mode: front shows English, back shows French + tense
- [ ] FR→EN mode: front shows French + tense, back shows English
- [ ] Infinitive hint shows/hides correctly
- [ ] Card flip animation works (tap/Space)
- [ ] Swipe right/left works (touch, mouse drag, arrow keys)
- [ ] Swipe animations play correctly
- [ ] Stats bar updates (correct/incorrect/accuracy)
- [ ] Mastery: 3 correct removes card from pool
- [ ] Mastery: incorrect resets counter
- [ ] "All mastered" message when pool empty
- [ ] Reset progress works
- [ ] Card count updates
- [ ] Service worker registers and caches
- [ ] Offline mode works after initial load

**Step 2: Fix any issues found during testing**

**Step 3: Final commit if fixes needed**
