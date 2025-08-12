'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // For testing purposes, create a mock user
    const mockUser = {
      uid: 'test-user-1',
      displayName: 'Test User',
      email: 'test@example.com'
    };
    
    setUser(mockUser);
    setLoading(false);
  }, []);

  const value = {
    user,
    loading,
    setUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 