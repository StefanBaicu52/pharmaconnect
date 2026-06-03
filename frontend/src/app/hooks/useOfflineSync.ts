import { useState, useEffect, useCallback, useRef } from 'react';
import {
  checkServerReachable,
  replaySyncQueue,
  getSyncQueue,
  type SyncOperation,
} from '../api';

interface UseOfflineSyncReturn {
  isOnline: boolean;
  isServerReachable: boolean;
  pendingOps: SyncOperation[];
  syncNow: () => Promise<{ replayed: number; failed: number }>;
}

/**
 * Silver challenge:
 * - Detects browser offline/online events
 * - Polls server reachability every 10s when online
 * - When reconnection detected, auto-replays the offline sync queue
 */
export function useOfflineSync(onSynced?: (result: { replayed: number; failed: number }) => void): UseOfflineSyncReturn {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isServerReachable, setIsServerReachable] = useState(true);
  const [pendingOps, setPendingOps] = useState<SyncOperation[]>([]);
  const wasOfflineRef = useRef(false);

  // Refresh pending ops count whenever the queue changes
  const refreshPending = useCallback(() => {
    setPendingOps(getSyncQueue());
  }, []);

  // Check server reachability and trigger sync if coming back online
  const checkAndSync = useCallback(async () => {
    const reachable = await checkServerReachable();
    setIsServerReachable(reachable);

    if (reachable && wasOfflineRef.current && getSyncQueue().length > 0) {
      wasOfflineRef.current = false;
      const result = await replaySyncQueue();
      refreshPending();
      onSynced?.(result);
    }

    if (!reachable) wasOfflineRef.current = true;
  }, [onSynced, refreshPending]);

  const syncNow = useCallback(async () => {
    const result = await replaySyncQueue();
    refreshPending();
    return result;
  }, [refreshPending]);

  useEffect(() => {
    const onOnline = () => {
      setIsOnline(true);
      checkAndSync();
    };
    const onOffline = () => {
      setIsOnline(false);
      setIsServerReachable(false);
      wasOfflineRef.current = true;
    };

    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);

    // Poll every 10s when online
    const poll = setInterval(checkAndSync, 10_000);
    checkAndSync(); // initial check

    return () => {
      window.removeEventListener('online',  onOnline);
      window.removeEventListener('offline', onOffline);
      clearInterval(poll);
    };
  }, [checkAndSync]);

  return { isOnline, isServerReachable, pendingOps, syncNow };
}
