import { useState } from 'react';
import { useRemoteStorage } from '../hooks/useRemoteStorage';

function formatTime(ms: number | null): string {
  if (ms == null) return 'never';
  const diff = Date.now() - ms;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(ms).toLocaleDateString();
}

export function SyncSection() {
  const { connected, connecting, userAddress, lastSyncAt, error, connect, disconnect } = useRemoteStorage();
  const [address, setAddress] = useState('');

  const onConnect = () => {
    const trimmed = address.trim();
    if (trimmed) connect(trimmed);
  };

  return (
    <section>
      <h2 className="mb-4 text-sm font-medium text-slate-500 dark:text-slate-400">Sync</h2>
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        {connected ? (
          <>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Account</span>
                <span className="font-medium">{userAddress ?? 'connected'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Last sync</span>
                <span className="font-medium">{formatTime(lastSyncAt)}</span>
              </div>
            </div>
            <button
              onClick={disconnect}
              className="w-full rounded-xl bg-slate-100 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
            >
              Disconnect
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Enter your remoteStorage address (e.g. <code>you@5apps.com</code>).
            </p>
            <input
              type="email"
              autoComplete="off"
              spellCheck={false}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="user@provider"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            />
            {error && <p className="text-xs text-rose-500">{error}</p>}
            <button
              onClick={onConnect}
              disabled={connecting || !address.trim()}
              className="w-full rounded-xl bg-indigo-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-600 disabled:opacity-50"
            >
              {connecting ? 'Connecting…' : 'Connect'}
            </button>
          </>
        )}
      </div>
    </section>
  );
}

