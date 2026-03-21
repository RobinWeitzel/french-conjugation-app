#!/usr/bin/env python3
"""Generate MP3 audio files for French sentences using ElevenLabs TTS."""

import json
import os
import sys
import argparse
from pathlib import Path
from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs

load_dotenv(Path(__file__).parent / ".env")

SENTENCES_FILE = Path(__file__).parent.parent / "sentences.json"
AUDIO_DIR = Path(__file__).parent.parent / "audio"
API_KEY = os.getenv("ELEVENLABS_API_KEY")

MODEL_ID = "eleven_multilingual_v2"
OUTPUT_FORMAT = "mp3_44100_128"


def get_french_voice(client):
    """Find a good French voice. Returns voice_id."""
    response = client.voices.get_all()
    for voice in response.voices:
        if "french" in (voice.labels or {}).get("accent", "").lower():
            return voice.voice_id
    if response.voices:
        return response.voices[0].voice_id
    raise RuntimeError("No voices available")


def main():
    parser = argparse.ArgumentParser(description="Generate French audio files")
    parser.add_argument("--categories", type=str, help="Comma-separated category keys to generate (default: all)")
    parser.add_argument("--voice-id", type=str, help="ElevenLabs voice ID to use (default: auto-select French voice)")
    parser.add_argument("--dry-run", action="store_true", help="Count characters without generating audio")
    args = parser.parse_args()

    if not API_KEY:
        print("Error: ELEVENLABS_API_KEY not set. Copy .env.example to .env and add your key.")
        sys.exit(1)

    with open(SENTENCES_FILE) as f:
        data = json.load(f)

    sentences = data["sentences"]
    categories_filter = None
    if args.categories:
        categories_filter = set(args.categories.split(","))
        sentences = [s for s in sentences if s["category"] in categories_filter]

    AUDIO_DIR.mkdir(exist_ok=True)

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

        with open(mp3_path, "wb") as f:
            for chunk in audio_generator:
                f.write(chunk)

    print(f"\nDone! Generated {len(to_generate)} files. Total characters used: {chars_used}")

    existing_audio_cats = set(data.get("audioCategories", []))
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
