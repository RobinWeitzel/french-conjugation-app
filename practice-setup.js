// Practice Setup Page Logic

const TENSES = [
    { key: 'present', name: 'Présent' },
    { key: 'passe_compose', name: 'Passé Composé' },
    { key: 'imparfait', name: 'Imparfait' },
    { key: 'futur', name: 'Futur Simple' },
    { key: 'conditionnel', name: 'Conditionnel' }
];

// DOM Elements
const directionBtns = document.querySelectorAll('.direction-btn');
const infinitiveRow = document.getElementById('infinitive-row');
const infinitiveCheckbox = document.getElementById('infinitive-checkbox');
const tenseList = document.getElementById('tense-list');
const selectAllBtn = document.getElementById('select-all-btn');
const startBtn = document.getElementById('start-btn');

// State
let direction = localStorage.getItem('practiceDirection') || 'en-fr';
let showInfinitive = localStorage.getItem('practiceShowInfinitive') !== 'false';
let selectedTenses = JSON.parse(localStorage.getItem('practiceTenses') || '["present"]');

// Initialize
function init() {
    renderDirection();
    renderInfinitive();
    renderTenses();
    updateStartButton();
}

// Direction toggle
function renderDirection() {
    directionBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.direction === direction);
    });
}

directionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        direction = btn.dataset.direction;
        localStorage.setItem('practiceDirection', direction);
        renderDirection();
    });
});

// Infinitive checkbox
function renderInfinitive() {
    infinitiveCheckbox.classList.toggle('checked', showInfinitive);
}

infinitiveRow.addEventListener('click', () => {
    showInfinitive = !showInfinitive;
    localStorage.setItem('practiceShowInfinitive', showInfinitive);
    renderInfinitive();
});

// Tense checkboxes
function renderTenses() {
    tenseList.innerHTML = '';
    TENSES.forEach(tense => {
        const item = document.createElement('div');
        item.className = 'tense-item';

        const checkbox = document.createElement('div');
        checkbox.className = 'custom-checkbox';
        if (selectedTenses.includes(tense.key)) {
            checkbox.classList.add('checked');
        }

        const label = document.createElement('label');
        label.textContent = tense.name;

        item.appendChild(checkbox);
        item.appendChild(label);

        item.addEventListener('click', () => {
            const idx = selectedTenses.indexOf(tense.key);
            if (idx === -1) {
                selectedTenses.push(tense.key);
            } else {
                selectedTenses.splice(idx, 1);
            }
            localStorage.setItem('practiceTenses', JSON.stringify(selectedTenses));
            checkbox.classList.toggle('checked');
            updateStartButton();
            updateSelectAllText();
        });

        tenseList.appendChild(item);
    });
    updateSelectAllText();
}

// Select All button
function updateSelectAllText() {
    const allSelected = selectedTenses.length === TENSES.length;
    selectAllBtn.textContent = allSelected ? 'Deselect All' : 'Select All';
}

selectAllBtn.addEventListener('click', () => {
    const allSelected = selectedTenses.length === TENSES.length;
    if (allSelected) {
        selectedTenses = [];
    } else {
        selectedTenses = TENSES.map(t => t.key);
    }
    localStorage.setItem('practiceTenses', JSON.stringify(selectedTenses));
    renderTenses();
    updateStartButton();
});

// Start button
function updateStartButton() {
    startBtn.disabled = selectedTenses.length === 0;
}

startBtn.addEventListener('click', () => {
    if (selectedTenses.length === 0) return;
    const params = new URLSearchParams({
        direction: direction,
        showInfinitive: showInfinitive,
        tenses: selectedTenses.join(',')
    });
    window.location.href = `practice.html?${params.toString()}`;
});

// Run
init();
