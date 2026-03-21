# Listening Comprehension Mode — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a listening comprehension practice mode where users hear French sentences via TTS and test their understanding using the same flashcard/swipe/mastery pattern as verb practice.

**Architecture:** Mirror the verb practice pattern — separate setup page (category selection) and practice page (TTS flashcard). New `sentences` IndexedDB store with independent version tracking. Web Speech API for TTS.

**Tech Stack:** Vanilla HTML/CSS/JS, Web Speech API (speechSynthesis), IndexedDB

---

### Task 1: Create sentences.json with sample data

**Files:**
- Create: `sentences.json`

**Step 1: Create the data file**

```json
{
  "version": "1.0.0",
  "categories": {
    "greetings": "Greetings & Small Talk",
    "restaurant": "At the Restaurant",
    "shopping": "Shopping",
    "directions": "Asking for Directions",
    "travel": "Travel & Transport",
    "phone": "Phone Conversations"
  },
  "sentences": [
    { "id": "greetings_001", "category": "greetings", "french": "Bonjour, comment allez-vous ?", "english": "Hello, how are you?" },
    { "id": "greetings_002", "category": "greetings", "french": "Je m'appelle Marie, et vous ?", "english": "My name is Marie, and you?" },
    { "id": "greetings_003", "category": "greetings", "french": "Enchanté de faire votre connaissance.", "english": "Nice to meet you." },
    { "id": "greetings_004", "category": "greetings", "french": "Comment ça va aujourd'hui ?", "english": "How are you doing today?" },
    { "id": "greetings_005", "category": "greetings", "french": "Ça fait longtemps qu'on ne s'est pas vus !", "english": "It's been a long time since we last saw each other!" },
    { "id": "greetings_006", "category": "greetings", "french": "Bonsoir, vous allez bien ?", "english": "Good evening, are you doing well?" },
    { "id": "greetings_007", "category": "greetings", "french": "À bientôt, bonne journée !", "english": "See you soon, have a nice day!" },
    { "id": "greetings_008", "category": "greetings", "french": "Salut, quoi de neuf ?", "english": "Hi, what's new?" },

    { "id": "restaurant_001", "category": "restaurant", "french": "Je voudrais un café, s'il vous plaît.", "english": "I would like a coffee, please." },
    { "id": "restaurant_002", "category": "restaurant", "french": "L'addition, s'il vous plaît.", "english": "The check, please." },
    { "id": "restaurant_003", "category": "restaurant", "french": "Est-ce que vous avez une table pour deux ?", "english": "Do you have a table for two?" },
    { "id": "restaurant_004", "category": "restaurant", "french": "Qu'est-ce que vous recommandez ?", "english": "What do you recommend?" },
    { "id": "restaurant_005", "category": "restaurant", "french": "Je suis allergique aux noix.", "english": "I am allergic to nuts." },
    { "id": "restaurant_006", "category": "restaurant", "french": "Puis-je voir le menu, s'il vous plaît ?", "english": "May I see the menu, please?" },
    { "id": "restaurant_007", "category": "restaurant", "french": "Je vais prendre le plat du jour.", "english": "I'll have the dish of the day." },
    { "id": "restaurant_008", "category": "restaurant", "french": "C'était délicieux, merci beaucoup.", "english": "It was delicious, thank you very much." },

    { "id": "shopping_001", "category": "shopping", "french": "Combien ça coûte ?", "english": "How much does it cost?" },
    { "id": "shopping_002", "category": "shopping", "french": "Est-ce que je peux essayer cette taille ?", "english": "Can I try this size?" },
    { "id": "shopping_003", "category": "shopping", "french": "Vous acceptez la carte bancaire ?", "english": "Do you accept credit cards?" },
    { "id": "shopping_004", "category": "shopping", "french": "Je cherche un cadeau pour mon ami.", "english": "I'm looking for a gift for my friend." },
    { "id": "shopping_005", "category": "shopping", "french": "Est-ce qu'il y a une réduction ?", "english": "Is there a discount?" },
    { "id": "shopping_006", "category": "shopping", "french": "Je fais du trente-huit en chaussures.", "english": "I'm a size 38 in shoes." },
    { "id": "shopping_007", "category": "shopping", "french": "Où sont les cabines d'essayage ?", "english": "Where are the fitting rooms?" },
    { "id": "shopping_008", "category": "shopping", "french": "Je voudrais échanger cet article.", "english": "I would like to exchange this item." },

    { "id": "directions_001", "category": "directions", "french": "Excusez-moi, où se trouve la gare ?", "english": "Excuse me, where is the train station?" },
    { "id": "directions_002", "category": "directions", "french": "Tournez à gauche au prochain carrefour.", "english": "Turn left at the next intersection." },
    { "id": "directions_003", "category": "directions", "french": "C'est à cinq minutes à pied d'ici.", "english": "It's a five-minute walk from here." },
    { "id": "directions_004", "category": "directions", "french": "Prenez la deuxième rue à droite.", "english": "Take the second street on the right." },
    { "id": "directions_005", "category": "directions", "french": "Est-ce que c'est loin d'ici ?", "english": "Is it far from here?" },
    { "id": "directions_006", "category": "directions", "french": "Continuez tout droit pendant deux cents mètres.", "english": "Continue straight ahead for two hundred meters." },
    { "id": "directions_007", "category": "directions", "french": "La pharmacie est en face de la boulangerie.", "english": "The pharmacy is across from the bakery." },
    { "id": "directions_008", "category": "directions", "french": "Je suis perdu, pouvez-vous m'aider ?", "english": "I'm lost, can you help me?" },

    { "id": "travel_001", "category": "travel", "french": "À quelle heure part le prochain train ?", "english": "What time does the next train leave?" },
    { "id": "travel_002", "category": "travel", "french": "Je voudrais un billet aller-retour.", "english": "I would like a round-trip ticket." },
    { "id": "travel_003", "category": "travel", "french": "Où est l'arrêt de bus le plus proche ?", "english": "Where is the nearest bus stop?" },
    { "id": "travel_004", "category": "travel", "french": "Le vol a été retardé de deux heures.", "english": "The flight has been delayed by two hours." },
    { "id": "travel_005", "category": "travel", "french": "J'ai réservé une chambre pour trois nuits.", "english": "I booked a room for three nights." },
    { "id": "travel_006", "category": "travel", "french": "Où puis-je récupérer mes bagages ?", "english": "Where can I pick up my luggage?" },
    { "id": "travel_007", "category": "travel", "french": "Est-ce que le petit déjeuner est inclus ?", "english": "Is breakfast included?" },
    { "id": "travel_008", "category": "travel", "french": "Je voudrais louer une voiture pour la semaine.", "english": "I would like to rent a car for the week." },

    { "id": "phone_001", "category": "phone", "french": "Allô, est-ce que je pourrais parler à Monsieur Dupont ?", "english": "Hello, could I speak to Mr. Dupont?" },
    { "id": "phone_002", "category": "phone", "french": "Je vous rappelle dans cinq minutes.", "english": "I'll call you back in five minutes." },
    { "id": "phone_003", "category": "phone", "french": "Pouvez-vous répéter, s'il vous plaît ?", "english": "Can you repeat that, please?" },
    { "id": "phone_004", "category": "phone", "french": "La ligne est mauvaise, je vous entends mal.", "english": "The connection is bad, I can barely hear you." },
    { "id": "phone_005", "category": "phone", "french": "Je voudrais prendre rendez-vous.", "english": "I would like to make an appointment." },
    { "id": "phone_006", "category": "phone", "french": "Vous avez fait un faux numéro.", "english": "You have the wrong number." },
    { "id": "phone_007", "category": "phone", "french": "Ne quittez pas, je vous mets en attente.", "english": "Hold on, I'm putting you on hold." },
    { "id": "phone_008", "category": "phone", "french": "Merci d'avoir appelé, au revoir.", "english": "Thank you for calling, goodbye." }
  ]
}
```

