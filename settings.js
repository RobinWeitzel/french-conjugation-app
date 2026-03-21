// Settings page functionality

// DOM Elements
const checkUpdateBtn = document.getElementById('check-update-btn');
const updateStatus = document.getElementById('update-status');
const clearCacheBtn = document.getElementById('clear-cache-btn');
const cacheStatus = document.getElementById('cache-status');
const appVersionEl = document.getElementById('app-version');
const verbsCount = document.getElementById('verbs-count');
const dataVersion = document.getElementById('data-version');
const cacheVersion = document.getElementById('cache-version');
const downloadAudioBtn = document.getElementById('download-audio-btn');
const audioStatusEl = document.getElementById('audio-status');
const progressContainer = document.getElementById('progress-container');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const downloadStatus = document.getElementById('download-status');

// Initialize the settings page
async function init() {
    // Display app version immediately (before any async operations)
    if (appVersionEl) {
        appVersionEl.textContent = typeof APP_VERSION !== 'undefined' ? APP_VERSION : 'Unknown';
    }

    // Set up event listeners (before async to ensure buttons work even if DB hangs)
    clearCacheBtn.addEventListener('click', handleClearCache);
    checkUpdateBtn.addEventListener('click', handleCheckUpdate);
    downloadAudioBtn.addEventListener('click', handleDownloadAudio);

    // Load and display current stats
    await loadStats();
    await checkAudioStatus();
}

// Load and display current stats
async function loadStats() {
    try {
        await initDB();

        const verbs = await getVerbsFromDB();
        verbsCount.textContent = verbs.length;

        const version = await getStoredVersion();
        dataVersion.textContent = version || 'Unknown';

        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            cacheVersion.textContent = 'Active';
        } else {
            cacheVersion.textContent = 'Not installed';
        }
    } catch (error) {
        console.error('[Settings] Error loading stats:', error);
        verbsCount.textContent = 'Error';
        dataVersion.textContent = 'Error';
        cacheVersion.textContent = 'Error';
    }
}

// Handle check for updates button
async function handleCheckUpdate() {
    checkUpdateBtn.disabled = true;
    showUpdateStatus('Checking for updates...', 'info');

    const newVersion = await checkForUpdate();

    if (newVersion) {
        showUpdateStatus(`Update available: v${newVersion} (you have v${APP_VERSION})`, 'info');
        // Replace button with update action
        checkUpdateBtn.querySelector('.btn-text').textContent = 'Update Now';
        checkUpdateBtn.querySelector('.btn-icon').textContent = '⬆️';
        checkUpdateBtn.disabled = false;
        checkUpdateBtn.removeEventListener('click', handleCheckUpdate);
        checkUpdateBtn.addEventListener('click', () => {
            checkUpdateBtn.disabled = true;
            showUpdateStatus('Updating...', 'info');
            applyUpdate();
        });
    } else {
        showUpdateStatus(`You're up to date (v${APP_VERSION})`, 'success');
        checkUpdateBtn.disabled = false;
    }
}

// Handle clear cache button click
async function handleClearCache() {
    if (!confirm('This will clear all cached data and reload the app. Continue?')) {
        return;
    }

    clearCacheBtn.disabled = true;
    showCacheStatus('Clearing cache...', 'info');

    try {
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(n => caches.delete(n)));
        }

        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            await Promise.all(registrations.map(r => r.unregister()));
        }

        if (db) { db.close(); }
        await new Promise((resolve) => {
            const req = indexedDB.deleteDatabase('FrenchConjugationDB');
            req.onsuccess = () => resolve();
            req.onerror = () => resolve();
            req.onblocked = () => resolve();
        });

        localStorage.clear();

        showCacheStatus('Cache cleared! Reloading...', 'success');
        setTimeout(() => { window.location.href = 'index.html'; }, 1500);
    } catch (error) {
        showCacheStatus('Error clearing cache. Try refreshing manually.', 'error');
        clearCacheBtn.disabled = false;
    }
}

function showUpdateStatus(message, type) {
    updateStatus.textContent = message;
    updateStatus.className = `status-message ${type}`;
}

function showCacheStatus(message, type) {
    cacheStatus.textContent = message;
    cacheStatus.className = `status-message ${type}`;
}

// Check how many audio files are cached
async function checkAudioStatus() {
    try {
        const response = await fetch('./sentences.json', { cache: 'no-cache' });
        const data = await response.json();
        const audioCategories = data.audioCategories || [];
        const audioSentences = data.sentences.filter(s => audioCategories.includes(s.category));

        if (audioSentences.length === 0) {
            audioStatusEl.textContent = 'No audio files available yet';
            return;
        }

        let cached = 0;
        const cacheName = (await caches.keys()).find(k => k.startsWith('french-conjugation'));
        if (cacheName) {
            const cache = await caches.open(cacheName);
            for (const s of audioSentences) {
                const match = await cache.match(`./audio/${s.id}.mp3`);
                if (match) cached++;
            }
        }

        audioStatusEl.textContent = `${cached} of ${audioSentences.length} audio files cached`;
        downloadAudioBtn.disabled = false;

        if (cached === audioSentences.length) {
            downloadAudioBtn.querySelector('.btn-text').textContent = 'All Audio Downloaded';
            downloadAudioBtn.disabled = true;
        }
    } catch (e) {
        audioStatusEl.textContent = 'Could not check audio status';
        downloadAudioBtn.disabled = false;
    }
}

// Download all missing audio files
async function handleDownloadAudio() {
    downloadAudioBtn.disabled = true;
    progressContainer.classList.remove('hidden');

    try {
        const response = await fetch('./sentences.json', { cache: 'no-cache' });
        const data = await response.json();
        const audioCategories = data.audioCategories || [];
        const audioSentences = data.sentences.filter(s => audioCategories.includes(s.category));

        const cacheName = (await caches.keys()).find(k => k.startsWith('french-conjugation'));
        const cache = await caches.open(cacheName || 'french-conjugation-audio');

        let downloaded = 0;
        let skipped = 0;
        const total = audioSentences.length;

        for (const s of audioSentences) {
            const url = `./audio/${s.id}.mp3`;
            const existing = await cache.match(url);
            if (existing) {
                skipped++;
            } else {
                try {
                    const audioResponse = await fetch(url);
                    if (audioResponse.ok) {
                        await cache.put(url, audioResponse);
                        downloaded++;
                    }
                } catch (e) {
                    // Skip failed downloads
                }
            }

            const progress = Math.round(((downloaded + skipped) / total) * 100);
            progressBar.style.width = `${progress}%`;
            progressText.textContent = `${downloaded + skipped}/${total}`;
        }

        progressContainer.classList.add('hidden');
        showDownloadStatus(`Downloaded ${downloaded} new files (${skipped} already cached)`, 'success');
        audioStatusEl.textContent = `${downloaded + skipped} of ${total} audio files cached`;

        if (downloaded + skipped === total) {
            downloadAudioBtn.querySelector('.btn-text').textContent = 'All Audio Downloaded';
        } else {
            downloadAudioBtn.disabled = false;
        }
    } catch (e) {
        progressContainer.classList.add('hidden');
        showDownloadStatus('Download failed. Check your internet connection.', 'error');
        downloadAudioBtn.disabled = false;
    }
}

function showDownloadStatus(message, type) {
    downloadStatus.textContent = message;
    downloadStatus.className = `status-message ${type}`;
}

init();
