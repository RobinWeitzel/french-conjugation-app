# TTS Audio Improvement Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace robotic Web Speech API with pre-recorded ElevenLabs audio, served from GitHub Pages with progressive caching and offline fallback.

**Architecture:** Python script generates MP3s via ElevenLabs → stored in `audio/` folder → served by GitHub Pages → SW caches on first play → listening.js tries cached audio → network audio → Web Speech API fallback. Settings page lets users bulk-download all audio for offline use.

**Tech Stack:** ElevenLabs Python SDK, Web Audio API, Service Worker Cache API, IndexedDB (existing)

---

### Task 1: Audio Generation Script Setup

**Files:**
- Create: `scripts/generate_audio.py`
- Create: `scripts/.env.example`
- Create: `scripts/requirements.txt`
- Modify: `.gitignore`

**Step 1: Add scripts dependencies and env template**

Create `scripts/requirements.txt`:
```
elevenlabs
python-dotenv
```

Create `scripts/.env.example`:
```
ELEVENLABS_API_KEY=your_api_key_here
```

**Step 2: Add .env to .gitignore**

Append to `.gitignore`:
```
scripts/.env
```

**Step 3: Write the generation script**

Create `scripts/generate_audio.py`:
```python
#!/usr/bin/env python3
"""Generate MP3 audio files for French sentences using ElevenLabs TTS."""

import json
import os
import sys
import argparse
from pathlib import Path
from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs

# Load .env from scripts directory
load_dotenv(Path(__file__).parent / ".env")

SENTENCES_FILE = Path(__file__).parent.parent / "sentences.json"
AUDIO_DIR = Path(__file__).parent.parent / "audio"
API_KEY = os.getenv("ELEVENLABS_API_KEY")

# ElevenLabs config
MODEL_ID = "eleven_multilingual_v2"
OUTPUT_FORMAT = "mp3_44100_128"


def get_french_voice(client):
    """Find a good French voice. Returns voice_id."""
    response = client.voices.get_all()
    for voice in response.voices:
        # Look for a French voice - "Amelie" or similar
        if "french" in (voice.labels or {}).get("accent", "").lower():
            return voice.voice_id
    # Fallback: use first available voice
    if response.voices:
        return response.voices[0].voice_id
    raise RuntimeError("No voices available")


def main():
    parser = argparse.ArgumentParser(description="Generate French audio files")
    parser.add_argument(
        "--categories",
        type=str,
        help="Comma-separated category keys to generate (default: all)",
    )
    parser.add_argument(
        "--voice-id",
        type=str,
        help="ElevenLabs voice ID to use (default: auto-select French voice)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Count characters without generating audio",
    )
    args = parser.parse_args()

    if not API_KEY:
        print("Error: ELEVENLABS_API_KEY not set. Copy .env.example to .env and add your key.")
        sys.exit(1)

    # Load sentences
    with open(SENTENCES_FILE) as f:
        data = json.load(f)

    sentences = data["sentences"]
    categories_filter = None
    if args.categories:
        categories_filter = set(args.categories.split(","))
        sentences = [s for s in sentences if s["category"] in categories_filter]

    # Create audio directory
    AUDIO_DIR.mkdir(exist_ok=True)

    # Filter out already-generated sentences
    to_generate = []
    skipped = 0
    for s in sentences:
        mp3_path = AUDIO_DIR / f"{s['id']}.mp3"
        if mp3_path.exists():
            skipped += 1
        else:
            to_generate.append(s)

    total_chars = sum(len(s["french"]) for s in to_generate)
    print(f"Sentences to generate: {len(to_generate)} ({skipped} already exist)")
    print(f"Total characters: {total_chars}")

    if args.dry_run:
        print("\nDry run — no audio generated.")
        # Show per-category breakdown
        cats = {}
        for s in to_generate:
            cats[s["category"]] = cats.get(s["category"], 0) + len(s["french"])
        for cat, chars in sorted(cats.items()):
            count = sum(1 for s in to_generate if s["category"] == cat)
            print(f"  {cat}: {count} sentences, {chars} chars")
        return

    if not to_generate:
        print("Nothing to generate!")
        return

    client = ElevenLabs(api_key=API_KEY)

    voice_id = args.voice_id
    if not voice_id:
        voice_id = get_french_voice(client)
        print(f"Using voice ID: {voice_id}")

    chars_used = 0
    for i, sentence in enumerate(to_generate, 1):
        mp3_path = AUDIO_DIR / f"{sentence['id']}.mp3"
        text = sentence["french"]
        chars_used += len(text)

        print(f"  [{i}/{len(to_generate)}] {sentence['id']}: \"{text}\" ({chars_used} chars total)")

        audio_generator = client.text_to_speech.convert(
            text=text,
            voice_id=voice_id,
            model_id=MODEL_ID,
            output_format=OUTPUT_FORMAT,
        )

        # Write audio bytes to file
        with open(mp3_path, "wb") as f:
            for chunk in audio_generator:
                f.write(chunk)

    print(f"\nDone! Generated {len(to_generate)} files. Total characters used: {chars_used}")

    # Update audioCategories in sentences.json
    existing_audio_cats = set(data.get("audioCategories", []))
    # Check which categories now have ALL their audio files
    all_categories = set(s["category"] for s in data["sentences"])
    if categories_filter:
        check_cats = categories_filter
    else:
        check_cats = all_categories

    for cat in check_cats:
        cat_sentences = [s for s in data["sentences"] if s["category"] == cat]
        all_exist = all((AUDIO_DIR / f"{s['id']}.mp3").exists() for s in cat_sentences)
        if all_exist:
            existing_audio_cats.add(cat)

    data["audioCategories"] = sorted(existing_audio_cats)
    with open(SENTENCES_FILE, "w") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print(f"Updated audioCategories: {data['audioCategories']}")


if __name__ == "__main__":
    main()
```

