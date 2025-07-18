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
  const [staffDataVersion, setStaffDataVersion] = useState<string>('');

  // Generate a hash of staff data for version checking
  const generateStaffDataVersion = (staffData: Staff[]) => {
    const staffString = JSON.stringify(staffData.map(s => ({ id: s.id, password: s.password, email: s.email })));
    return btoa(staffString).slice(0, 20); // Simple hash for version checking
  };

  // Load staff data once on mount
  useEffect(() => {
    const loadStaffData = async () => {
      try {
        const staffData = await getCollectionData<Staff>('staff');
        setAllStaff(staffData);
        
        // Check if staff data has changed since last session
        const newVersion = generateStaffDataVersion(staffData);
        const storedVersion = localStorage.getItem('staffDataVersion');
        
        if (storedVersion && storedVersion !== newVersion) {
          // Staff data has changed, invalidate all sessions
          console.log('Staff data changed, invalidating session');
          localStorage.removeItem('isLoggedIn');
          localStorage.removeItem('staffId');
          localStorage.removeItem('sessionExpiration');
          localStorage.removeItem('passwordVersion');
          setCurrentUser(null);
        }
        
        setStaffDataVersion(newVersion);
        localStorage.setItem('staffDataVersion', newVersion);
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
      const storedPasswordVersion = localStorage.getItem('passwordVersion');

      // Check if session has expired
      if (sessionExpiration) {
        const expirationTime = parseInt(sessionExpiration);
        const currentTime = new Date().getTime();
        
        if (currentTime > expirationTime) {
          // Session expired, clear all data
          console.log('Session expired, clearing data');
          localStorage.removeItem('isLoggedIn');
          localStorage.removeItem('staffId');
          localStorage.removeItem('sessionExpiration');
          localStorage.removeItem('passwordVersion');
          setCurrentUser(null);
          setIsLoading(false);
          return;
        }
      }

      if (isLoggedIn === 'true' && staffId && allStaff.length > 0) {
        const user = allStaff.find(staff => staff.id === staffId);
        if (user) {
          // Check if password version matches (to detect password changes)
          const currentPasswordVersion = btoa(user.password).slice(0, 10);
          
          if (storedPasswordVersion && storedPasswordVersion !== currentPasswordVersion) {
            // Password has been changed, invalidate session
            console.log('Password changed, invalidating session');
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('staffId');
            localStorage.removeItem('sessionExpiration');
            localStorage.removeItem('passwordVersion');
            setCurrentUser(null);
            setIsLoading(false);
            return;
          }
          
          // Update password version if not set
          if (!storedPasswordVersion) {
            localStorage.setItem('passwordVersion', currentPasswordVersion);
          }
          
          setCurrentUser(user);
        } else {
          // Invalid user ID, clear localStorage
          console.log('Invalid user ID, clearing data');
          localStorage.removeItem('isLoggedIn');
          localStorage.removeItem('staffId');
          localStorage.removeItem('sessionExpiration');
          localStorage.removeItem('passwordVersion');
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

    // Set up periodic session check (every 2 minutes for better security)
    const sessionCheckInterval = setInterval(checkAuth, 2 * 60 * 1000);

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
      
      // Generate password version for tracking changes
      const passwordVersion = btoa(user.password).slice(0, 10);
      
      // Set session with shorter expiration (2 hours instead of 24)
      const expirationTime = new Date().getTime() + (2 * 60 * 60 * 1000); // 2 hours
      
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('staffId', user.id);
      localStorage.setItem('sessionExpiration', expirationTime.toString());
      localStorage.setItem('passwordVersion', passwordVersion);
      localStorage.setItem('staffDataVersion', staffDataVersion);
      
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('staffId');
    localStorage.removeItem('sessionExpiration');
    localStorage.removeItem('passwordVersion');
    localStorage.removeItem('staffDataVersion');
  };

  const refreshAuth = async () => {
    if (allStaff.length === 0) return;

    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const staffId = localStorage.getItem('staffId');

    if (isLoggedIn === 'true' && staffId) {
      // Reload staff data to get latest passwords
      try {
        const latestStaffData = await getCollectionData<Staff>('staff');
        const user = latestStaffData.find(staff => staff.id === staffId);
        
        if (user) {
          const storedPasswordVersion = localStorage.getItem('passwordVersion');
          const currentPasswordVersion = btoa(user.password).slice(0, 10);
          
          if (storedPasswordVersion && storedPasswordVersion !== currentPasswordVersion) {
            // Password changed, force logout
            logout();
            return;
          }
          
          setCurrentUser(user);
          setAllStaff(latestStaffData);
          
          // Update staff data version
          const newVersion = generateStaffDataVersion(latestStaffData);
          setStaffDataVersion(newVersion);
          localStorage.setItem('staffDataVersion', newVersion);
        } else {
          // User no longer exists, logout
          logout();
        }
      } catch (error) {
        console.error('Error refreshing auth:', error);
        // On error, logout for security
        logout();
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
