// Listening Practice Mode
// Shared DB configuration is in shared.js

// URL Parameters
const urlParams = new URLSearchParams(window.location.search);
const selectedCategories = (urlParams.get('categories') || '').split(',').filter(Boolean);

// Constants
const MASTERY_THRESHOLD = 3;

// TTS State
let selectedVoice = null;
let ttsAvailable = false;

// Audio State
let currentAudio = null;
let playbackSpeed = parseFloat(localStorage.getItem('listeningSpeed') || '1');

// App State
let allSentences = [];
let availableSentences = [];
let currentSentence = null;
let isFlipped = false;
let touchStartX = 0;
let touchEndX = 0;
let categoryNames = {};
let playHintFaded = false;

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
    categoryLabel: document.getElementById('category-label'),
    playBtn: document.getElementById('play-btn'),
    playHint: document.getElementById('play-hint'),
    speedToggle: document.getElementById('speed-toggle'),
    replayBtn: document.getElementById('replay-btn'),
    frenchText: document.getElementById('french-text'),
    englishText: document.getElementById('english-text'),
    ttsWarning: document.getElementById('tts-warning'),
    error: document.getElementById('error'),
    status: document.getElementById('status'),
    cardCount: document.getElementById('card-count'),
    sessionCorrect: document.getElementById('session-correct'),
    sessionIncorrect: document.getElementById('session-incorrect'),
    sessionAccuracy: document.getElementById('session-accuracy'),
    resetBtn: document.getElementById('reset-btn')
};

// Initialize TTS — returns Promise<boolean>
function initTTS() {
    return new Promise((resolve) => {
        const synth = window.speechSynthesis;
        if (!synth) {
            resolve(false);
            return;
        }

        function findFrenchVoice() {
            const voices = synth.getVoices();
            // Prefer fr-FR, then any fr-* variant, prefer local voices
            let bestVoice = null;
            let bestScore = -1;

            for (const voice of voices) {
                const lang = voice.lang.toLowerCase();
                if (!lang.startsWith('fr')) continue;

                let score = 0;
                if (lang === 'fr-fr') score += 2;
                else if (lang.startsWith('fr')) score += 1;
                if (voice.localService) score += 1;

                if (score > bestScore) {
                    bestScore = score;
                    bestVoice = voice;
                }
            }
            return bestVoice;
        }

        // Try immediately (voices may already be loaded)
        const voice = findFrenchVoice();
        if (voice) {
            selectedVoice = voice;
            console.log('[TTS] Found French voice:', voice.name, voice.lang);
            resolve(true);
            return;
        }

        // Wait for voiceschanged event
        let resolved = false;
        const onVoicesChanged = () => {
            if (resolved) return;
            const v = findFrenchVoice();
            if (v) {
                resolved = true;
                selectedVoice = v;
                console.log('[TTS] Found French voice (async):', v.name, v.lang);
                synth.removeEventListener('voiceschanged', onVoicesChanged);
                resolve(true);
            }
        };
        synth.addEventListener('voiceschanged', onVoicesChanged);

        // Timeout after 2 seconds
        setTimeout(() => {
            if (!resolved) {
                resolved = true;
                synth.removeEventListener('voiceschanged', onVoicesChanged);
                // One last try
                const v = findFrenchVoice();
                if (v) {
                    selectedVoice = v;
                    console.log('[TTS] Found French voice (timeout):', v.name, v.lang);
                    resolve(true);
                } else {
                    console.warn('[TTS] No French voice found');
                    resolve(false);
                }
            }
        }, 2000);
    });
}

// Three-tier audio playback: cached audio → network audio → Web Speech API
async function speak(sentenceId, text) {
    stopPlayback();

    const audioUrl = `./audio/${sentenceId}.mp3`;

    try {
        const response = await fetch(audioUrl);
        if (!response.ok) throw new Error('No audio file');
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        currentAudio = new Audio(url);
        currentAudio.playbackRate = playbackSpeed;

        elements.playBtn.classList.add('speaking');
        elements.playBtn.innerHTML = '&#128264;';

        currentAudio.onended = () => {
            elements.playBtn.classList.remove('speaking');
            elements.playBtn.innerHTML = '&#9654;';
            URL.revokeObjectURL(url);
            currentAudio = null;
        };

        currentAudio.onerror = () => {
            elements.playBtn.classList.remove('speaking');
            elements.playBtn.innerHTML = '&#9654;';
            URL.revokeObjectURL(url);
            currentAudio = null;
        };

        await currentAudio.play();
    } catch (e) {
        speakWithTTS(text);
    }
}

