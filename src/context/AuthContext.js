import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@services/supabaseClient';

export const AuthContext = createContext(null);
const AUTH_BOOTSTRAP_TIMEOUT_MS = 3500;

function syncAutoRefresh(activeSession) {
  if (activeSession) {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
}

function withTimeout(promise, timeoutMs, timeoutMessage) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);

    promise
      .then(value => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch(error => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

/**
 * Clear all offline cache on logout
 */
async function clearOfflineCache() {
  try {
    // Clear function cache
    await AsyncStorage.removeItem('functions_cache');
    // Clear categories cache
    await AsyncStorage.removeItem('categories_cache');
    // Clear any other offline data
    await AsyncStorage.removeItem('offline_queue');
    console.log('[AuthContext] Offline cache cleared on logout');
  } catch (err) {
    console.error('[AuthContext] Failed to clear offline cache:', err);
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize session on app load and subscribe to auth changes
  useEffect(() => {
    let authListener;
    let isMounted = true;

    const initAuth = async () => {
      authListener = supabase.auth.onAuthStateChange((_event, newSession) => {
        syncAutoRefresh(newSession);
        if (!isMounted) return;
        setSession(newSession);
        setUser(newSession?.user || null);
      }).data?.subscription;

      try {
        const { data, error } = await withTimeout(
          supabase.auth.getSession(),
          AUTH_BOOTSTRAP_TIMEOUT_MS,
          'Supabase auth bootstrap timeout'
        );

        if (error) throw error;

        const currentSession = data?.session || null;
        syncAutoRefresh(currentSession);
        if (!isMounted) return;
        setSession(currentSession);
        setUser(currentSession?.user || null);
      } catch (err) {
        console.warn('Auth init fallback to guest:', err?.message || err);
        syncAutoRefresh(null);
        if (!isMounted) return;
        setSession(null);
        setUser(null);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      isMounted = false;
      if (authListener) {
        authListener.unsubscribe();
      }
    };
  }, []);

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    syncAutoRefresh(data.session);
    setSession(data.session);
    setUser(data.session?.user || null);
    return data;
  };

  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    syncAutoRefresh(data.session);
    setSession(data.session);
    setUser(data.session?.user || null);
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    // Clear offline cache on logout
    await clearOfflineCache();

    syncAutoRefresh(null);
    setSession(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
