import React, { createContext, useState, useContext } from 'react';

const SyncContext = createContext();

export function SyncProvider({ children }) {
  const [status, setStatus] = useState('idle');

  const value = {
    status,
    setStatus,
  };

  return (
    <SyncContext.Provider value={value}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within SyncProvider');
  }
  return context;
}
