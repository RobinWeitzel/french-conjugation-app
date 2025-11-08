// Multiple choice conjugation practice
let verbs = [];
let currentVerb = null;
let currentPronoun = null;
let correctAnswer = null;
let stats = {
    correct: 0,
    incorrect: 0
};

const pronouns = ['je', 'tu', 'il', 'nous', 'vous', 'ils'];

const infinitiveEl = document.getElementById('infinitive');
const pronounEl = document.getElementById('pronoun');
const optionsEl = document.getElementById('options');
const feedbackEl = document.getElementById('feedback');
const statusEl = document.getElementById('status');
const correctCountEl = document.getElementById('correct-count');
const incorrectCountEl = document.getElementById('incorrect-count');
const accuracyEl = document.getElementById('accuracy');

// Initialize app
async function init() {
    try {
        await initDB();
        await loadWords();

        if (verbs.length === 0) {
            statusEl.textContent = 'No verbs available. Please check your connection.';
            return;
        }

        statusEl.textContent = `${verbs.length} verbs loaded`;
        loadQuestion();
    } catch (error) {
        console.error('Failed to initialize:', error);
        statusEl.textContent = 'Error loading verbs';
    }
}

// Load words from IndexedDB
async function loadWords() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['verbs'], 'readonly');
        const objectStore = transaction.objectStore('verbs');
        const request = objectStore.getAll();

        request.onsuccess = () => {
            verbs = request.result;
            resolve();
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}

// Load a new question
function loadQuestion() {
    feedbackEl.textContent = '';
    feedbackEl.className = 'feedback';

    // Select random verb and pronoun
    currentVerb = verbs[Math.floor(Math.random() * verbs.length)];
    currentPronoun = pronouns[Math.floor(Math.random() * pronouns.length)];

    // Get correct answer
    correctAnswer = currentVerb.conjugations[currentPronoun];

    // Display question
    infinitiveEl.textContent = currentVerb.english;
    pronounEl.textContent = currentPronoun;

    // Generate options
    const options = generateOptions();
    displayOptions(options);
}

// Generate 3 options: 1 correct + 2 random wrong answers
function generateOptions() {
    const options = [correctAnswer];

    // Get wrong answers from other verbs (same pronoun)
    const otherVerbs = verbs.filter(v => v.infinitive !== currentVerb.infinitive);
    const shuffled = otherVerbs.sort(() => Math.random() - 0.5);

    // Add up to 2 wrong answers
    for (let i = 0; i < shuffled.length && options.length < 3; i++) {
        const wrongAnswer = shuffled[i].conjugations[currentPronoun];
        if (!options.includes(wrongAnswer)) {
            options.push(wrongAnswer);
        }
    }

    // Shuffle options
    return options.sort(() => Math.random() - 0.5);
}

// Display options
function displayOptions(options) {
    optionsEl.innerHTML = '';

    options.forEach(option => {
        const optionEl = document.createElement('div');
        optionEl.className = 'option';
        optionEl.textContent = option;
        optionEl.addEventListener('click', () => handleAnswer(option, optionEl));
        optionsEl.appendChild(optionEl);
    });
}

// Handle answer selection
function handleAnswer(selectedAnswer, selectedEl) {
    const isCorrect = selectedAnswer === correctAnswer;

    // Update stats
    if (isCorrect) {
        stats.correct++;
        selectedEl.classList.add('correct');
        feedbackEl.textContent = '✓ Correct!';
        feedbackEl.className = 'feedback correct';
    } else {
        stats.incorrect++;
        selectedEl.classList.add('incorrect');
        feedbackEl.textContent = `✗ Wrong! The answer is: ${correctAnswer}`;
        feedbackEl.className = 'feedback incorrect';

        // Highlight correct answer
        const allOptions = optionsEl.querySelectorAll('.option');
        allOptions.forEach(opt => {
            if (opt.textContent === correctAnswer) {
                opt.classList.add('correct');
            }
        });
    }

    // Disable all options
    const allOptions = optionsEl.querySelectorAll('.option');
    allOptions.forEach(opt => opt.classList.add('disabled'));

    // Update stats display
    updateStatsDisplay();

    // Update progress in IndexedDB
    updateProgress(currentVerb.infinitive, isCorrect);

    // Load next question after delay
    setTimeout(() => {
        loadQuestion();
    }, 1500);
}

// Update stats display
function updateStatsDisplay() {
    correctCountEl.textContent = stats.correct;
    incorrectCountEl.textContent = stats.incorrect;

    const total = stats.correct + stats.incorrect;
    if (total > 0) {
        const accuracy = Math.round((stats.correct / total) * 100);
        accuracyEl.textContent = `${accuracy}%`;
    } else {
        accuracyEl.textContent = '—';
    }
}

// Update progress in IndexedDB
function updateProgress(infinitive, correct) {
    const transaction = db.transaction(['verbs'], 'readwrite');
    const objectStore = transaction.objectStore('verbs');
    const request = objectStore.get(infinitive);

    request.onsuccess = () => {
        const verb = request.result;
        if (!verb) return;

        verb.lastPracticed = Date.now();
        verb.timesCorrect = (verb.timesCorrect || 0) + (correct ? 1 : 0);
        verb.timesIncorrect = (verb.timesIncorrect || 0) + (correct ? 0 : 1);

        objectStore.put(verb);
    };
}

// Start the app
init();