**Step 4: Commit**

```bash
git add scripts/ .gitignore
git commit -m "feat: add ElevenLabs audio generation script"
```

---

### Task 2: Service Worker — Cache-First for Audio Files

**Files:**
- Modify: `sw.js` (lines 72-103, fetch handler)

**Step 1: Add cache-first strategy for audio files in the SW fetch handler**

In `sw.js`, add this block right after the `version.json` bypass (after line 82), before the `isAppFile` check:

```javascript
  // Cache-first strategy for audio files (progressive caching)
  if (pathname.includes('/audio/') && pathname.endsWith('.mp3')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        }).catch(() => {
          // Audio not available — app will fall back to Web Speech API
          return new Response('', { status: 404 });
        });
      })
    );
    return;
  }
```

**Step 2: Bump CACHE_NAME**

Change `french-conjugation-v43` → `french-conjugation-v44`

**Step 3: Commit**

```bash
git add sw.js
git commit -m "feat: add cache-first SW strategy for audio files"
```

---

### Task 3: Three-Tier Playback in listening.js

**Files:**
- Modify: `listening.js` (lines 12-14 TTS state, lines 52-158 TTS functions, lines 291-313 showNextCard)
- Modify: `listening.html` (line 52 — add speed toggle)
- Modify: `listening.css` (add speed toggle styles)

**Step 1: Add audio state variables and speed control**

In `listening.js`, replace lines 12-14 (TTS State):

```javascript
// TTS State
let selectedVoice = null;
let ttsAvailable = false;

// Audio State
let currentAudio = null;
let playbackSpeed = parseFloat(localStorage.getItem('listeningSpeed') || '1');
```

**Step 2: Replace the `speak()` function with three-tier fallback**

Replace the existing `speak()` function (lines 128-158) with:

```javascript
// Three-tier audio playback: cached audio → network audio → Web Speech API
async function speak(sentenceId, text) {
    // Stop any current playback
    stopPlayback();

    const audioUrl = `./audio/${sentenceId}.mp3`;

    try {
        const response = await fetch(audioUrl);
        if (!response.ok) throw new Error('No audio file');
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        currentAudio = new Audio(url);
        currentAudio.playbackRate = playbackSpeed;

        // Visual feedback
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
        // Fallback to Web Speech API
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
    utterance.rate = playbackSpeed * 0.9; // 0.9 base rate for TTS
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
```

**Step 3: Add autoplay to showNextCard()**

Replace the `showNextCard()` function (lines 291-313) — add autoplay at the end:

```javascript
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
```

**Step 4: Update flipCard() to use stopPlayback()**

Replace lines 317-327:
```javascript
function flipCard() {
    isFlipped = !isFlipped;
    elements.card.classList.toggle('flipped');
    stopPlayback();
}
```

**Step 5: Update play button click and keyboard handlers to pass sentenceId**

In `setupEventListeners()`, update the play button click handler (lines 378-388):
```javascript
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
```

Update the spacebar keyboard handler (lines 440-448):
```javascript
        if (e.key === ' ' && !isFlipped) {
            e.preventDefault();
            if (currentSentence) {
                speak(currentSentence.id, currentSentence.french);
                if (!playHintFaded) {
                    playHintFaded = true;
                    elements.playHint.classList.add('faded');
                }
            }
        }
```

**Step 6: Add speed toggle button to listening.html**

In `listening.html`, add the speed toggle after the play-hint div (after line 53):
```html
                            <div class="speed-toggle" id="speed-toggle">1x</div>
```

Add the DOM reference in `listening.js` elements object:
```javascript
    speedToggle: document.getElementById('speed-toggle'),
```