// Web Speech API fallback
function speakWithTTS(text) {
    const synth = window.speechSynthesis;
    if (!synth) return;

    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.rate = playbackSpeed * 0.9;
    if (selectedVoice) utterance.voice = selectedVoice;

    elements.playBtn.classList.add('speaking');
    elements.playBtn.innerHTML = '&#128264;';

    utterance.onend = () => {
        elements.playBtn.classList.remove('speaking');
        elements.playBtn.innerHTML = '&#9654;';
    };

    utterance.onerror = () => {
        elements.playBtn.classList.remove('speaking');
        elements.playBtn.innerHTML = '&#9654;';
    };

    synth.speak(utterance);
}

// Stop all playback
function stopPlayback() {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
    elements.playBtn.classList.remove('speaking');
    elements.playBtn.innerHTML = '&#9654;';
}

// Sentence key for stats
function sentenceKey(id) {
    return `listening_${id}`;
}

// Get stats for a specific sentence
function getSentenceStats(id) {
    return new Promise((resolve, reject) => {
        const key = sentenceKey(id);
        const transaction = db.transaction([STATS_STORE], 'readonly');
        const store = transaction.objectStore(STATS_STORE);
        const request = store.get(key);

        request.onsuccess = () => {
            const stats = request.result || {
                id: key,
                sentenceId: id,
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

// Filter unmastered sentences by selected categories and mastery
async function filterUnmasteredSentences() {
    const allStats = await getAllStats();
    const statsMap = new Map(allStats.map(stat => [stat.id, stat]));

    // Filter by selected categories
    const categorySentences = allSentences.filter(s => selectedCategories.includes(s.category));

    availableSentences = [];
    for (const sentence of categorySentences) {
        const key = sentenceKey(sentence.id);
        const stats = statsMap.get(key);
        if (!stats || stats.correct < MASTERY_THRESHOLD) {
            availableSentences.push(sentence);
        }
    }

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

// Reset only listening stats (not verb stats)
async function resetListeningStats() {
    if (!confirm('Are you sure you want to reset listening progress? This cannot be undone.')) {
        return;
    }

    const allStats = await getAllStats();
    const listeningStats = allStats.filter(s => s.id.startsWith('listening_'));

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STATS_STORE], 'readwrite');
        const store = transaction.objectStore(STATS_STORE);

        let deleted = 0;
        if (listeningStats.length === 0) {
            // Nothing to delete, just resolve
            resolve();
            return;
        }

        for (const stat of listeningStats) {
            const request = store.delete(stat.id);
            request.onsuccess = () => {
                deleted++;
                if (deleted === listeningStats.length) {
                    // Reset session stats
                    sessionStats.correct = 0;
                    sessionStats.incorrect = 0;
                    sessionStats.total = 0;
                    updateSessionStats();

                    // Refilter sentences
                    filterUnmasteredSentences().then(() => {
                        // Show cards again if they were hidden
                        elements.cardContainer.classList.remove('hidden');
                        updateStatus('Progress reset - all sentences available');
                        showNextCard();
                        resolve();
                    });
                }
            };
            request.onerror = () => reject(request.error);
        }
    });
}

// Show next card
function showNextCard() {
    if (availableSentences.length === 0) return;

    isFlipped = false;
    elements.card.classList.remove('flipped');

    stopPlayback();

    currentSentence = availableSentences[Math.floor(Math.random() * availableSentences.length)];
    elements.categoryLabel.textContent = categoryNames[currentSentence.category] || currentSentence.category;
    elements.frenchText.textContent = currentSentence.french;
    elements.englishText.textContent = currentSentence.english;

    // Autoplay
    setTimeout(() => {
        if (currentSentence) {
            speak(currentSentence.id, currentSentence.french);
            if (!playHintFaded) {
                playHintFaded = true;
                elements.playHint.classList.add('faded');
            }
        }
    }, 300);
}

// Flip card
function flipCard() {
    isFlipped = !isFlipped;
    elements.card.classList.toggle('flipped');
    stopPlayback();
}

// Handle swipe
async function handleSwipe(swipeDirection) {
    if (!isFlipped) return;

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
        await updateSentenceStats(currentSentence.id, isCorrect);
        await filterUnmasteredSentences();
    } catch (error) {
        console.error('Failed to update stats:', error);
    }

    elements.card.classList.add(`swipe-${swipeDirection}`);

    setTimeout(() => {
        elements.card.classList.remove(`swipe-${swipeDirection}`);
        if (availableSentences.length === 0) {
            updateStatus('All sentences mastered! Click reset to practice again.');
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
            await resetListeningStats();
        } catch (error) {
            console.error('Failed to reset stats:', error);
            alert('Failed to reset progress. Please try again.');
        }
    });

    // Speed toggle
    elements.speedToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        playbackSpeed = playbackSpeed === 1 ? 0.75 : 1;
        localStorage.setItem('listeningSpeed', String(playbackSpeed));
        elements.speedToggle.textContent = playbackSpeed === 1 ? '1x' : '0.75x';
        if (currentAudio) currentAudio.playbackRate = playbackSpeed;
    });

    // Play button click (stopPropagation so it doesn't flip card)
    elements.playBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (currentSentence && !isFlipped) {
            speak(currentSentence.id, currentSentence.french);
            if (!playHintFaded) {
                playHintFaded = true;
                elements.playHint.classList.add('faded');
            }
        }
    });

    // Replay button on card back
    elements.replayBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (currentSentence && isFlipped) {
            speak(currentSentence.id, currentSentence.french);
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
            if (currentSentence) {
                speak(currentSentence.id, currentSentence.french);
                if (!playHintFaded) {
                    playHintFaded = true;
                    elements.playHint.classList.add('faded');
                }
            }
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
    const categorySentences = allSentences.filter(s => selectedCategories.includes(s.category));
    const total = categorySentences.length;
    const remaining = availableSentences.length;
    elements.cardCount.textContent = `${remaining}/${total} sentences remaining`;
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

// Initialize the app
async function init() {
    console.log('[App] Listening Mode — categories:', selectedCategories);

    // Show troubleshooting help if loading takes too long
    const loadingTimeout = setTimeout(() => {
        const loadingEl = elements.loading;
        if (loadingEl && !loadingEl.classList.contains('hidden')) {
            loadingEl.innerHTML += '<p style="margin-top:20px;font-size:0.9rem;">Taking too long? <a href="settings.html" style="color:white;text-decoration:underline;">Clear Cache</a></p>';
        }
    }, 5000);

    try {
        updateStatus('Initializing...');
        await initDB();

        // Load sentences and init TTS in parallel
        const [sentences, hasTTS] = await Promise.all([
            loadSentences(updateStatus),
            initTTS()
        ]);

        allSentences = sentences;
        ttsAvailable = hasTTS;

        // Fetch category display names
        try {
            const response = await fetch(SENTENCES_URL);
            const data = await response.json();
            categoryNames = data.categories || {};
        } catch (e) {
            console.warn('[App] Could not fetch category names');
            categoryNames = {};
        }

        // Show TTS warning if no voice found
        if (!ttsAvailable) {
            elements.ttsWarning.classList.remove('hidden');
        }

        await filterUnmasteredSentences();

        if (availableSentences.length === 0) {
            updateStatus('All sentences mastered! Click reset to practice again.');
        }

        setupEventListeners();
        elements.speedToggle.textContent = playbackSpeed === 1 ? '1x' : '0.75x';
        showNextCard();
        hideLoading();
    } catch (error) {
        showError('Failed to initialize app: ' + error.message);
    } finally {
        clearTimeout(loadingTimeout);
    }
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
