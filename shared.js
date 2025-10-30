// Shared functionality across all modes

// IndexedDB Configuration
const DB_NAME = 'FrenchConjugationDB';
const DB_VERSION = 2;
const VERBS_STORE = 'verbs';
const METADATA_STORE = 'metadata';
const STATS_STORE = 'stats';
const WORDS_URL = './words.json';

// Global database reference
let db = null;

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

            // Create stats store
            if (!db.objectStoreNames.contains(STATS_STORE)) {
                db.createObjectStore(STATS_STORE, { keyPath: 'infinitive' });
            }
        };
    });
}

// Fetch words from server
async function fetchWordsFromServer() {
    try {
        const response = await fetch(WORDS_URL, { cache: 'no-cache' });
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

// Load verbs from IndexedDB or fetch from server
async function loadVerbs(updateStatusCallback) {
    try {
        console.log('[App] Attempting to fetch words.json from server...');
        const onlineData = await fetchWordsFromServer();

        if (onlineData) {
            console.log('[App] Successfully fetched from server. Version:', onlineData.version);
            const currentVersion = await getStoredVersion();
            console.log('[App] Current cached version:', currentVersion || 'none');

            if (!currentVersion || onlineData.version !== currentVersion) {
                console.log('[App] New version detected, updating IndexedDB...');
                if (updateStatusCallback) updateStatusCallback('Updating verbs...');
                await saveVerbsToDB(onlineData.verbs, onlineData.version);
                if (updateStatusCallback) updateStatusCallback('✓ Verbs updated');
                console.log('[App] Data loaded from SERVER and cached');
            } else {
                console.log('[App] Version unchanged, using existing data');
                if (updateStatusCallback) updateStatusCallback('✓ Verbs up to date');
                console.log('[App] Data loaded from INDEXEDDB (server confirmed up-to-date)');
            }
        }
    } catch (error) {
        console.warn('[App] Could not fetch from server, using cached data:', error);
        if (updateStatusCallback) updateStatusCallback('Offline mode');
    }

    // Load from IndexedDB
    const verbs = await getVerbsFromDB();
    console.log('[App] Loaded', verbs.length, 'verbs from IndexedDB');

    if (verbs.length === 0) {
        throw new Error('No verbs available. Please check your internet connection.');
    }

    return verbs;
}

// Register Service Worker for offline support
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then((registration) => {
                console.log('Service Worker registered:', registration.scope);
            })
            .catch((error) => {
                console.log('Service Worker registration failed:', error);
            });
    });
}