Add speed toggle click handler in `setupEventListeners()`:
```javascript
    // Speed toggle
    elements.speedToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        playbackSpeed = playbackSpeed === 1 ? 0.75 : 1;
        localStorage.setItem('listeningSpeed', String(playbackSpeed));
        elements.speedToggle.textContent = playbackSpeed === 1 ? '1x' : '0.75x';
        // Apply to current audio if playing
        if (currentAudio) currentAudio.playbackRate = playbackSpeed;
    });
```

Initialize speed toggle display after `setupEventListeners()` call in `init()`:
```javascript
    elements.speedToggle.textContent = playbackSpeed === 1 ? '1x' : '0.75x';
```

**Step 7: Add speed toggle styles to listening.css**

```css
/* Speed Toggle */
.speed-toggle {
    position: absolute;
    bottom: 15px;
    right: 15px;
    background: rgba(102, 126, 234, 0.15);
    color: #667eea;
    font-size: 0.8rem;
    font-weight: 700;
    padding: 6px 12px;
    border-radius: 15px;
    cursor: pointer;
    transition: background 0.2s ease;
}

.speed-toggle:active {
    background: rgba(102, 126, 234, 0.3);
}
```

Also add `position: relative;` to `.card-front` if not already present.

**Step 8: Commit**

```bash
git add listening.js listening.html listening.css
git commit -m "feat: three-tier audio playback with autoplay and speed control"
```

---

### Task 4: Settings Page — Audio Download Section

**Files:**
- Modify: `settings.html` (add new section between Updates and Cache Management)
- Modify: `settings.js` (add audio download logic)
- Modify: `settings.css` (add progress bar styles)

**Step 1: Add Audio Files section to settings.html**

Insert after the Updates section closing `</div>` (after line 36), before Cache Management:

```html
            <div class="settings-section">
                <h2>Audio Files</h2>
                <p class="section-description">
                    Download audio files for offline listening practice.
                    Files are also cached automatically as you practice.
                </p>
                <div id="audio-status" class="audio-status-line">Checking audio files...</div>
                <div class="progress-container hidden" id="progress-container">
                    <div class="progress-bar" id="progress-bar"></div>
                    <div class="progress-text" id="progress-text">0%</div>
                </div>
                <button id="download-audio-btn" class="action-btn" disabled>
                    <span class="btn-icon">🔊</span>
                    <span class="btn-text">Download All Audio</span>
                </button>
                <div id="download-status" class="status-message"></div>
            </div>
```

**Step 2: Add progress bar styles to settings.css**

```css
/* Audio download */
.audio-status-line {
    font-size: 0.9rem;
    color: #666;
    margin-bottom: 15px;
    text-align: center;
}

.progress-container {
    width: 100%;
    height: 8px;
    background: #e0e0e0;
    border-radius: 4px;
    margin-bottom: 15px;
    overflow: hidden;
    position: relative;
}

.progress-bar {
    height: 100%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 4px;
    width: 0%;
    transition: width 0.3s ease;
}

.progress-text {
    position: absolute;
    top: -20px;
    right: 0;
    font-size: 0.75rem;
    color: #666;
}
```

**Step 3: Add audio download logic to settings.js**

Add DOM elements at the top:
```javascript
const downloadAudioBtn = document.getElementById('download-audio-btn');
const audioStatusEl = document.getElementById('audio-status');
const progressContainer = document.getElementById('progress-container');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const downloadStatus = document.getElementById('download-status');
```

Add event listener in `init()`:
```javascript
    downloadAudioBtn.addEventListener('click', handleDownloadAudio);
```

Call `checkAudioStatus()` at the end of `init()` (after `await loadStats()`):
```javascript
    await checkAudioStatus();
```

