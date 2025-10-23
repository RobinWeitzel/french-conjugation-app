// IndexedDB Configuration
const DB_NAME = 'FrenchConjugationDB';
const DB_VERSION = 1;
const VERBS_STORE = 'verbs';
const METADATA_STORE = 'metadata';
const WORDS_URL = './words.json';

// Pronouns for conjugation practice
const PRONOUNS = ['je', 'tu', 'il', 'nous', 'vous', 'ils'];

// App State
let db = null;
let verbs = [];
let currentVerb = null;
let currentPronoun = null;
let isFlipped = false;
let touchStartX = 0;
let touchEndX = 0;

// DOM Elements
const elements = {
    loading: document.getElementById('loading'),
    cardContainer: document.getElementById('card-container'),
    card: document.getElementById('card'),
    infinitive: document.getElementById('infinitive'),
    infinitiveBack: document.getElementById('infinitive-back'),
    pronoun: document.getElementById('pronoun'),
    pronounBack: document.getElementById('pronoun-back'),
    conjugation: document.getElementById('conjugation'),
    error: document.getElementById('error'),
    status: document.getElementById('status'),
    cardCount: document.getElementById('card-count')
};

// Initialize the app
async function init() {
    try {
        updateStatus('Initializing...');
        await initDB();
        await loadVerbs();
        setupEventListeners();
        showNextCard();
        hideLoading();
    } catch (error) {
        showError('Failed to initialize app: ' + error.message);
    }
}

// Initialize IndexedDB
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve();
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            // Create verbs store
            if (!db.objectStoreNames.contains(VERBS_STORE)) {
                db.createObjectStore(VERBS_STORE, { keyPath: 'infinitive' });
            }

            // Create metadata store
            if (!db.objectStoreNames.contains(METADATA_STORE)) {
                db.createObjectStore(METADATA_STORE, { keyPath: 'key' });
            }
        };
    });
}

// Load verbs from IndexedDB or fetch from server
async function loadVerbs() {
    try {
        // Try to fetch new version from server
        const onlineData = await fetchWordsFromServer();

        if (onlineData) {
            const currentVersion = await getStoredVersion();

            if (!currentVersion || onlineData.version !== currentVersion) {
                updateStatus('Updating verbs...');
                await saveVerbsToDB(onlineData.verbs, onlineData.version);
                updateStatus('✓ Verbs updated');
            } else {
                updateStatus('✓ Verbs up to date');
            }
        }
    } catch (error) {
        console.log('Could not fetch from server, using cached data:', error);
        updateStatus('Offline mode');
    }

    // Load from IndexedDB
    verbs = await getVerbsFromDB();

    if (verbs.length === 0) {
        throw new Error('No verbs available. Please check your internet connection.');
    }

    updateCardCount();
}

// Fetch words from server
async function fetchWordsFromServer() {
    try {
        const response = await fetch(WORDS_URL);
        if (!response.ok) throw new Error('Failed to fetch');
        return await response.json();
    } catch (error) {
        return null;
    }
}

// Get stored version from IndexedDB
function getStoredVersion() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([METADATA_STORE], 'readonly');
        const store = transaction.objectStore(METADATA_STORE);
        const request = store.get('version');

        request.onsuccess = () => {
            resolve(request.result ? request.result.value : null);
        };
        request.onerror = () => reject(request.error);
    });
}

// Save verbs to IndexedDB
async function saveVerbsToDB(verbsData, version) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([VERBS_STORE, METADATA_STORE], 'readwrite');

        // Clear existing verbs
        const verbsStore = transaction.objectStore(VERBS_STORE);
        verbsStore.clear();

        // Add new verbs
        verbsData.forEach(verb => {
            verbsStore.add(verb);
        });

        // Update version
        const metadataStore = transaction.objectStore(METADATA_STORE);
        metadataStore.put({ key: 'version', value: version });

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
}

// Get verbs from IndexedDB
function getVerbsFromDB() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([VERBS_STORE], 'readonly');
        const store = transaction.objectStore(VERBS_STORE);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
}

// Show next card
function showNextCard() {
    if (verbs.length === 0) return;

    // Reset flip state
    isFlipped = false;
    elements.card.classList.remove('flipped');

    // Select random verb and pronoun
    currentVerb = verbs[Math.floor(Math.random() * verbs.length)];
    currentPronoun = PRONOUNS[Math.floor(Math.random() * PRONOUNS.length)];

    // Update card content
    elements.infinitive.textContent = currentVerb.infinitive;
    elements.infinitiveBack.textContent = currentVerb.infinitive;
    elements.pronoun.textContent = currentPronoun;
    elements.pronounBack.textContent = currentPronoun;
    elements.conjugation.textContent = currentVerb.conjugations[currentPronoun] || '—';
}

// Flip card
function flipCard() {
    isFlipped = !isFlipped;
    elements.card.classList.toggle('flipped');
}

// Handle swipe
function handleSwipe(direction) {
    if (!isFlipped) return; // Only allow swipe when card is flipped

    elements.card.classList.add(`swipe-${direction}`);

    setTimeout(() => {
        elements.card.classList.remove(`swipe-${direction}`);
        showNextCard();
    }, 300);
}

// Setup event listeners
function setupEventListeners() {
    // Click to flip (only when not flipped)
    elements.card.addEventListener('click', (e) => {
        if (!isFlipped) {
            flipCard();
        }
    });

    // Touch events for swipe
    elements.card.addEventListener('touchstart', (e) => {
        if (!isFlipped) return;
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    elements.card.addEventListener('touchend', (e) => {
        if (!isFlipped) return;
        touchEndX = e.changedTouches[0].screenX;
        handleSwipeGesture();
    }, { passive: true });

    // Mouse events for swipe (desktop)
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
        if (Math.abs(diff) > 100) {
            handleSwipe(diff > 0 ? 'right' : 'left');
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === ' ' && !isFlipped) {
            e.preventDefault();
            flipCard();
        } else if (e.key === 'ArrowLeft' && isFlipped) {
            handleSwipe('left');
        } else if (e.key === 'ArrowRight' && isFlipped) {
            handleSwipe('right');
        }
    });
}

// Handle swipe gesture
function handleSwipeGesture() {
    const swipeThreshold = 50;
    const diff = touchEndX - touchStartX;

    if (Math.abs(diff) > swipeThreshold) {
        handleSwipe(diff > 0 ? 'right' : 'left');
    }
}

// UI Helper functions
function updateStatus(message) {
    elements.status.textContent = message;
}

function updateCardCount() {
    elements.cardCount.textContent = `${verbs.length} verb${verbs.length !== 1 ? 's' : ''} loaded`;
}

function hideLoading() {
    elements.loading.classList.add('hidden');
    elements.cardContainer.classList.remove('hidden');
}

function showError(message) {
    elements.loading.classList.add('hidden');
    elements.error.textContent = message;
    elements.error.classList.remove('hidden');
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
