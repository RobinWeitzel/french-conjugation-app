// Conjugation Practice Mode
// Shared DB configuration is in shared.js

// Pronouns for conjugation practice
const PRONOUNS = ['je', 'tu', 'il', 'nous', 'vous', 'ils'];

// App State
let allVerbs = [];
let availableCombinations = []; // Array of {verb, pronoun} objects
let currentVerb = null;
let currentPronoun = null;
let isFlipped = false;
let touchStartX = 0;
let touchEndX = 0;

// Session Stats
let sessionStats = {
    correct: 0,
    incorrect: 0,
    total: 0
};

// Mastery threshold
const MASTERY_THRESHOLD = 3;

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
    englishTranslation: document.getElementById('english-translation'),
    error: document.getElementById('error'),
    status: document.getElementById('status'),
    cardCount: document.getElementById('card-count'),
    sessionCorrect: document.getElementById('session-correct'),
    sessionIncorrect: document.getElementById('session-incorrect'),
    sessionAccuracy: document.getElementById('session-accuracy'),
    resetBtn: document.getElementById('reset-btn')
};

// Initialize the app
async function init() {
    console.log('[App] Conjugation Practice Mode');
    try {
        updateStatus('Initializing...');
        await initDB();
        allVerbs = await loadVerbs(updateStatus);
        await filterUnmasteredCombinations();

        if (availableCombinations.length === 0) {
            updateStatus('All combinations mastered! Click reset to practice again.');
        }

        setupEventListeners();
        showNextCard();
        hideLoading();
    } catch (error) {
        showError('Failed to initialize app: ' + error.message);
    }
}

// Get stats for a specific verb+pronoun combination
function getCombinationStats(infinitive, pronoun) {
    return new Promise((resolve, reject) => {
        const key = `${infinitive}_${pronoun}`;
        const transaction = db.transaction([STATS_STORE], 'readonly');
        const store = transaction.objectStore(STATS_STORE);
        const request = store.get(key);

        request.onsuccess = () => {
            const stats = request.result || {
                infinitive: key,
                verb: infinitive,
                pronoun: pronoun,
                correct: 0,
                incorrect: 0,
                lastPracticed: null,
                totalAttempts: 0
            };
            resolve(stats);
        };
        request.onerror = () => reject(request.error);
    });
}

// Get all stats from the database
function getAllStats() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STATS_STORE], 'readonly');
        const store = transaction.objectStore(STATS_STORE);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
}

// Filter verb+pronoun combinations based on mastery
async function filterUnmasteredCombinations() {
    const allStats = await getAllStats();
    const statsMap = new Map(allStats.map(stat => [stat.infinitive, stat]));

    // Create all possible verb+pronoun combinations
    availableCombinations = [];
    for (const verb of allVerbs) {
        for (const pronoun of PRONOUNS) {
            const key = `${verb.infinitive}_${pronoun}`;
            const stats = statsMap.get(key);

            // Only include if not mastered (or no stats yet)
            if (!stats || stats.correct < MASTERY_THRESHOLD) {
                availableCombinations.push({ verb, pronoun });
            }
        }
    }

    updateCardCount();
}

// Update stats for a verb+pronoun combination
async function updateCombinationStats(infinitive, pronoun, isCorrect) {
    const stats = await getCombinationStats(infinitive, pronoun);

    stats.totalAttempts++;
    if (isCorrect) {
        stats.correct++;
    } else {
        stats.incorrect++;
        // Reset correct count on incorrect answer
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

// Reset all stats
async function resetAllStats() {
    if (!confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
        return;
    }

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STATS_STORE], 'readwrite');
        const store = transaction.objectStore(STATS_STORE);
        const request = store.clear();

        request.onsuccess = async () => {
            // Reset session stats
            sessionStats.correct = 0;
            sessionStats.incorrect = 0;
            sessionStats.total = 0;
            updateSessionStats();

            // Refilter combinations (all should be available now)
            await filterUnmasteredCombinations();

            // Show cards again if they were hidden
            elements.cardContainer.classList.remove('hidden');
            updateStatus('Progress reset - all combinations available');

            // Show a new card
            showNextCard();

            resolve();
        };
        request.onerror = () => reject(request.error);
    });
}

// Show next card
function showNextCard() {
    if (availableCombinations.length === 0) return;

    // Reset flip state
    isFlipped = false;
    elements.card.classList.remove('flipped');

    // Select random combination
    const combination = availableCombinations[Math.floor(Math.random() * availableCombinations.length)];
    currentVerb = combination.verb;
    currentPronoun = combination.pronoun;

    // Update card content
    elements.infinitive.textContent = currentVerb.infinitive;
    elements.infinitiveBack.textContent = currentVerb.infinitive;
    elements.pronoun.textContent = currentPronoun;
    elements.pronounBack.textContent = currentPronoun;
    elements.conjugation.textContent = currentVerb.conjugations[currentPronoun] || '—';
    elements.englishTranslation.textContent = currentVerb.english || '';
}

// Flip card
function flipCard() {
    isFlipped = !isFlipped;
    elements.card.classList.toggle('flipped');
}

// Handle swipe
async function handleSwipe(direction) {
    if (!isFlipped) return; // Only allow swipe when card is flipped

    // Record statistics (right = correct, left = incorrect)
    const isCorrect = direction === 'right';

    // Update session stats
    sessionStats.total++;
    if (isCorrect) {
        sessionStats.correct++;
    } else {
        sessionStats.incorrect++;
    }
    updateSessionStats();

    // Update persistent stats
    try {
        await updateCombinationStats(currentVerb.infinitive, currentPronoun, isCorrect);
        // Refilter combinations in case this one reached mastery threshold
        await filterUnmasteredCombinations();
    } catch (error) {
        console.error('Failed to update stats:', error);
    }

    elements.card.classList.add(`swipe-${direction}`);

    setTimeout(() => {
        elements.card.classList.remove(`swipe-${direction}`);
        if (availableCombinations.length === 0) {
            updateStatus('All combinations mastered! Click reset to practice again.');
            elements.cardContainer.classList.add('hidden');
        } else {
            showNextCard();
        }
    }, 300);
}

// Setup event listeners
function setupEventListeners() {
    // Reset button
    elements.resetBtn.addEventListener('click', async () => {
        try {
            await resetAllStats();
        } catch (error) {
            console.error('Failed to reset stats:', error);
            alert('Failed to reset progress. Please try again.');
        }
    });

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
    const total = allVerbs.length * PRONOUNS.length;
    const remaining = availableCombinations.length;
    elements.cardCount.textContent = `${remaining}/${total} combinations remaining`;
}

function updateSessionStats() {
    elements.sessionCorrect.textContent = sessionStats.correct;
    elements.sessionIncorrect.textContent = sessionStats.incorrect;

    if (sessionStats.total > 0) {
        const accuracy = Math.round((sessionStats.correct / sessionStats.total) * 100);
        elements.sessionAccuracy.textContent = `${accuracy}%`;
    } else {
        elements.sessionAccuracy.textContent = '—';
    }
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
