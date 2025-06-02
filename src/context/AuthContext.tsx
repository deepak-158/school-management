'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, LoginForm, AuthContextType } from '@/lib/types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔍 AuthContext: Checking for existing session...');
    // Check for existing session on mount
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');
    
    console.log('🔍 AuthContext: Token exists?', !!token);
    console.log('🔍 AuthContext: UserData exists?', !!userData);
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        console.log('🔍 AuthContext: Parsed user data:', parsedUser);
        const userWithToken = { ...parsedUser, token };
        console.log('🔍 AuthContext: Setting user:', userWithToken);
        setUser(userWithToken);
      } catch (error) {
        console.error('🔍 AuthContext: Error parsing user data:', error);
        // Clear invalid data
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
      }
    } else {
      console.log('🔍 AuthContext: No existing session found');
    }
    
    console.log('🔍 AuthContext: Setting loading to false');
    setLoading(false);
  }, []);

  const login = async (credentials: LoginForm): Promise<boolean> => {
    console.log('🔍 AuthContext: Login attempt with:', credentials.username);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const result = await response.json();
      console.log('🔍 AuthContext: Login response:', result);

      if (result.success && result.data) {
        const authUser = result.data as AuthUser;
        console.log('🔍 AuthContext: Setting user after login:', authUser);
        setUser(authUser);
        
        // Store in localStorage
        localStorage.setItem('auth_token', authUser.token);
        const { token, ...userWithoutToken } = authUser;
        localStorage.setItem('user_data', JSON.stringify(userWithoutToken));
        console.log('🔍 AuthContext: Stored in localStorage:', userWithoutToken);
        
        return true;
      }
      
      console.log('🔍 AuthContext: Login failed - invalid response');
      return false;
    } catch (error) {
      console.error('🔍 AuthContext: Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    window.location.href = '/login';
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    loading,
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
