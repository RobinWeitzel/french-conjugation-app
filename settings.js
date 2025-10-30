// Settings page functionality

// DOM Elements
const clearCacheBtn = document.getElementById('clear-cache-btn');
const cacheStatus = document.getElementById('cache-status');
const verbsCount = document.getElementById('verbs-count');
const dataVersion = document.getElementById('data-version');
const cacheVersion = document.getElementById('cache-version');

// Initialize the settings page
async function init() {
    console.log('[Settings] Initializing...');

    // Load and display current stats
    await loadStats();

    // Set up event listeners
    clearCacheBtn.addEventListener('click', handleClearCache);
}

// Load and display current stats
async function loadStats() {
    try {
        // Initialize DB to get data
        await initDB();

        // Get verbs count
        const verbs = await getVerbsFromDB();
        verbsCount.textContent = verbs.length;

        // Get data version from metadata
        const version = await getStoredVersion();
        dataVersion.textContent = version || 'Unknown';

        // Get cache version from service worker
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            // We can't directly access the cache name from here, but we can check if SW is active
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

// Handle clear cache button click
async function handleClearCache() {
    if (!confirm('This will clear all cached data and reload the app. Continue?')) {
        return;
    }

    clearCacheBtn.disabled = true;
    showStatus('Clearing cache...', 'info');

    try {
        // 1. Clear all caches
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(
                cacheNames.map(cacheName => {
                    console.log('[Settings] Deleting cache:', cacheName);
                    return caches.delete(cacheName);
                })
            );
        }

        // 2. Unregister service worker
        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            await Promise.all(
                registrations.map(registration => {
                    console.log('[Settings] Unregistering service worker');
                    return registration.unregister();
                })
            );
        }

        // 3. Clear IndexedDB
        if (db) {
            db.close();
        }
        await new Promise((resolve, reject) => {
            const deleteRequest = indexedDB.deleteDatabase('FrenchConjugationDB');
            deleteRequest.onsuccess = () => {
                console.log('[Settings] IndexedDB deleted');
                resolve();
            };
            deleteRequest.onerror = () => reject(deleteRequest.error);
            deleteRequest.onblocked = () => {
                console.warn('[Settings] IndexedDB deletion blocked');
                resolve(); // Continue anyway
            };
        });

        // 4. Clear localStorage (if used)
        localStorage.clear();

        // 5. Show success message
        showStatus('Cache cleared successfully! Reloading...', 'success');

        // 6. Reload the page after a brief delay
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);

    } catch (error) {
        console.error('[Settings] Error clearing cache:', error);
        showStatus('Error clearing cache. Please try refreshing the page manually.', 'error');
        clearCacheBtn.disabled = false;
    }
}

// Show status message
function showStatus(message, type) {
    cacheStatus.textContent = message;
    cacheStatus.className = `status-message ${type}`;
}

// Start the app
init();
