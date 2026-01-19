import React, { createContext, useEffect, useState } from 'react';
import { getUser, saveUser, removeUser } from '@utils/authStorage';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check stored user on app start
  useEffect(() => {
    const loadUser = async () => {
      const storedUser = await getUser();
      setUser(storedUser);
      setLoading(false);
    };

    loadUser();
  }, []);

  // Mock login
  const login = (username, password) => {
    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        if (username === 'admin' && password === 'admin') {
          const userData = { username: 'admin' };
          await saveUser(userData);
          setUser(userData);
          resolve(userData);
        } else {
          reject('Invalid credentials');
        }
      }, 2000);
    });
  };

  const logout = async () => {
    await removeUser();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
