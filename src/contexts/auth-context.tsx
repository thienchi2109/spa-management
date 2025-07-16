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

  // Check auth whenever allStaff changes (after Firebase load)
  useEffect(() => {
    if (allStaff.length === 0) return; // Wait for staff data to load

    const checkAuth = () => {
      const isLoggedIn = localStorage.getItem('isLoggedIn');
      const staffId = localStorage.getItem('staffId');

      if (isLoggedIn === 'true' && staffId) {
        const user = allStaff.find(staff => staff.id === staffId);
        if (user) {
          setCurrentUser(user);
        } else {
          localStorage.removeItem('isLoggedIn');
          localStorage.removeItem('staffId');
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setIsLoading(false);
    };

    checkAuth();

    // Listen for storage changes (when user logs in from another tab or after login)
    const handleStorageChange = () => {
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [allStaff]);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Authentication against loaded staff data (includes Firebase data)
    const user = allStaff.find(staff =>
      staff.email === email && staff.password === password
    );

    if (user) {
      setCurrentUser(user);
      // Use existing localStorage structure
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('staffId', user.id);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('staffId');
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
