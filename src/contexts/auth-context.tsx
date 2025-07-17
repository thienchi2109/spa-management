'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Staff } from '@/lib/types';
import { getCollectionData } from '@/lib/sheets-utils';

interface AuthContextType {
  currentUser: Staff | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  refreshAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Staff | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [allStaff, setAllStaff] = useState<Staff[]>([]);

  // Load staff data once on mount
  useEffect(() => {
    const loadStaffData = async () => {
      try {
        const staffData = await getCollectionData<Staff>('staff');
        setAllStaff(staffData);
      } catch (error) {
        console.error('Error loading staff data:', error);
      }
    };

    loadStaffData();
  }, []);

  // Check auth whenever allStaff changes (after data load)
  useEffect(() => {
    const checkAuth = () => {
      const isLoggedIn = localStorage.getItem('isLoggedIn');
      const staffId = localStorage.getItem('staffId');
      const sessionExpiration = localStorage.getItem('sessionExpiration');

      // Check if session has expired
      if (sessionExpiration) {
        const expirationTime = parseInt(sessionExpiration);
        const currentTime = new Date().getTime();
        
        if (currentTime > expirationTime) {
          // Session expired, clear all data
          localStorage.removeItem('isLoggedIn');
          localStorage.removeItem('staffId');
          localStorage.removeItem('sessionExpiration');
          setCurrentUser(null);
          setIsLoading(false);
          return;
        }
      }

      if (isLoggedIn === 'true' && staffId && allStaff.length > 0) {
        const user = allStaff.find(staff => staff.id === staffId);
        if (user) {
          setCurrentUser(user);
        } else {
          // Invalid user ID, clear localStorage
          localStorage.removeItem('isLoggedIn');
          localStorage.removeItem('staffId');
          localStorage.removeItem('sessionExpiration');
          setCurrentUser(null);
        }
      } else {
        // No valid session or staff data not loaded yet
        setCurrentUser(null);
      }
      
      // Only set loading to false when we have staff data OR when there's no login session
      if (allStaff.length > 0 || (isLoggedIn !== 'true' || !staffId)) {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Set up periodic session check (every 5 minutes)
    const sessionCheckInterval = setInterval(checkAuth, 5 * 60 * 1000);

    // Listen for storage changes (when user logs in from another tab or after login)
    const handleStorageChange = () => {
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(sessionCheckInterval);
    };
  }, [allStaff]);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Authentication against loaded staff data
    const user = allStaff.find(staff =>
      staff.email === email && staff.password === password
    );

    if (user) {
      setCurrentUser(user);
      // Set session with expiration (24 hours)
      const expirationTime = new Date().getTime() + (24 * 60 * 60 * 1000); // 24 hours
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('staffId', user.id);
      localStorage.setItem('sessionExpiration', expirationTime.toString());
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('staffId');
    localStorage.removeItem('sessionExpiration');
  };

  const refreshAuth = () => {
    if (allStaff.length === 0) return;

    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const staffId = localStorage.getItem('staffId');

    if (isLoggedIn === 'true' && staffId) {
      const user = allStaff.find(staff => staff.id === staffId);
      if (user) {
        setCurrentUser(user);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, isLoading, refreshAuth }}>
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

// Helper function to check if user has admin role
export function useIsAdmin() {
  const { currentUser } = useAuth();
  return currentUser?.role === 'admin';
}
