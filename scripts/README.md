# Audio Generation Scripts

## Setup (one-time)

```bash
cd scripts
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env and add your ELEVENLABS_API_KEY
```

## Generate remaining audio files

When your ElevenLabs quota resets, run:

```bash
cd scripts
source venv/bin/activate
python generate_audio.py --categories weather,doctor,work,family,emergencies --voice-id Xb7hH8MSUJpSbSDYk0k2
```

This will:
- Pick up the missing `weather_030` automatically (skips existing files)
- Generate all 30 sentences for doctor, work, family, emergencies
- Update `audioCategories` in `sentences.json`

## Useful flags

```bash
# Dry run — check character count without generating
python generate_audio.py --categories doctor,work --dry-run

# Generate all categories (no filter)
python generate_audio.py --voice-id Xb7hH8MSUJpSbSDYk0k2

# Use a different voice
python generate_audio.py --voice-id YOUR_VOICE_ID
```

## After generating

```bash
cd ..
git add audio/ sentences.json
git commit -m "feat: add audio files for remaining categories"
git push origin main
```

Don't forget to bump `APP_VERSION` in `shared.js`, `CACHE_NAME` in `sw.js`, and `version.json`.

## Voice used

- **Alice** (Xb7hH8MSUJpSbSDYk0k2) — Clear, Engaging Educator, British accent
- Model: `eleven_multilingual_v2`
- Output: `mp3_44100_128`
