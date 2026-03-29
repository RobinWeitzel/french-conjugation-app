import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { APP_VERSION } from '../lib/constants';
import type { Verb, Sentence, VerbsData, SentencesData } from '../lib/types';

async function fetchAndUpdateVerbs(): Promise<void> {
  try {
    const response = await fetch('./words.json', { cache: 'no-cache' });
    if (!response.ok) return;
    const data: VerbsData = await response.json();

    const stored = await db.metadata.get('verbsVersion');
    if (stored?.value === data.version) return;

    await db.transaction('rw', db.verbs, db.metadata, async () => {
      await db.verbs.clear();
      await db.verbs.bulkPut(data.verbs);
      await db.metadata.put({ key: 'verbsVersion', value: data.version });
    });
  } catch {
    // Offline — use cached data
  }
}

async function fetchAndUpdateSentences(): Promise<void> {
  try {
    const response = await fetch('./sentences.json', { cache: 'no-cache' });
    if (!response.ok) return;
    const data: SentencesData = await response.json();

    const stored = await db.metadata.get('sentencesVersion');
    if (stored?.value === data.version) return;

    await db.transaction('rw', db.sentences, db.metadata, async () => {
      await db.sentences.clear();
      await db.sentences.bulkPut(data.sentences);
      await db.metadata.put({ key: 'sentencesVersion', value: data.version });
      await db.metadata.put({ key: 'sentenceCategories', value: JSON.stringify(data.categories) });
      await db.metadata.put({ key: 'audioCategories', value: JSON.stringify(data.audioCategories) });
    });
  } catch {
    // Offline — use cached data
  }
}

export function useVerbs(): Verb[] | undefined {
  useEffect(() => { fetchAndUpdateVerbs(); }, []);
  return useLiveQuery(() => db.verbs.toArray());
}

export function useSentences(categories?: string[]): Sentence[] | undefined {
  useEffect(() => { fetchAndUpdateSentences(); }, []);
  return useLiveQuery(() => {
    if (categories && categories.length > 0) {
      return db.sentences.where('category').anyOf(categories).toArray();
    }
    return db.sentences.toArray();
  }, [categories]);
}

export function useSentenceCategories(): Record<string, string> | undefined {
  useEffect(() => { fetchAndUpdateSentences(); }, []);
  return useLiveQuery(async () => {
    const stored = await db.metadata.get('sentenceCategories');
    if (stored?.value) return JSON.parse(stored.value) as Record<string, string>;
    return undefined;
  });
}

export function useAudioCategories(): string[] | undefined {
  useEffect(() => { fetchAndUpdateSentences(); }, []);
  return useLiveQuery(async () => {
    const stored = await db.metadata.get('audioCategories');
    if (stored?.value) return JSON.parse(stored.value) as string[];
    return undefined;
  });
}

export function useUpdateCheck() {
  const [updateAvailable, setUpdateAvailable] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const checkForUpdate = async () => {
    setChecking(true);
    try {
      const response = await fetch('./version.json', { cache: 'no-store' });
      if (!response.ok) return;
      const data = await response.json();
      if (data.version !== APP_VERSION) {
        setUpdateAvailable(data.version);
      }
    } catch {
      // Offline
    } finally {
      setChecking(false);
    }
  };

  const applyUpdate = async () => {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) await reg.unregister();
    }
    const cacheNames = await caches.keys();
    for (const name of cacheNames) await caches.delete(name);
    window.location.reload();
  };

  useEffect(() => { checkForUpdate(); }, []);

  return { updateAvailable, checking, checkForUpdate, applyUpdate };
}
