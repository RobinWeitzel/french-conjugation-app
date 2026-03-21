// Shared functionality across all modes

// App Version - increment with every deployment (must match version.json)
const APP_VERSION = '2.4.2';

// IndexedDB Configuration
const DB_NAME = 'FrenchConjugationDB';
const DB_VERSION = 4;
const VERBS_STORE = 'verbs';
const METADATA_STORE = 'metadata';
const STATS_STORE = 'stats';
const WORDS_URL = './words.json';
const SENTENCES_STORE = 'sentences';
const SENTENCES_URL = './sentences.json';

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

        request.onblocked = () => {
            console.warn('[DB] Upgrade blocked — close other tabs and reload');
            // Force close and retry by deleting the DB
            indexedDB.deleteDatabase(DB_NAME);
            window.location.reload();
        };

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

            if (!db.objectStoreNames.contains(SENTENCES_STORE)) {
                db.createObjectStore(SENTENCES_STORE, { keyPath: 'id' });
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

// Fetch sentences from server
async function fetchSentencesFromServer() {
    try {
        const response = await fetch(SENTENCES_URL, { cache: 'no-cache' });
        if (!response.ok) throw new Error('Failed to fetch');
        return await response.json();
    } catch (error) {
        return null;
    }
}

// Get stored sentences version from IndexedDB
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

        // Clear existing sentences
        const sentencesStore = transaction.objectStore(SENTENCES_STORE);
        sentencesStore.clear();

        // Add new sentences
        sentencesData.forEach(sentence => {
            sentencesStore.add(sentence);
        });

        // Update version
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
        console.log('[App] Attempting to fetch sentences.json from server...');
        const onlineData = await fetchSentencesFromServer();

        if (onlineData) {
            console.log('[App] Successfully fetched sentences from server. Version:', onlineData.version);
            const currentVersion = await getStoredSentencesVersion();
            console.log('[App] Current cached sentences version:', currentVersion || 'none');

            if (!currentVersion || onlineData.version !== currentVersion) {
                console.log('[App] New sentences version detected, updating IndexedDB...');
                if (updateStatusCallback) updateStatusCallback('Updating sentences...');
                await saveSentencesToDB(onlineData.sentences, onlineData.version);
                if (updateStatusCallback) updateStatusCallback('✓ Sentences updated');
                console.log('[App] Sentences loaded from SERVER and cached');
            } else {
                console.log('[App] Sentences version unchanged, using existing data');
                if (updateStatusCallback) updateStatusCallback('✓ Sentences up to date');
                console.log('[App] Sentences loaded from INDEXEDDB (server confirmed up-to-date)');
            }
        }
    } catch (error) {
        console.warn('[App] Could not fetch sentences from server, using cached data:', error);
        if (updateStatusCallback) updateStatusCallback('Offline mode');
    }

    // Load from IndexedDB
    const sentences = await getSentencesFromDB();
    console.log('[App] Loaded', sentences.length, 'sentences from IndexedDB');

    if (sentences.length === 0) {
        throw new Error('No sentences available. Please check your internet connection.');
    }

    return sentences;
}

// Check for app updates by fetching version.json (never cached)
async function checkForUpdate() {
    try {
        const response = await fetch(`./version.json?t=${Date.now()}`, { cache: 'no-store' });
        if (!response.ok) return null;
        const data = await response.json();
        const serverVersion = data.version;
        if (serverVersion && serverVersion !== APP_VERSION) {
            return serverVersion;
        }
        return null;
    } catch (e) {
        // Offline or fetch failed — silently ignore
        return null;
    }
}

// Apply the update: unregister SW, clear caches, reload
async function applyUpdate() {
    try {
        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            await Promise.all(registrations.map(r => r.unregister()));
        }
        if ('caches' in window) {
            const names = await caches.keys();
            await Promise.all(names.map(n => caches.delete(n)));
        }
        // Navigate with cache-bust param to bypass browser HTTP cache
        const url = new URL(window.location.href);
        url.searchParams.set('_cb', Date.now());
        window.location.replace(url.toString());
    } catch (e) {
        window.location.replace(window.location.pathname + '?_cb=' + Date.now());
    }
}

// Show update banner if a new version is available
function showUpdateBanner(newVersion) {
    if (document.getElementById('update-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'update-banner';
    banner.className = 'update-banner';
    banner.innerHTML = `
        <span>Update available (v${newVersion})</span>
        <button onclick="applyUpdate()" class="update-btn">Update</button>
        <button onclick="this.parentElement.remove()" class="update-dismiss">&times;</button>
    `;
    document.body.prepend(banner);
}

// Register Service Worker for offline support
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' })
            .then((registration) => {
                console.log('Service Worker registered:', registration.scope);
                registration.update();
            })
            .catch((error) => {
                console.log('Service Worker registration failed:', error);
            });
    });
}

// Check for updates on every page load
window.addEventListener('load', async () => {
    const newVersion = await checkForUpdate();
    if (newVersion) {
        showUpdateBanner(newVersion);
    }
});
