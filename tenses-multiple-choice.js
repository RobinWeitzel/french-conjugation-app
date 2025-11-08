// Multiple choice tense practice
let allPhrases = [];
let availablePhrases = [];
let currentPhrase = null;
let selectedTenses = [];
let stats = {
    correct: 0,
    incorrect: 0
};

const tenseNames = {
    'present': 'Présent',
    'passe_compose': 'Passé Composé',
    'imparfait': 'Imparfait',
    'futur': 'Futur Simple',
    'conditionnel': 'Conditionnel'
};

const infinitiveEl = document.getElementById('infinitive');
const tenseNameEl = document.getElementById('tense-name');
const pronounEl = document.getElementById('pronoun');
const optionsEl = document.getElementById('options');
const feedbackEl = document.getElementById('feedback');
const statusEl = document.getElementById('status');
const correctCountEl = document.getElementById('correct-count');
const incorrectCountEl = document.getElementById('incorrect-count');
const accuracyEl = document.getElementById('accuracy');

// Load phrases from JSON
async function loadPhrases() {
    try {
        statusEl.textContent = 'Loading phrases...';
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

// Initialize app
async function init() {
    try {
        // Get selected tenses from URL
        const urlParams = new URLSearchParams(window.location.search);
        const tensesParam = urlParams.get('tenses');

        if (!tensesParam) {
            statusEl.textContent = 'No tenses selected';
            return;
        }

        selectedTenses = tensesParam.split(',');

        // Set back button URL with tenses
        document.getElementById('back-btn').href = `tenses-mode.html?tenses=${tensesParam}`;

        // Load phrases from JSON
        statusEl.textContent = 'Loading phrases...';
        allPhrases = await loadPhrases();

        if (allPhrases.length === 0) {
            statusEl.textContent = 'No phrases available. Please check your connection.';
            return;
        }

        // Filter phrases by selected tenses
        availablePhrases = allPhrases.filter(phrase =>
            selectedTenses.includes(phrase.tense)
        );

        if (availablePhrases.length === 0) {
            statusEl.textContent = 'No phrases found for selected tenses';
            return;
        }

        statusEl.textContent = `${availablePhrases.length} phrases loaded`;
        loadQuestion();
    } catch (error) {
        console.error('Failed to initialize:', error);
        statusEl.textContent = 'Error loading phrases';
    }
}

// Load a new question
function loadQuestion() {
    feedbackEl.textContent = '';
    feedbackEl.className = 'feedback';

    // Select random phrase from available phrases
    currentPhrase = availablePhrases[Math.floor(Math.random() * availablePhrases.length)];

    // Display question
    infinitiveEl.textContent = currentPhrase.english;
    tenseNameEl.textContent = tenseNames[currentPhrase.tense];
    pronounEl.textContent = ''; // Phrase doesn't have separate pronoun display

    // Generate options
    const options = generateOptions();
    displayOptions(options);
}

// Generate 3 options: 1 correct + 2 random wrong answers
function generateOptions() {
    const correctAnswer = currentPhrase.french;
    const options = [correctAnswer];

    // Get wrong answers from other verbs with same pronoun but different conjugations
    // This makes the wrong answers look plausible instead of obviously wrong
    const samePronounPhrases = availablePhrases.filter(p =>
        p.french !== currentPhrase.french &&
        p.pronoun === currentPhrase.pronoun &&
        p.verb !== currentPhrase.verb  // Different verb to ensure it's actually wrong
    );

    const shuffled = samePronounPhrases.sort(() => Math.random() - 0.5);

    // Add up to 2 wrong answers
    for (let i = 0; i < shuffled.length && options.length < 3; i++) {
        const wrongAnswer = shuffled[i].french;
        if (!options.includes(wrongAnswer)) {
            options.push(wrongAnswer);
        }
    }

    // If we couldn't find enough wrong answers with same pronoun, fall back to any phrases
    if (options.length < 3) {
        const fallbackPhrases = availablePhrases.filter(p => p.french !== currentPhrase.french);
        const fallbackShuffled = fallbackPhrases.sort(() => Math.random() - 0.5);

        for (let i = 0; i < fallbackShuffled.length && options.length < 3; i++) {
            const wrongAnswer = fallbackShuffled[i].french;
            if (!options.includes(wrongAnswer)) {
                options.push(wrongAnswer);
            }
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
    const correctAnswer = currentPhrase.french;
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

// Start the app
init();
