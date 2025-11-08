// Tense Practice Mode
// Shared DB configuration is in shared.js

// Tense configurations
const TENSES = {
    present: { name: 'Présent', key: 'present' },
    passe_compose: { name: 'Passé Composé', key: 'passe_compose' },
    futur: { name: 'Futur Simple', key: 'futur' }
};

// App State
let allPhrases = [];
let availablePhrases = [];
let selectedTenses = [];
let currentPhrase = null;
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
    englishPhrase: document.getElementById('english-phrase'),
    englishPhraseBack: document.getElementById('english-phrase-back'),
    frenchAnswer: document.getElementById('french-answer'),
    error: document.getElementById('error'),
    status: document.getElementById('status'),
    cardCount: document.getElementById('card-count'),
    sessionCorrect: document.getElementById('session-correct'),
    sessionIncorrect: document.getElementById('session-incorrect'),
    sessionAccuracy: document.getElementById('session-accuracy')
};

// Load phrases from JSON
async function loadPhrases() {
    try {
        updateStatus('Loading phrases...');
        const response = await fetch('tense-practice-words.json');
        if (!response.ok) {
            throw new Error('Failed to load phrases');
        }
        const data = await response.json();
        return data.phrases || [];
    } catch (error) {
        console.error('Error loading phrases:', error);
        throw error;
    }
}

// Initialize the app
async function init() {
    console.log('[App] Tense Practice Mode');
    try {
        // Get selected tenses from URL params or localStorage
        const urlParams = new URLSearchParams(window.location.search);
        const tensesParam = urlParams.get('tenses');

        if (tensesParam) {
            selectedTenses = tensesParam.split(',');
            // Save to localStorage
            localStorage.setItem('selectedTenses', JSON.stringify(selectedTenses));
            // Set back button URL with tenses
            document.getElementById('back-btn').href = `tenses-mode.html?tenses=${tensesParam}`;
        } else {
            // Try to load from localStorage
            const savedTenses = localStorage.getItem('selectedTenses');
            if (savedTenses) {
                selectedTenses = JSON.parse(savedTenses);
                // Set back button URL with saved tenses
                const tensesString = selectedTenses.join(',');
                document.getElementById('back-btn').href = `tenses-mode.html?tenses=${tensesString}`;
            } else {
                // Redirect back to selection if no tenses
                window.location.href = 'tenses.html';
                return;
            }
        }

        // Validate selected tenses
        selectedTenses = selectedTenses.filter(t => TENSES[t]);
        if (selectedTenses.length === 0) {
            window.location.href = 'tenses.html';
            return;
        }

        updateStatus('Initializing...');
        allPhrases = await loadPhrases();

        if (allPhrases.length === 0) {
            throw new Error('No phrases available. Please check your internet connection.');
        }

        // Filter phrases by selected tenses
        filterAvailablePhrases();

        if (availablePhrases.length === 0) {
            throw new Error('No phrases available for selected tenses.');
        }

        setupEventListeners();
        updateCardCount();
        showNextCard();
        hideLoading();
    } catch (error) {
        showError('Failed to initialize app: ' + error.message);
    }
}

// Filter available phrases by selected tenses
function filterAvailablePhrases() {
    availablePhrases = allPhrases.filter(phrase =>
        selectedTenses.includes(phrase.tense)
    );
}

// Show next card
function showNextCard() {
    if (availablePhrases.length === 0) return;

    // Reset flip state
    isFlipped = false;
    elements.card.classList.remove('flipped');

    // Select random phrase
    currentPhrase = availablePhrases[Math.floor(Math.random() * availablePhrases.length)];

    // Update card content - show pronoun to disambiguate tu/vous
    const displayText = `${currentPhrase.english} (${currentPhrase.pronoun})`;
    elements.englishPhrase.textContent = displayText;
    elements.englishPhraseBack.textContent = displayText;
    elements.frenchAnswer.textContent = currentPhrase.french;
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
    elements.cardCount.textContent = `${availablePhrases.length} phrases available`;
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
