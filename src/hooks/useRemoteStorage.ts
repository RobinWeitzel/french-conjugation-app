import { useCallback, useEffect, useState } from 'react';
import { getRemoteStorage } from '../lib/remoteStorage';
import { getLastSyncAt, onSyncStateChange } from '../lib/sync';

export interface RemoteStorageState {
  connected: boolean;
  connecting: boolean;
  userAddress: string | null;
  lastSyncAt: number | null;
  error: string | null;
}

export function useRemoteStorage() {
  const [state, setState] = useState<RemoteStorageState>(() => {
    const rs = getRemoteStorage();
    return {
      connected: rs.connected,
      connecting: false,
      userAddress: rs.remote?.userAddress ?? null,
      lastSyncAt: getLastSyncAt(),
      error: null,
    };
  });

  useEffect(() => {
    const rs = getRemoteStorage();

    const refresh = () => {
      setState((s) => ({
        ...s,
        connected: rs.connected,
        userAddress: rs.remote?.userAddress ?? null,
        lastSyncAt: getLastSyncAt(),
      }));
    };

    const onConnecting = () => setState((s) => ({ ...s, connecting: true, error: null }));
    const onConnected = () => setState((s) => ({ ...s, connecting: false, connected: true, userAddress: rs.remote?.userAddress ?? null, error: null }));
    const onDisconnected = () => setState((s) => ({ ...s, connecting: false, connected: false, userAddress: null }));
    const onError = (err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      setState((s) => ({ ...s, connecting: false, error: message }));
    };

    rs.on('connecting', onConnecting);
    rs.on('connected', onConnected);
    rs.on('disconnected', onDisconnected);
    rs.on('error', onError);

    const unsubSync = onSyncStateChange(refresh);
    return () => {
      unsubSync();
    };
  }, []);

  const connect = useCallback((userAddress: string) => {
    const rs = getRemoteStorage();
    setState((s) => ({ ...s, connecting: true, error: null }));
    rs.connect(userAddress);
  }, []);

  const disconnect = useCallback(() => {
    const rs = getRemoteStorage();
    rs.disconnect();
  }, []);

  return { ...state, connect, disconnect };
}
