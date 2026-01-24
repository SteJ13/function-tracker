import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { syncOfflineQueue } from '@services/syncEngine';
import { getQueue } from '@services/offlineQueue';

/**
 * NetworkContext - Global network state management
 * 
 * Usage:
 * 1. Wrap app with <NetworkProvider>
 * 2. Use const { isOnline } = useNetwork() in any component
 */
const NetworkContext = createContext();

export function NetworkProvider({ children }) {
  const [isOnline, setIsOnline] = useState(true);
  const isSyncingRef = useRef(false);
  const wasOfflineRef = useRef(false);

  // Sync offline queue when transitioning from offline to online
  const handleSync = useCallback(async () => {
    if (isSyncingRef.current) return; // Prevent concurrent syncs

    isSyncingRef.current = true;
    try {
      await syncOfflineQueue();
    } catch (error) {
      console.error('[NetworkContext] Sync failed:', error);
    } finally {
      isSyncingRef.current = false;
    }
  }, []);

  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener(async state => {
      const nowOnline = state.isConnected ?? true;
      const wasOffline = wasOfflineRef.current;

      setIsOnline(nowOnline);
      wasOfflineRef.current = !nowOnline;

      // Trigger sync on offline → online transition
      if (!wasOffline && nowOnline) {
        const queue = await getQueue();
        if (queue && queue.length > 0) {
          handleSync();
        }
      }
    });

    // Check initial connection state
    NetInfo.fetch().then(state => {
      const isConnected = state.isConnected ?? true;
      setIsOnline(isConnected);
      wasOfflineRef.current = !isConnected;
    });

    // Cleanup listener on unmount
    return () => {
      unsubscribe();
    };
  }, [handleSync]);

  const value = {
    isOnline,
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
}

/**
 * useNetwork - Hook to access network context
 * 
 * Returns: { isOnline: boolean }
 */
export function useNetwork() {
  const context = React.useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within NetworkProvider');
  }
  return context;
}
