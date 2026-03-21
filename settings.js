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

// Initialize the settings page
async function init() {
    // Display app version immediately (before any async operations)
    if (appVersionEl) {
        appVersionEl.textContent = typeof APP_VERSION !== 'undefined' ? APP_VERSION : 'Unknown';
    }

    // Set up event listeners (before async to ensure buttons work even if DB hangs)
    clearCacheBtn.addEventListener('click', handleClearCache);
    checkUpdateBtn.addEventListener('click', handleCheckUpdate);

    // Load and display current stats
    await loadStats();
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

init();
