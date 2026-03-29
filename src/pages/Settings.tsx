import { useState, useEffect, useCallback } from 'react';
import { PageLayout } from '../components/PageLayout';
import { Navigation } from '../components/Navigation';
import { ThemeToggle } from '../components/ThemeToggle';
import { useUpdateCheck } from '../hooks/useDatabase';
import { APP_VERSION } from '../lib/constants';
import { db } from '../lib/db';
import type { SentencesData } from '../lib/types';

function useAudioDownload() {
  const [totalAudio, setTotalAudio] = useState(0);
  const [cachedCount, setCachedCount] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  const checkStatus = useCallback(async () => {
    try {
      const response = await fetch('./sentences.json', { cache: 'no-cache' });
      const data: SentencesData = await response.json();
      const audioCategories = data.audioCategories ?? [];
      const audioSentences = data.sentences.filter((s) => audioCategories.includes(s.category));
      setTotalAudio(audioSentences.length);

      let cached = 0;
      const keys = await caches.keys();
      for (const s of audioSentences) {
        for (const key of keys) {
          const cache = await caches.open(key);
          const match = await cache.match(`./audio/${s.id}.mp3`);
          if (match) { cached++; break; }
        }
      }
      setCachedCount(cached);
    } catch {
      // Offline
    }
  }, []);

  useEffect(() => { checkStatus(); }, [checkStatus]);

  const downloadAll = useCallback(async () => {
    setDownloading(true);
    setProgress(0);
    try {
      const response = await fetch('./sentences.json', { cache: 'no-cache' });
      const data: SentencesData = await response.json();
      const audioCategories = data.audioCategories ?? [];
      const audioSentences = data.sentences.filter((s) => audioCategories.includes(s.category));

      const cache = await caches.open('audio-cache');
      let done = 0;

      for (const s of audioSentences) {
        const url = `./audio/${s.id}.mp3`;
        const existing = await cache.match(url);
        if (!existing) {
          try {
            const audioResponse = await fetch(url);
            if (audioResponse.ok) await cache.put(url, audioResponse);
          } catch {
            // Skip failed
          }
        }
        done++;
        setProgress(Math.round((done / audioSentences.length) * 100));
      }

      await checkStatus();
    } catch {
      // Error
    } finally {
      setDownloading(false);
    }
  }, [checkStatus]);

  return { totalAudio, cachedCount, downloading, progress, downloadAll, allCached: totalAudio > 0 && cachedCount >= totalAudio };
}

export function Settings() {
  const { updateAvailable, checking, checkForUpdate, applyUpdate } = useUpdateCheck();
  const [clearing, setClearing] = useState(false);
  const { totalAudio, cachedCount, downloading, progress, downloadAll, allCached } = useAudioDownload();

  const clearAllData = async () => {
    setClearing(true);
    try {
      await db.delete();
      localStorage.clear();
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) await reg.unregister();
      }
      const cacheNames = await caches.keys();
      for (const name of cacheNames) await caches.delete(name);
      window.location.reload();
    } catch {
      setClearing(false);
    }
  };

  const clearStats = async () => {
    await db.stats.clear();
    alert('Stats cleared successfully.');
  };

  return (
    <PageLayout>
      <Navigation title="Settings" rightElement={<ThemeToggle />} />

      <div className="mt-8 space-y-8">
        {/* App Info */}
        <section>
          <h2 className="mb-4 text-sm font-medium text-slate-500 dark:text-slate-400">App Info</h2>
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Version</span>
              <span className="font-medium">{APP_VERSION}</span>
            </div>
          </div>
        </section>

        {/* Updates */}
        <section>
          <h2 className="mb-4 text-sm font-medium text-slate-500 dark:text-slate-400">Updates</h2>
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            {updateAvailable ? (
              <div className="space-y-3">
                <p className="text-sm">
                  Version <span className="font-medium">{updateAvailable}</span> available
                </p>
                <button
                  onClick={applyUpdate}
                  className="w-full rounded-xl bg-indigo-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-600"
                >
                  Update Now
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {checking ? 'Checking...' : "You're up to date."}
                </p>
                <button
                  onClick={checkForUpdate}
                  disabled={checking}
                  className="w-full rounded-xl bg-slate-100 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 disabled:opacity-50 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                >
                  Check for Updates
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Audio */}
        <section>
          <h2 className="mb-4 text-sm font-medium text-slate-500 dark:text-slate-400">Audio</h2>
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {totalAudio > 0
                ? `${cachedCount} of ${totalAudio} audio files cached`
                : 'Checking audio status...'}
            </p>
            {downloading && (
              <div className="space-y-2">
                <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500">{progress}%</p>
              </div>
            )}
            <button
              onClick={downloadAll}
              disabled={downloading || allCached}
              className="w-full rounded-xl bg-slate-100 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 disabled:opacity-50 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
            >
              {allCached ? 'All Audio Downloaded' : downloading ? 'Downloading...' : 'Download All Audio'}
            </button>
          </div>
        </section>

        {/* Data Management */}
        <section>
          <h2 className="mb-4 text-sm font-medium text-slate-500 dark:text-slate-400">Data</h2>
          <div className="space-y-3">
            <button
              onClick={clearStats}
              className="w-full rounded-xl border border-slate-200 bg-white py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Reset All Progress
            </button>
            <button
              onClick={clearAllData}
              disabled={clearing}
              className="w-full rounded-xl border border-rose-200 bg-white py-3 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50 dark:border-rose-800 dark:bg-slate-800 dark:text-rose-400 dark:hover:bg-rose-500/10"
            >
              {clearing ? 'Clearing...' : 'Clear All Data & Cache'}
            </button>
          </div>
        </section>
      </div>
    </PageLayout>
  );
}
