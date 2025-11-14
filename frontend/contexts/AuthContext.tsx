'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';
import { getAccessToken, removeTokens } from '@/lib/auth';
import axiosInstance from '@/lib/axios';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = getAccessToken();
      if (token) {
        try {
          const response = await axiosInstance.get('/auth/profile');
          setUser(response.data);
        } catch (error) {
          console.error('Failed to load user:', error);
          removeTokens();
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const logout = () => {
    removeTokens();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
