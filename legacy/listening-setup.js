// Listening Setup Page Logic

// Will be populated from sentences.json or DB
let CATEGORIES = [];

// DOM Elements
const categoryList = document.getElementById('category-list');
const selectAllBtn = document.getElementById('select-all-btn');
const startBtn = document.getElementById('start-btn');

// State
let selectedCategories = JSON.parse(localStorage.getItem('listeningCategories') || '[]');

// Initialize
async function init() {
    await initDB();
    await loadCategories();
    renderCategories();
    updateStartButton();
}

// Load categories from sentences.json, fallback to DB
async function loadCategories() {
    try {
        // Try fetching sentences.json for category display names
        const response = await fetch(SENTENCES_URL);
        const data = await response.json();
        CATEGORIES = Object.entries(data.categories).map(([key, name]) => ({
            key,
            name
        }));
    } catch (e) {
        console.warn('[ListeningSetup] Could not fetch sentences.json, deriving categories from DB');
        // Fallback: derive categories from stored sentences
        try {
            await loadSentences();
            const sentences = await getSentencesFromDB();
            const categoryKeys = [...new Set(sentences.map(s => s.category))].sort();
            CATEGORIES = categoryKeys.map(key => ({
                key,
                name: key.charAt(0).toUpperCase() + key.slice(1)
            }));
        } catch (dbErr) {
            console.error('[ListeningSetup] Could not load categories from DB either:', dbErr);
            CATEGORIES = [];
        }
    }

    // If no categories selected yet, default to first category
    if (selectedCategories.length === 0 && CATEGORIES.length > 0) {
        selectedCategories = [CATEGORIES[0].key];
        localStorage.setItem('listeningCategories', JSON.stringify(selectedCategories));
    }

    // Filter out any previously selected categories that no longer exist
    const validKeys = CATEGORIES.map(c => c.key);
    selectedCategories = selectedCategories.filter(key => validKeys.includes(key));
    localStorage.setItem('listeningCategories', JSON.stringify(selectedCategories));
}

// Category checkboxes
function renderCategories() {
    categoryList.innerHTML = '';
    CATEGORIES.forEach(category => {
        const item = document.createElement('div');
        item.className = 'category-item';

        const checkbox = document.createElement('div');
        checkbox.className = 'custom-checkbox';
        if (selectedCategories.includes(category.key)) {
            checkbox.classList.add('checked');
        }

        const label = document.createElement('label');
        label.textContent = category.name;

        item.appendChild(checkbox);
        item.appendChild(label);

        item.addEventListener('click', () => {
            const idx = selectedCategories.indexOf(category.key);
            if (idx === -1) {
                selectedCategories.push(category.key);
            } else {
                selectedCategories.splice(idx, 1);
            }
            localStorage.setItem('listeningCategories', JSON.stringify(selectedCategories));
            checkbox.classList.toggle('checked');
            updateStartButton();
            updateSelectAllText();
        });

        categoryList.appendChild(item);
    });
    updateSelectAllText();
}

// Select All button
function updateSelectAllText() {
    const allSelected = selectedCategories.length === CATEGORIES.length;
    selectAllBtn.textContent = allSelected ? 'Deselect All' : 'Select All';
}

selectAllBtn.addEventListener('click', () => {
    const allSelected = selectedCategories.length === CATEGORIES.length;
    if (allSelected) {
        selectedCategories = [];
    } else {
        selectedCategories = CATEGORIES.map(c => c.key);
    }
    localStorage.setItem('listeningCategories', JSON.stringify(selectedCategories));
    renderCategories();
    updateStartButton();
});

// Start button
function updateStartButton() {
    startBtn.disabled = selectedCategories.length === 0;
}

startBtn.addEventListener('click', () => {
    if (selectedCategories.length === 0) return;
    const params = new URLSearchParams({
        categories: selectedCategories.join(',')
    });
    window.location.href = `listening.html?${params.toString()}`;
});

// Run
init();