**Step 2: Commit**

```bash
git add sentences.json
git commit -m "feat: add sentences.json with 48 sample sentences across 6 categories"
```

---

### Task 2: Update shared.js — DB v4, sentence loading utilities

**Files:**
- Modify: `shared.js`

**Step 1: Add sentence constants and bump DB version**

At the top of `shared.js`, after the existing constants:

```javascript
// Change DB_VERSION from 3 to 4
const DB_VERSION = 4;

// Add after WORDS_URL:
const SENTENCES_STORE = 'sentences';
const SENTENCES_URL = './sentences.json';
```

**Step 2: Update onupgradeneeded to create sentences store**

In the `initDB()` function, add inside `onupgradeneeded` (after the stats store block):

```javascript
if (!db.objectStoreNames.contains(SENTENCES_STORE)) {
    db.createObjectStore(SENTENCES_STORE, { keyPath: 'id' });
}
```

**Step 3: Add sentence loading functions**

After the existing `loadVerbs()` function, add:

```javascript
// Fetch sentences from server
async function fetchSentencesFromServer() {
    try {
        const response = await fetch(SENTENCES_URL, { cache: 'no-cache' });
        if (!response.ok) throw new Error('Failed to fetch sentences');
        return await response.json();
    } catch (error) {
        return null;
    }
}

// Get stored sentences version
function getStoredSentencesVersion() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([METADATA_STORE], 'readonly');
        const store = transaction.objectStore(METADATA_STORE);
        const request = store.get('sentences_version');

        request.onsuccess = () => {
            resolve(request.result ? request.result.value : null);
        };
        request.onerror = () => reject(request.error);
    });
}

// Save sentences to IndexedDB
async function saveSentencesToDB(sentencesData, version) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([SENTENCES_STORE, METADATA_STORE], 'readwrite');

        const sentencesStore = transaction.objectStore(SENTENCES_STORE);
        sentencesStore.clear();

        sentencesData.forEach(sentence => {
            sentencesStore.add(sentence);
        });

        const metadataStore = transaction.objectStore(METADATA_STORE);
        metadataStore.put({ key: 'sentences_version', value: version });

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
}

// Get sentences from IndexedDB
function getSentencesFromDB() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([SENTENCES_STORE], 'readonly');
        const store = transaction.objectStore(SENTENCES_STORE);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
}

// Load sentences from IndexedDB or fetch from server
async function loadSentences(updateStatusCallback) {
    try {
        const onlineData = await fetchSentencesFromServer();

        if (onlineData) {
            const currentVersion = await getStoredSentencesVersion();

            if (!currentVersion || onlineData.version !== currentVersion) {
                if (updateStatusCallback) updateStatusCallback('Updating sentences...');
                await saveSentencesToDB(onlineData.sentences, onlineData.version);
                if (updateStatusCallback) updateStatusCallback('✓ Sentences updated');
            } else {
                if (updateStatusCallback) updateStatusCallback('✓ Sentences up to date');
            }
        }
    } catch (error) {
        if (updateStatusCallback) updateStatusCallback('Offline mode');
    }

    const sentences = await getSentencesFromDB();

    if (sentences.length === 0) {
        throw new Error('No sentences available. Please check your internet connection.');
    }

    return sentences;
}
```

