export const CACHE_PREFIX = 'frconj-';
export const LS_PREFIX = 'frconj:';

const LEGACY_LS_KEYS = [
  'theme',
  'practiceTtsMuted',
  'practiceDirection',
  'practiceShowInfinitive',
  'practiceTenses',
  'practiceGateOverrides',
  'listeningCategories',
  'listeningSpeed',
];

const LEGACY_CACHE_NAMES = ['data-cache', 'audio-cache'];

export function lsKey(name: string): string {
  return LS_PREFIX + name;
}

export function migrateLegacyLocalStorage(): void {
  for (const key of LEGACY_LS_KEYS) {
    const namespaced = LS_PREFIX + key;
    const legacy = localStorage.getItem(key);
    if (legacy !== null && localStorage.getItem(namespaced) === null) {
      localStorage.setItem(namespaced, legacy);
    }
    if (legacy !== null) localStorage.removeItem(key);
  }
}

export async function migrateLegacyCaches(): Promise<void> {
  if (!('caches' in self)) return;
  const keys = await caches.keys();
  await Promise.all(
    keys.filter((k) => LEGACY_CACHE_NAMES.includes(k)).map((k) => caches.delete(k))
  );
}

export async function clearAppCaches(): Promise<void> {
  const keys = await caches.keys();
  await Promise.all(
    keys.filter((k) => k.startsWith(CACHE_PREFIX)).map((k) => caches.delete(k))
  );
}

export function clearAppLocalStorage(): void {
  const toRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(LS_PREFIX)) toRemove.push(k);
  }
  toRemove.forEach((k) => localStorage.removeItem(k));
}

export async function unregisterAppServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  const reg = await navigator.serviceWorker.getRegistration();
  if (reg) await reg.unregister();
}
