import { db } from './db';
import { getRemoteStorage, getModuleClient } from './remoteStorage';
import type { Stat, GateCompletion } from './types';

let isApplyingRemote = false;
let installed = false;

const pushQueue = new Set<string>();
let flushTimer: number | null = null;
let lastSyncAt: number | null = null;
const listeners = new Set<() => void>();

function notify(): void {
  for (const fn of listeners) fn();
}

export function onSyncStateChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getLastSyncAt(): number | null {
  return lastSyncAt;
}

function enqueue(key: string): void {
  if (isApplyingRemote) return;
  pushQueue.add(key);
  scheduleFlush();
}

function scheduleFlush(): void {
  if (flushTimer != null) return;
  flushTimer = window.setTimeout(() => {
    flushTimer = null;
    void flush();
  }, 2000);
}

async function flush(): Promise<void> {
  const rs = getRemoteStorage();
  if (!rs.connected) return;
  const client = getModuleClient();
  const items = Array.from(pushQueue);
  pushQueue.clear();

  for (const key of items) {
    try {
      if (key.startsWith('stats/')) {
        const id = key.slice('stats/'.length);
        const row = await db.stats.get(id);
        if (row) await client.storeObject('stat', `stats/${id}`, row);
        else await client.remove(`stats/${id}`);
      } else if (key.startsWith('gateCompletions/')) {
        const id = key.slice('gateCompletions/'.length);
        const row = await db.gateCompletions.get(id);
        if (row) await client.storeObject('gateCompletion', `gateCompletions/${id}`, row);
        else await client.remove(`gateCompletions/${id}`);
      }
    } catch {
      pushQueue.add(key);
    }
  }

  lastSyncAt = Date.now();
  notify();

  if (pushQueue.size > 0) scheduleFlush();
}

async function applyRemoteStat(id: string, value: unknown): Promise<void> {
  isApplyingRemote = true;
  try {
    if (value === undefined || value === null) {
      await db.stats.delete(id);
      return;
    }
    const incoming = value as Stat;
    if (typeof incoming.updatedAt !== 'number') return;
    const existing = await db.stats.get(id);
    if (!existing || incoming.updatedAt > existing.updatedAt) {
      await db.stats.put(incoming);
    }
  } finally {
    isApplyingRemote = false;
  }
}

async function applyRemoteGateCompletion(id: string, value: unknown): Promise<void> {
  isApplyingRemote = true;
  try {
    if (value === undefined || value === null) {
      await db.gateCompletions.delete(id);
      return;
    }
    const incoming = value as GateCompletion;
    if (typeof incoming.updatedAt !== 'number') return;
    const existing = await db.gateCompletions.get(id);
    if (!existing || incoming.updatedAt > existing.updatedAt) {
      await db.gateCompletions.put(incoming);
    }
  } finally {
    isApplyingRemote = false;
  }
}

function installDexieHooks(): void {
  db.stats.hook('creating', (primKey: string) => {
    enqueue(`stats/${primKey}`);
  });
  db.stats.hook('updating', (_mods, primKey: string) => {
    enqueue(`stats/${primKey}`);
    return undefined;
  });
  db.stats.hook('deleting', (primKey: string) => {
    enqueue(`stats/${primKey}`);
  });

  db.gateCompletions.hook('creating', (primKey: string) => {
    enqueue(`gateCompletions/${primKey}`);
  });
  db.gateCompletions.hook('updating', (_mods, primKey: string) => {
    enqueue(`gateCompletions/${primKey}`);
    return undefined;
  });
  db.gateCompletions.hook('deleting', (primKey: string) => {
    enqueue(`gateCompletions/${primKey}`);
  });
}

function installRemoteListener(): void {
  const client = getModuleClient();
  client.on('change', (e: unknown) => {
    const evt = e as { origin: string; relativePath: string; newValue: unknown };
    if (evt.origin === 'window') return;
    const path = evt.relativePath;
    if (path.startsWith('stats/')) {
      void applyRemoteStat(path.slice('stats/'.length), evt.newValue).then(() => {
        lastSyncAt = Date.now();
        notify();
      });
    } else if (path.startsWith('gateCompletions/')) {
      void applyRemoteGateCompletion(path.slice('gateCompletions/'.length), evt.newValue).then(() => {
        lastSyncAt = Date.now();
        notify();
      });
    }
  });
}

export function startSync(): void {
  if (installed) return;
  installed = true;

  const rs = getRemoteStorage();
  installDexieHooks();
  installRemoteListener();

  rs.on('connected', () => {
    notify();
    void flush();
  });
  rs.on('disconnected', () => { notify(); });
  rs.on('network-online', () => { void flush(); });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void flush();
  });
  window.addEventListener('beforeunload', () => { void flush(); });
}
