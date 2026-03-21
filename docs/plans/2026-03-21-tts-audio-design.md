# TTS Audio Improvement Design

## Problem
Android Web Speech API produces robotic, poorly-pronounced French that's too fast for A2 learners. The listening mode needs higher-quality audio.

## Solution
Pre-record all sentences using ElevenLabs TTS, host MP3s on GitHub Pages alongside the app, fall back to Web Speech API when offline and uncached.

## Audio Generation

**Script:** `scripts/generate_audio.py`
- Reads `sentences.json`, generates MP3 per sentence via ElevenLabs SDK
- Output: `audio/{sentence_id}.mp3` (e.g., `audio/greetings_001.mp3`)
- Model: `eleven_multilingual_v2` for best French quality
- Output format: MP3, 44.1kHz, 128kbps (~15-25KB per sentence)
- Skips files that already exist (idempotent)
- `--categories` flag for partial generation (free tier = 10K chars/month, need 2 batches)
- Batch 1 (month 1): 6 categories (~9K chars)
- Batch 2 (month 2): remaining 6 categories (~9K chars)
- Prints running character count to track against limit
- API key via `.env` file (in `.gitignore`)
- Updates `sentences.json` top-level `audioCategories` array after generation

## File Hosting & Caching

**Storage:** `audio/` folder in repo, served via GitHub Pages.

**Service Worker strategy for `/audio/*.mp3`:**
- Cache-first: serve from SW cache if available, else fetch from network and cache
- NOT pre-cached in `urlsToCache` (avoids 7MB upfront download)
- Audio cached progressively as user practices

**Three-tier playback fallback:**
1. SW cache (instant)
2. Network fetch (cache result for next time)
3. Web Speech API (offline + uncached)

## Playback Integration

**Autoplay:** New card appears -> audio plays automatically. Play button available for manual replays.

**Speed control:** Toggle 0.75x / 1x in listening UI. Persistent via localStorage. Applies to both MP3 (`audio.playbackRate`) and Web Speech API (`utterance.rate`).

**Flow per card:**
1. New card appears -> autoplay
2. User taps play button to replay (unlimited)
3. User taps card to flip -> audio stops, answer shown
4. Swipe right/left -> next card -> autoplay again

## Settings Page

**New "Audio Files" section:**
- Status: "X of Y audio files cached"
- "Download All Audio" button with progress bar ("Downloading... 45/180")
- Only attempts files for categories listed in `audioCategories`
- 404s (not generated yet) skipped silently
- Note: "Audio files are also cached automatically as you practice"
- Clear Cache also clears cached audio

## sentences.json Changes

Add top-level field:
```json
{
  "version": "1.2.0",
  "audioCategories": ["greetings", "restaurant", "shopping", "directions", "travel", "phone"],
  "categories": { ... },
  "sentences": [ ... ]
}
```

`audioCategories` lists which categories have audio files generated. Updated by the generation script.
