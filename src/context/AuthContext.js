import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@services/supabaseClient';

export const AuthContext = createContext(null);

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

    const initAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        const currentSession = data?.session || null;
        setSession(currentSession);
        setUser(currentSession?.user || null);
      } catch (err) {
        console.error('Auth init error:', err);
      } finally {
        setLoading(false);
      }

      authListener = supabase.auth.onAuthStateChange((_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user || null);
      }).data?.subscription;
    };

    initAuth();

    return () => {
      if (authListener) {
        authListener.unsubscribe();
      }
    };
  }, []);

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    console.log('error: ', error);
    console.log('data: ', data);
    if (error) throw error;
    setSession(data.session);
    setUser(data.session?.user || null);
    return data;
  };

  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    setSession(data.session);
    setUser(data.session?.user || null);
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    // Clear offline cache on logout
    await clearOfflineCache();

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
