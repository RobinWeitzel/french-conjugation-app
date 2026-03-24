import { useState } from 'react';
import { PageLayout } from '../components/PageLayout';
import { Navigation } from '../components/Navigation';
import { ThemeToggle } from '../components/ThemeToggle';
import { useUpdateCheck } from '../hooks/useDatabase';
import { APP_VERSION } from '../lib/constants';
import { db } from '../lib/db';

export function Settings() {
  const { updateAvailable, checking, checkForUpdate, applyUpdate } = useUpdateCheck();
  const [clearing, setClearing] = useState(false);

  const clearAllData = async () => {
    setClearing(true);
    try {
      await db.delete();
      localStorage.clear();
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) await reg.unregister();
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
