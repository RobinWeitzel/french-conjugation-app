// Practice Mode
// Shared DB configuration is in shared.js

// URL Parameters
const urlParams = new URLSearchParams(window.location.search);
const direction = urlParams.get('direction') || 'en-fr';
const showInfinitive = urlParams.get('showInfinitive') !== 'false';
const selectedTenses = (urlParams.get('tenses') || 'present').split(',');

// Constants
const TENSE_NAMES = {
    present: 'Présent',
    passe_compose: 'Passé Composé',
    imparfait: 'Imparfait',
    futur: 'Futur Simple',
    conditionnel: 'Conditionnel'
};
const PRONOUNS = ['je', 'tu', 'il', 'nous', 'vous', 'ils'];
const MASTERY_THRESHOLD = 3;

// App State
let allVerbs = [];
let availableCombinations = []; // Array of {verb, pronoun, tense}
let currentCombo = null;
let isFlipped = false;
let touchStartX = 0;
let touchEndX = 0;

// Session Stats
let sessionStats = {
    correct: 0,
    incorrect: 0,
    total: 0
};

// DOM Elements
const elements = {
    loading: document.getElementById('loading'),
    cardContainer: document.getElementById('card-container'),
    card: document.getElementById('card'),
    question: document.getElementById('question'),
    questionBack: document.getElementById('question-back'),
    hint: document.getElementById('hint'),
    hintBack: document.getElementById('hint-back'),
    answer: document.getElementById('answer'),
    secondary: document.getElementById('secondary'),
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
    console.log('[App] Practice Mode — direction:', direction, 'tenses:', selectedTenses);
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

// Combo key for stats
function comboKey(infinitive, pronoun, tense) {
    return `${infinitive}_${pronoun}_${tense}`;
}

// Get stats for a specific combination
function getCombinationStats(infinitive, pronoun, tense) {
    return new Promise((resolve, reject) => {
        const key = comboKey(infinitive, pronoun, tense);
        const transaction = db.transaction([STATS_STORE], 'readonly');
        const store = transaction.objectStore(STATS_STORE);
        const request = store.get(key);

        request.onsuccess = () => {
            const stats = request.result || {
                id: key,
                verb: infinitive,
                pronoun: pronoun,
                tense: tense,
                correct: 0,
                incorrect: 0,
                totalAttempts: 0,
                lastPracticed: null
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

// Build all combinations from verbs x tenses x pronouns, skipping null entries
function buildAllCombinations() {
    const combos = [];
    for (const verb of allVerbs) {
        for (const tense of selectedTenses) {
            if (!verb.tenses || !verb.tenses[tense]) continue;
            for (const pronoun of PRONOUNS) {
                const entry = verb.tenses[tense][pronoun];
                if (entry === null || entry === undefined) continue;
                combos.push({ verb, pronoun, tense });
            }
        }
    }
    return combos;
}

// Filter combinations based on mastery
async function filterUnmasteredCombinations() {
    const allStats = await getAllStats();
    const statsMap = new Map(allStats.map(stat => [stat.id, stat]));

    const allCombos = buildAllCombinations();
    availableCombinations = [];

    for (const combo of allCombos) {
        const key = comboKey(combo.verb.infinitive, combo.pronoun, combo.tense);
        const stats = statsMap.get(key);
        if (!stats || stats.correct < MASTERY_THRESHOLD) {
            availableCombinations.push(combo);
        }
    }

    updateCardCount();
}

// Update stats for a combination
async function updateCombinationStats(infinitive, pronoun, tense, isCorrect) {
    const stats = await getCombinationStats(infinitive, pronoun, tense);

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
    currentCombo = availableCombinations[Math.floor(Math.random() * availableCombinations.length)];
    const { verb, pronoun, tense } = currentCombo;
    const entry = verb.tenses[tense][pronoun];
    const tenseName = TENSE_NAMES[tense];

    if (direction === 'en-fr') {
        elements.question.textContent = entry.english;
        elements.questionBack.textContent = entry.english;
        elements.answer.textContent = entry.french;
        elements.secondary.textContent = tenseName;
        elements.hint.textContent = showInfinitive ? `(${verb.infinitive})` : '';
        elements.hintBack.textContent = showInfinitive ? `(${verb.infinitive})` : '';
    } else {
        elements.question.textContent = entry.french;
        elements.questionBack.textContent = entry.french;
        elements.answer.textContent = entry.english;
        elements.secondary.textContent = tenseName;
        elements.hint.textContent = showInfinitive ? `(${verb.infinitive}) — ${tenseName}` : tenseName;
        elements.hintBack.textContent = showInfinitive ? `(${verb.infinitive}) — ${tenseName}` : tenseName;
    }
}

// Flip card
function flipCard() {
    isFlipped = !isFlipped;
    elements.card.classList.toggle('flipped');
}

// Handle swipe
async function handleSwipe(swipeDirection) {
    if (!isFlipped) return; // Only allow swipe when card is flipped

    const isCorrect = swipeDirection === 'right';

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
        await updateCombinationStats(currentCombo.verb.infinitive, currentCombo.pronoun, currentCombo.tense, isCorrect);
        await filterUnmasteredCombinations();
    } catch (error) {
        console.error('Failed to update stats:', error);
    }

    elements.card.classList.add(`swipe-${swipeDirection}`);

    setTimeout(() => {
        elements.card.classList.remove(`swipe-${swipeDirection}`);
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
    const allCombos = buildAllCombinations();
    const total = allCombos.length;
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
        elements.sessionAccuracy.textContent = '\u2014';
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