Add the functions:
```javascript
// Check how many audio files are cached
async function checkAudioStatus() {
    try {
        await initDB();
        const response = await fetch('./sentences.json', { cache: 'no-cache' });
        const data = await response.json();
        const audioCategories = data.audioCategories || [];
        const audioSentences = data.sentences.filter(s => audioCategories.includes(s.category));

        if (audioSentences.length === 0) {
            audioStatusEl.textContent = 'No audio files available yet';
            return;
        }

        let cached = 0;
        const cache = await caches.open(
            (await caches.keys()).find(k => k.startsWith('french-conjugation')) || 'check'
        );

        for (const s of audioSentences) {
            const match = await cache.match(`./audio/${s.id}.mp3`);
            if (match) cached++;
        }

        audioStatusEl.textContent = `${cached} of ${audioSentences.length} audio files cached`;
        downloadAudioBtn.disabled = false;

        if (cached === audioSentences.length) {
            downloadAudioBtn.querySelector('.btn-text').textContent = 'All Audio Downloaded';
            downloadAudioBtn.disabled = true;
        }
    } catch (e) {
        audioStatusEl.textContent = 'Could not check audio status';
        downloadAudioBtn.disabled = false;
    }
}

// Download all missing audio files
async function handleDownloadAudio() {
    downloadAudioBtn.disabled = true;
    progressContainer.classList.remove('hidden');

    try {
        const response = await fetch('./sentences.json', { cache: 'no-cache' });
        const data = await response.json();
        const audioCategories = data.audioCategories || [];
        const audioSentences = data.sentences.filter(s => audioCategories.includes(s.category));

        const cacheName = (await caches.keys()).find(k => k.startsWith('french-conjugation'));
        const cache = await caches.open(cacheName || 'french-conjugation-audio');

        let downloaded = 0;
        let skipped = 0;
        const total = audioSentences.length;

        for (const s of audioSentences) {
            const url = `./audio/${s.id}.mp3`;
            const existing = await cache.match(url);
            if (existing) {
                skipped++;
            } else {
                try {
                    const audioResponse = await fetch(url);
                    if (audioResponse.ok) {
                        await cache.put(url, audioResponse);
                        downloaded++;
                    }
                } catch (e) {
                    // Skip failed downloads
                }
            }

            const progress = Math.round(((downloaded + skipped) / total) * 100);
            progressBar.style.width = `${progress}%`;
            progressText.textContent = `${downloaded + skipped}/${total}`;
        }

        progressContainer.classList.add('hidden');
        showDownloadStatus(`Downloaded ${downloaded} new files (${skipped} already cached)`, 'success');
        audioStatusEl.textContent = `${downloaded + skipped} of ${total} audio files cached`;

        if (downloaded + skipped === total) {
            downloadAudioBtn.querySelector('.btn-text').textContent = 'All Audio Downloaded';
        } else {
            downloadAudioBtn.disabled = false;
        }
    } catch (e) {
        progressContainer.classList.add('hidden');
        showDownloadStatus('Download failed. Check your internet connection.', 'error');
        downloadAudioBtn.disabled = false;
    }
}

function showDownloadStatus(message, type) {
    downloadStatus.textContent = message;
    downloadStatus.className = `status-message ${type}`;
}
```

**Step 4: Commit**

```bash
git add settings.html settings.js settings.css
git commit -m "feat: add audio download section to settings page"
```

---

### Task 5: Update sentences.json and Version Bumps

**Files:**
- Modify: `sentences.json` (add `audioCategories` field)
- Modify: `shared.js` (bump APP_VERSION)
- Modify: `sw.js` (already bumped in Task 2)
- Modify: `version.json` (match APP_VERSION)

**Step 1: Add audioCategories to sentences.json**

Add after the `"version"` line:
```json
  "audioCategories": [],
```

(Empty initially — the generation script will populate this after audio is generated.)

**Step 2: Bump versions**

- `shared.js`: `APP_VERSION` = `'2.4.0'`
- `sw.js`: `CACHE_NAME` = `'french-conjugation-v44'` (already done in Task 2)
- `version.json`: `"version": "2.4.0"`

**Step 3: Commit and push**

```bash
git add sentences.json shared.js sw.js version.json
git commit -m "feat: add audioCategories field, bump to v2.4.0"
git push origin main
```

---

### Task 6: Generate First Batch of Audio (Manual Step)

This is a manual step for the user. The plan documents it for reference.

**Step 1: Set up Python environment**

```bash
cd scripts
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env and add ELEVENLABS_API_KEY
```

**Step 2: Dry run to check character count**

```bash
python generate_audio.py --categories greetings,restaurant,shopping,directions,travel,phone --dry-run
```

Verify total is under 10,000 characters.

**Step 3: Generate audio (pick a voice first)**

```bash
# List voices to find a good French one
python -c "
from elevenlabs.client import ElevenLabs; import os; from dotenv import load_dotenv; load_dotenv()
c = ElevenLabs(api_key=os.getenv('ELEVENLABS_API_KEY'))
for v in c.voices.get_all().voices:
    print(f'{v.voice_id}: {v.name} ({v.labels})')
"
```

Pick a French voice and run:
```bash
python generate_audio.py --categories greetings,restaurant,shopping,directions,travel,phone --voice-id CHOSEN_VOICE_ID
```

**Step 4: Commit audio files**

```bash
cd ..
git add audio/ sentences.json
git commit -m "feat: add audio files for first 6 categories"
git push origin main
```

**Step 5: Month 2 — generate remaining categories**

```bash
python generate_audio.py --categories hotel,doctor,weather,work,family,emergencies --voice-id CHOSEN_VOICE_ID
cd ..
git add audio/ sentences.json
git commit -m "feat: add audio files for remaining 6 categories"
git push origin main
```
