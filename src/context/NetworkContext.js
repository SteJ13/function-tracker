import React, { createContext, useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

/**
 * NetworkContext - Global network state management
 * 
 * Provides: { isOnline: boolean }
 * 
 * Usage:
 * 1. Wrap app with <NetworkProvider>
 * 2. Use const { isOnline } = useNetwork() in any component
 */
const NetworkContext = createContext();

export function NetworkProvider({ children }) {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener(state => {
      const nowOnline = state.isConnected ?? true;
      setIsOnline(nowOnline);
    });

    // Check initial connection state
    NetInfo.fetch().then(state => {
      const isConnected = state.isConnected ?? true;
      setIsOnline(isConnected);
    });

    // Cleanup listener on unmount
    return () => {
      unsubscribe();
    };
  }, []);

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