**Step 4: Commit**

```bash
git add shared.js
git commit -m "feat: add sentences store (DB v4) and sentence loading utilities"
```

---

### Task 3: Create listening-setup.html and listening-setup.js

**Files:**
- Create: `listening-setup.html`
- Create: `listening-setup.js`

**Step 1: Create listening-setup.html**

Use the exact same structure as `practice-setup.html` but replace the direction/infinitive/tense sections with just category selection. Reuse the same CSS classes (`.setup-card`, `.setup-section`, `.section-title`, `.tense-list`, `.tense-item`, `.custom-checkbox`, `.select-all-btn`, `.start-btn`).

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Practice French listening comprehension">
    <meta name="theme-color" content="#4a90e2">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <meta name="apple-mobile-web-app-title" content="French Verbs">
    <title>Listening Setup - French Verbs</title>
    <link rel="manifest" href="manifest.json">
    <link rel="icon" type="image/png" sizes="196x196" href="./icons/favicon-196.png">
    <link rel="apple-touch-icon" href="./icons/apple-icon-180.png">
    <link rel="stylesheet" href="shared.css">
    <style>
        /* Reuse same setup card styles as practice-setup.html */
        .setup-card {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
            width: 100%;
        }

        .setup-section { margin-bottom: 25px; }
        .setup-section:last-child { margin-bottom: 0; }

        .section-title {
            font-size: 0.85rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #888;
            font-weight: 600;
            margin-bottom: 12px;
        }

        .category-list {
            display: flex;
            flex-direction: column;
            gap: 2px;
        }

        .category-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 12px;
            border-radius: 10px;
            cursor: pointer;
            transition: background 0.2s ease;
        }

        .category-item:hover { background: rgba(102, 126, 234, 0.05); }
        .category-item label { font-size: 1rem; color: #333; cursor: pointer; flex: 1; }

        .custom-checkbox {
            width: 22px;
            height: 22px;
            border: 2px solid #ccc;
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            flex-shrink: 0;
            background: white;
        }

        .custom-checkbox.checked { background: #667eea; border-color: #667eea; }
        .custom-checkbox.checked::after {
            content: '';
            width: 6px;
            height: 11px;
            border: solid white;
            border-width: 0 2.5px 2.5px 0;
            transform: rotate(45deg);
            margin-top: -2px;
        }

        .select-all-btn {
            background: none;
            border: 1px solid #667eea;
            color: #667eea;
            padding: 6px 14px;
            border-radius: 8px;
            font-size: 0.8rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            float: right;
            margin-top: -2px;
        }

        .select-all-btn:hover { background: rgba(102, 126, 234, 0.1); }

        .start-btn {
            width: 100%;
            padding: 16px;
            border: none;
            border-radius: 12px;
            background: #667eea;
            color: white;
            font-size: 1.1rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s ease;
            margin-top: 10px;
        }

        .start-btn:hover:not(:disabled) {
            background: #5a6fd6;
            transform: translateY(-1px);
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }

        .start-btn:active:not(:disabled) { transform: translateY(0); }
        .start-btn:disabled { background: #ccc; cursor: not-allowed; }

        .section-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;
        }

        .section-header .section-title { margin-bottom: 0; }

        @media (max-width: 600px) {
            .setup-card { padding: 25px; }
            .start-btn { font-size: 1rem; padding: 14px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <a href="index.html" class="home-btn">Home</a>
            <h1>Listening Setup</h1>
        </header>

        <main>
            <div class="setup-card">
                <div class="setup-section">
                    <div class="section-header">
                        <div class="section-title">Categories</div>
                        <button class="select-all-btn" id="select-all-btn">Select All</button>
                    </div>
                    <div class="category-list" id="category-list">
                        <!-- Category checkboxes rendered by JS -->
                    </div>
                </div>

                <button class="start-btn" id="start-btn">Start Practice</button>
            </div>
        </main>
    </div>

    <script src="shared.js"></script>
    <script src="listening-setup.js"></script>
</body>
</html>
```

**Step 2: Create listening-setup.js**

```javascript
// Listening Setup Page Logic

// Categories will be loaded from sentences.json via IndexedDB
// but we also need the category display names from the JSON

const categoryList = document.getElementById('category-list');
const selectAllBtn = document.getElementById('select-all-btn');
const startBtn = document.getElementById('start-btn');

// State
let categories = {}; // { key: displayName }
let selectedCategories = JSON.parse(localStorage.getItem('listeningCategories') || '[]');

async function init() {
    try {
        await initDB();
        await loadSentences();

        // Fetch categories from sentences.json (or use cached data)
        const response = await fetch('./sentences.json', { cache: 'no-cache' }).catch(() => null);
        if (response && response.ok) {
            const data = await response.json();
            categories = data.categories;
        } else {
            // Fallback: derive categories from stored sentences
            const sentences = await getSentencesFromDB();
            const uniqueCats = [...new Set(sentences.map(s => s.category))];
            uniqueCats.forEach(cat => {
                categories[cat] = cat.charAt(0).toUpperCase() + cat.slice(1);
            });
        }

        // If no categories selected yet, select the first one
        const categoryKeys = Object.keys(categories);
        if (selectedCategories.length === 0 && categoryKeys.length > 0) {
            selectedCategories = [categoryKeys[0]];
            localStorage.setItem('listeningCategories', JSON.stringify(selectedCategories));
        }

        renderCategories();
        updateStartButton();
    } catch (error) {
        console.error('[ListeningSetup] Error:', error);
    }
}

function renderCategories() {
    categoryList.innerHTML = '';
    const categoryKeys = Object.keys(categories);

    categoryKeys.forEach(key => {
        const item = document.createElement('div');
        item.className = 'category-item';

        const checkbox = document.createElement('div');
        checkbox.className = 'custom-checkbox';
        if (selectedCategories.includes(key)) {
            checkbox.classList.add('checked');
        }

        const label = document.createElement('label');
        label.textContent = categories[key];

        item.appendChild(checkbox);
        item.appendChild(label);

        item.addEventListener('click', () => {
            const idx = selectedCategories.indexOf(key);
            if (idx === -1) {
                selectedCategories.push(key);
            } else {
                selectedCategories.splice(idx, 1);
            }
            localStorage.setItem('listeningCategories', JSON.stringify(selectedCategories));
            checkbox.classList.toggle('checked');
            updateStartButton();
            updateSelectAllText();
        });

        categoryList.appendChild(item);
    });
    updateSelectAllText();
}

function updateSelectAllText() {
    const allSelected = selectedCategories.length === Object.keys(categories).length;
    selectAllBtn.textContent = allSelected ? 'Deselect All' : 'Select All';
}

selectAllBtn.addEventListener('click', () => {
    const categoryKeys = Object.keys(categories);
    const allSelected = selectedCategories.length === categoryKeys.length;
    if (allSelected) {
        selectedCategories = [];
    } else {
        selectedCategories = [...categoryKeys];
    }
    localStorage.setItem('listeningCategories', JSON.stringify(selectedCategories));
    renderCategories();
    updateStartButton();
});

function updateStartButton() {
    startBtn.disabled = selectedCategories.length === 0;
}

startBtn.addEventListener('click', () => {
    if (selectedCategories.length === 0) return;
    const params = new URLSearchParams({
        categories: selectedCategories.join(',')
    });
    window.location.href = `listening.html?${params.toString()}`;
});

init();
```

**Step 3: Commit**

```bash
git add listening-setup.html listening-setup.js
git commit -m "feat: add listening setup page with category selection"
```

---

### Task 4: Create listening.html, listening.js, listening.css

**Files:**
- Create: `listening.html`
- Create: `listening.js`
- Create: `listening.css`

**Step 1: Create listening.css**

Based on `practice.css` but with audio-specific styles (play button, pulse animation):

```css
/* Listening Practice Styles */
/* Shared styles are in shared.css */

/* Session Stats — same as practice.css */
.session-stats {
    display: flex;
    justify-content: space-around;
    gap: 10px;
    margin-bottom: 20px;
    padding: 15px;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 15px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.stat-item { flex: 1; text-align: center; padding: 10px 5px; border-radius: 10px; transition: transform 0.2s ease; }
.stat-value { font-size: 2rem; font-weight: bold; line-height: 1; margin-bottom: 5px; }
.stat-label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.7; font-weight: 600; }
.stat-correct { background: rgba(39, 174, 96, 0.1); }
.stat-correct .stat-value { color: #27ae60; }
.stat-incorrect { background: rgba(231, 76, 60, 0.1); }
.stat-incorrect .stat-value { color: #e74c3c; }
.stat-accuracy { background: rgba(102, 126, 234, 0.1); }
.stat-accuracy .stat-value { color: #667eea; }

/* Card Container */
.card-container { width: 100%; perspective: 1000px; display: flex; flex-direction: column; }
.card { width: 100%; height: 400px; position: relative; transition: transform 0.3s ease; cursor: pointer; }
.card.swiping { transition: transform 0.1s ease; }
.card-inner { width: 100%; height: 100%; position: relative; transition: transform 0.6s; transform-style: preserve-3d; }
.card.flipped .card-inner { transform: rotateY(180deg); }

.card-front,
.card-back {
    width: 100%;
    height: 100%;
    position: absolute;
    backface-visibility: hidden;
    background: white;
    border-radius: 20px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 30px;
    overflow: hidden;
}

.card-back { transform: rotateY(180deg); }

/* Play Button */
.play-btn {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
    margin-bottom: 15px;
}

.play-btn:hover { transform: scale(1.05); box-shadow: 0 6px 25px rgba(102, 126, 234, 0.5); }
.play-btn:active { transform: scale(0.98); }
.play-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

.play-icon {
    font-size: 2.5rem;
    color: white;
    margin-left: 5px; /* optical center for play triangle */
}

.play-btn.speaking .play-icon { margin-left: 0; }

/* Pulse animation while speaking */
.play-btn.speaking {
    animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
    0%, 100% { box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4); }
    50% { box-shadow: 0 4px 30px rgba(102, 126, 234, 0.7); transform: scale(1.05); }
}

/* Category label on front */
.category-label {
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #888;
    font-weight: 600;
    margin-bottom: 20px;
}

/* Hint text below play button */
.play-hint {
    font-size: 0.95rem;
    color: #aaa;
    font-style: italic;
    transition: opacity 0.3s ease;
}

/* Card back content */
.french-text {
    font-size: 1.8rem;
    font-weight: bold;
    color: #667eea;
    text-align: center;
    margin-bottom: 15px;
    line-height: 1.3;
}

.divider {
    width: 60px;
    height: 2px;
    background: #eee;
    margin-bottom: 15px;
}

.english-text {
    font-size: 1.3rem;
    color: #666;
    text-align: center;
    line-height: 1.4;
    margin-bottom: 15px;
}

.swipe-instruction {
    display: flex;
    justify-content: space-between;
    width: 100%;
    font-size: 1.1rem;
    font-weight: 500;
    margin-top: auto;
}

.swipe-left { color: #e74c3c; }
.swipe-right { color: #27ae60; }

/* TTS warning */
.tts-warning {
    background: #fff3cd;
    color: #856404;
    padding: 15px 20px;
    border-radius: 12px;
    text-align: center;
    font-size: 0.9rem;
    line-height: 1.4;
}

/* Card swipe animations */
.card.swipe-right { animation: swipeRight 0.3s ease-out forwards; }
.card.swipe-left { animation: swipeLeft 0.3s ease-out forwards; }

@keyframes swipeRight { to { transform: translateX(150%) rotate(20deg); opacity: 0; } }
@keyframes swipeLeft { to { transform: translateX(-150%) rotate(-20deg); opacity: 0; } }

/* Responsive */
@media (max-width: 600px) {
    .card { height: 350px; }
    .card-front, .card-back { padding: 20px; }
    .play-btn { width: 80px; height: 80px; }
    .play-icon { font-size: 2rem; }
    .french-text { font-size: 1.5rem; }
    .english-text { font-size: 1.1rem; }
    .category-label { margin-bottom: 15px; }
    .session-stats { padding: 12px; gap: 8px; margin-bottom: 15px; }
    .stat-item { padding: 8px 3px; }
    .stat-value { font-size: 1.5rem; }
    .stat-label { font-size: 0.65rem; }
}
```

**Step 2: Create listening.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Practice French listening comprehension">
    <meta name="theme-color" content="#4a90e2">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <meta name="apple-mobile-web-app-title" content="French Verbs">
    <title>Listening Practice - French Verbs</title>
    <link rel="manifest" href="manifest.json">
    <link rel="icon" type="image/png" sizes="196x196" href="./icons/favicon-196.png">
    <link rel="apple-touch-icon" href="./icons/apple-icon-180.png">
    <link rel="stylesheet" href="shared.css">
    <link rel="stylesheet" href="listening.css">
</head>
<body>
    <div class="container">
        <header>
            <a href="listening-setup.html" class="home-btn">Back</a>
            <h1>Listening</h1>
            <div id="status" class="status"></div>
        </header>
        <main>
            <div id="loading" class="loading">
                <div class="spinner"></div>
                <p>Loading sentences...</p>
            </div>
            <div id="tts-warning" class="tts-warning hidden">
                No French voice available on this device. Please check your TTS settings.
            </div>
            <div id="card-container" class="card-container hidden">
                <div class="session-stats">
                    <div class="stat-item stat-incorrect">
                        <div class="stat-value" id="session-incorrect">0</div>
                        <div class="stat-label">Incorrect</div>
                    </div>
                    <div class="stat-item stat-accuracy">
                        <div class="stat-value" id="session-accuracy">&mdash;</div>
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
                            <div class="category-label" id="category-label"></div>
                            <button class="play-btn" id="play-btn">
                                <span class="play-icon" id="play-icon">&#9654;</span>
                            </button>
                            <div class="play-hint" id="play-hint">Tap to play</div>
                        </div>
                        <div class="card-back">
                            <div class="french-text" id="french-text"></div>
                            <div class="divider"></div>
                            <div class="english-text" id="english-text"></div>
                            <div class="swipe-instruction">
                                <span class="swipe-left">&lt; Wrong</span>
                                <span class="swipe-right">Right &gt;</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div id="error" class="error hidden"></div>
        </main>
        <footer>
            <div class="stats"><span id="card-count">0 sentences remaining</span></div>
            <button id="reset-btn" class="btn">Reset Progress</button>
        </footer>
    </div>
    <script src="shared.js"></script>
    <script src="listening.js"></script>
</body>
</html>
```

**Step 3: Create listening.js**

```javascript
// Listening Practice Mode

// URL Parameters
const urlParams = new URLSearchParams(window.location.search);
const selectedCategories = (urlParams.get('categories') || '').split(',').filter(Boolean);

// Constants
const MASTERY_THRESHOLD = 3;

// TTS State
let frenchVoice = null;
let isSpeaking = false;

// App State
let allSentences = [];
let availableSentences = [];
let currentSentence = null;
let isFlipped = false;
let touchStartX = 0;
let touchEndX = 0;
let hasPlayedOnce = false; // for hiding hint

// Session Stats
let sessionStats = { correct: 0, incorrect: 0, total: 0 };

// Category display names (loaded from sentences.json)
let categoryNames = {};

// DOM Elements
const elements = {
    loading: document.getElementById('loading'),
    ttsWarning: document.getElementById('tts-warning'),
    cardContainer: document.getElementById('card-container'),
    card: document.getElementById('card'),
    categoryLabel: document.getElementById('category-label'),
    playBtn: document.getElementById('play-btn'),
    playIcon: document.getElementById('play-icon'),
    playHint: document.getElementById('play-hint'),
    frenchText: document.getElementById('french-text'),
    englishText: document.getElementById('english-text'),
    error: document.getElementById('error'),
    status: document.getElementById('status'),
    cardCount: document.getElementById('card-count'),
    sessionCorrect: document.getElementById('session-correct'),
    sessionIncorrect: document.getElementById('session-incorrect'),
    sessionAccuracy: document.getElementById('session-accuracy'),
    resetBtn: document.getElementById('reset-btn')
};

// Initialize TTS voice
function initTTS() {
    return new Promise((resolve) => {
        function findFrenchVoice() {
            const voices = speechSynthesis.getVoices();
            // Prefer fr-FR, then any fr- variant; prefer localService (offline)
            let best = null;
            for (const voice of voices) {
                if (voice.lang.startsWith('fr')) {
                    if (!best) best = voice;
                    if (voice.lang === 'fr-FR' && (!best || best.lang !== 'fr-FR')) best = voice;
                    if (voice.lang === 'fr-FR' && voice.localService && (!best || !best.localService)) best = voice;
                }
            }
            return best;
        }

        frenchVoice = findFrenchVoice();
        if (frenchVoice) {
            resolve(true);
            return;
        }

        // Voices may load asynchronously
        speechSynthesis.addEventListener('voiceschanged', () => {
            frenchVoice = findFrenchVoice();
            resolve(!!frenchVoice);
        }, { once: true });

        // Timeout if voices never load
        setTimeout(() => {
            if (!frenchVoice) {
                frenchVoice = findFrenchVoice();
                resolve(!!frenchVoice);
            }
        }, 2000);
    });
}

// Speak a French sentence
function speak(text) {
    speechSynthesis.cancel(); // Stop any ongoing speech

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = frenchVoice;
    utterance.lang = 'fr-FR';
    utterance.rate = 0.9;

    elements.playBtn.classList.add('speaking');
    elements.playIcon.textContent = '\uD83D\uDD0A'; // speaker icon
    isSpeaking = true;

    utterance.onend = () => {
        elements.playBtn.classList.remove('speaking');
        elements.playIcon.innerHTML = '&#9654;'; // play icon
        isSpeaking = false;
    };

    utterance.onerror = () => {
        elements.playBtn.classList.remove('speaking');
        elements.playIcon.innerHTML = '&#9654;';
        isSpeaking = false;
    };

    speechSynthesis.speak(utterance);

    // Hide hint after first play
    if (!hasPlayedOnce) {
        hasPlayedOnce = true;
        elements.playHint.style.opacity = '0';
    }
}

// Stats key for a sentence
function sentenceKey(id) {
    return `listening_${id}`;
}

// Get stats for a sentence
function getSentenceStats(id) {
    return new Promise((resolve, reject) => {
        const key = sentenceKey(id);
        const transaction = db.transaction([STATS_STORE], 'readonly');
        const store = transaction.objectStore(STATS_STORE);
        const request = store.get(key);

        request.onsuccess = () => {
            resolve(request.result || {
                id: key,
                correct: 0,
                incorrect: 0,
                totalAttempts: 0,
                lastPracticed: null
            });
        };
        request.onerror = () => reject(request.error);
    });
}

// Get all stats
function getAllStats() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STATS_STORE], 'readonly');
        const store = transaction.objectStore(STATS_STORE);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
}

// Filter unmastered sentences
async function filterUnmasteredSentences() {
    const allStats = await getAllStats();
    const statsMap = new Map(allStats.map(s => [s.id, s]));

    availableSentences = allSentences.filter(sentence => {
        if (!selectedCategories.includes(sentence.category)) return false;
        const stats = statsMap.get(sentenceKey(sentence.id));
        return !stats || stats.correct < MASTERY_THRESHOLD;
    });

    updateCardCount();
}

// Update stats for a sentence
async function updateSentenceStats(id, isCorrect) {
    const stats = await getSentenceStats(id);

    stats.totalAttempts++;
    if (isCorrect) {
        stats.correct++;
    } else {
        stats.incorrect++;
        stats.correct = 0;
    }
    stats.lastPracticed = new Date().toISOString();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STATS_STORE], 'readwrite');
        const store = transaction.objectStore(STATS_STORE);
        const request = store.put(stats);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// Reset listening stats only
async function resetListeningStats() {
    if (!confirm('Reset all listening progress? This cannot be undone.')) return;

    const allStats = await getAllStats();
    const listeningStats = allStats.filter(s => s.id.startsWith('listening_'));

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STATS_STORE], 'readwrite');
        const store = transaction.objectStore(STATS_STORE);

        listeningStats.forEach(stat => store.delete(stat.id));

        transaction.oncomplete = async () => {
            sessionStats = { correct: 0, incorrect: 0, total: 0 };
            updateSessionStats();
            await filterUnmasteredSentences();
            elements.cardContainer.classList.remove('hidden');
            updateStatus('Progress reset');
            showNextCard();
            resolve();
        };
        transaction.onerror = () => reject(transaction.error);
    });
}

// Show next card
function showNextCard() {
    if (availableSentences.length === 0) return;

    // Reset state
    isFlipped = false;
    elements.card.classList.remove('flipped');
    speechSynthesis.cancel();
    elements.playBtn.classList.remove('speaking');
    elements.playIcon.innerHTML = '&#9654;';

    // Pick random sentence
    currentSentence = availableSentences[Math.floor(Math.random() * availableSentences.length)];

    // Set category label
    elements.categoryLabel.textContent = categoryNames[currentSentence.category] || currentSentence.category;

    // Set back content
    elements.frenchText.textContent = currentSentence.french;
    elements.englishText.textContent = currentSentence.english;

    // Reset hint visibility
    elements.playHint.style.opacity = hasPlayedOnce ? '0' : '1';
}

// Flip card
function flipCard() {
    isFlipped = !isFlipped;
    elements.card.classList.toggle('flipped');
    speechSynthesis.cancel();
}

// Handle swipe
async function handleSwipe(direction) {
    if (!isFlipped) return;

    const isCorrect = direction === 'right';

    sessionStats.total++;
    if (isCorrect) { sessionStats.correct++; } else { sessionStats.incorrect++; }
    updateSessionStats();

    try {
        await updateSentenceStats(currentSentence.id, isCorrect);
        await filterUnmasteredSentences();
    } catch (error) {
        console.error('Failed to update stats:', error);
    }

    elements.card.classList.add(`swipe-${direction}`);

    setTimeout(() => {
        elements.card.classList.remove(`swipe-${direction}`);
        if (availableSentences.length === 0) {
            updateStatus('All sentences mastered! Reset to practice again.');
            elements.cardContainer.classList.add('hidden');
        } else {
            showNextCard();
        }
    }, 300);
}

// Setup event listeners
function setupEventListeners() {
    // Play button (stop propagation so it doesn't flip the card)
    elements.playBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!frenchVoice || !currentSentence) return;
        speak(currentSentence.french);
    });

    // Reset
    elements.resetBtn.addEventListener('click', async () => {
        try { await resetListeningStats(); } catch (e) { console.error(e); }
    });

    // Click card to flip (only when not flipped, and not clicking play button)
    elements.card.addEventListener('click', () => {
        if (!isFlipped) flipCard();
    });

    // Touch swipe
    elements.card.addEventListener('touchstart', (e) => {
        if (!isFlipped) return;
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    elements.card.addEventListener('touchend', (e) => {
        if (!isFlipped) return;
        touchEndX = e.changedTouches[0].screenX;
        const diff = touchEndX - touchStartX;
        if (Math.abs(diff) > 50) handleSwipe(diff > 0 ? 'right' : 'left');
    }, { passive: true });

    // Mouse swipe (desktop)
    let mouseStartX = 0;
    let isDragging = false;

    elements.card.addEventListener('mousedown', (e) => {
        if (!isFlipped) return;
        isDragging = true;
        mouseStartX = e.clientX;
        elements.card.classList.add('swiping');
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging || !isFlipped) return;
        const diff = e.clientX - mouseStartX;
        elements.card.style.transform = `translateX(${diff}px) rotate(${diff / 20}deg)`;
    });

    document.addEventListener('mouseup', (e) => {
        if (!isDragging || !isFlipped) return;
        isDragging = false;
        elements.card.classList.remove('swiping');
        elements.card.style.transform = '';
        const diff = e.clientX - mouseStartX;
        if (Math.abs(diff) > 100) handleSwipe(diff > 0 ? 'right' : 'left');
    });

    // Keyboard
    document.addEventListener('keydown', (e) => {
        if (e.key === ' ' && !isFlipped) {
            e.preventDefault();
            if (frenchVoice && currentSentence) speak(currentSentence.french);
        } else if (e.key === 'Enter' && !isFlipped) {
            e.preventDefault();
            flipCard();
        } else if (e.key === 'ArrowLeft' && isFlipped) {
            handleSwipe('left');
        } else if (e.key === 'ArrowRight' && isFlipped) {
            handleSwipe('right');
        }
    });
}

// UI helpers
function updateStatus(msg) { elements.status.textContent = msg; }

function updateCardCount() {
    const total = allSentences.filter(s => selectedCategories.includes(s.category)).length;
    elements.cardCount.textContent = `${availableSentences.length}/${total} sentences remaining`;
}

function updateSessionStats() {
    elements.sessionCorrect.textContent = sessionStats.correct;
    elements.sessionIncorrect.textContent = sessionStats.incorrect;
    elements.sessionAccuracy.textContent = sessionStats.total > 0
        ? `${Math.round((sessionStats.correct / sessionStats.total) * 100)}%`
        : '\u2014';
}

function hideLoading() {
    elements.loading.classList.add('hidden');
    elements.cardContainer.classList.remove('hidden');
}

function showError(msg) {
    elements.loading.classList.add('hidden');
    elements.error.textContent = msg;
    elements.error.classList.remove('hidden');
}

// Init
async function init() {
    const loadingTimeout = setTimeout(() => {
        if (elements.loading && !elements.loading.classList.contains('hidden')) {
            elements.loading.innerHTML += '<p style="margin-top:20px;font-size:0.9rem;">Taking too long? <a href="settings.html" style="color:white;text-decoration:underline;">Clear Cache</a></p>';
        }
    }, 5000);

    try {
        updateStatus('Initializing...');
        await initDB();

        // Load sentences and category names in parallel with TTS init
        const [sentences, hasVoice] = await Promise.all([
            loadSentences(updateStatus),
            initTTS()
        ]);

        allSentences = sentences;

        // Load category names
        try {
            const resp = await fetch('./sentences.json', { cache: 'no-cache' });
            if (resp.ok) {
                const data = await resp.json();
                categoryNames = data.categories || {};
            }
        } catch (e) { /* offline, use raw keys */ }

        if (!hasVoice) {
            elements.ttsWarning.classList.remove('hidden');
        }

        await filterUnmasteredSentences();

        if (availableSentences.length === 0) {
            updateStatus('All sentences mastered! Reset to practice again.');
        }

        setupEventListeners();
        showNextCard();
        hideLoading();
    } catch (error) {
        showError('Failed to initialize: ' + error.message);
    } finally {
        clearTimeout(loadingTimeout);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
```

**Step 4: Commit**

```bash
git add listening.html listening.js listening.css
git commit -m "feat: add listening practice page with TTS flashcards"
```

---

### Task 5: Update index.html — add Listening Practice card

**Files:**
- Modify: `index.html`

**Step 1: Add the listening mode card**

In `index.html`, replace the `<!-- Future modes will be added here -->` comment with:

```html
                <a href="listening-setup.html" class="mode-card">
                    <div class="mode-icon">🎧</div>
                    <div class="mode-title">Listening Practice</div>
                    <div class="mode-description">
                        Listen to French sentences and test your comprehension
                    </div>
                </a>
```

**Step 2: Commit**

```bash
git add index.html
git commit -m "feat: add listening practice card to home screen"
```

---

### Task 6: Update sw.js, version.json, shared.js versions, and CLAUDE.md

**Files:**
- Modify: `sw.js` — add new files to `urlsToCache`, bump `CACHE_NAME`
- Modify: `shared.js` — bump `APP_VERSION`
- Modify: `version.json` — match `APP_VERSION`
- Modify: `CLAUDE.md` — update file structure

**Step 1: Update sw.js**

Add to `urlsToCache` array (after `settings.css`):

```javascript
'./listening-setup.html',
'./listening.html',
'./listening-setup.js',
'./listening.js',
'./listening.css',
'./sentences.json',
```

Bump `CACHE_NAME` to `'french-conjugation-v41'`.

**Step 2: Update shared.js**

Change `APP_VERSION` to `'2.2.0'`.

**Step 3: Update version.json**

```json
{
  "version": "2.2.0"
}
```

**Step 4: Update CLAUDE.md**

Add the new files to the file structure section. Update the current cache version reference.

**Step 5: Commit**

```bash
git add sw.js shared.js version.json CLAUDE.md
git commit -m "feat: register listening files in SW cache, bump to v2.2.0"
```

---

### Task 7: Verify everything works

**Step 1: Start preview server and test**

1. Load home screen — verify two mode cards (Verb Practice + Listening Practice)
2. Click Listening Practice → setup page with 6 categories
3. Select a category, click Start Practice
4. Card front: play button + category label. Click play → hear French sentence
5. Click card to flip → see French text + English translation
6. Swipe right → next card, stats update
7. Settings page → verify app version shows 2.2.0

**Step 2: Push**

```bash
git push origin main
```
