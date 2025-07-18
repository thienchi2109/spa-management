import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { getCollectionData } from '@/lib/sheets-utils';
import type { Staff } from '@/lib/types';

/**
 * Hook to monitor authentication security events
 * - Detects password changes from external sources
 * - Monitors for suspicious activity
 * - Handles automatic logout on security breaches
 */
export function useAuthMonitor() {
  const { currentUser, logout } = useAuth();
  const { toast } = useToast();
  const lastPasswordCheckRef = useRef<string>('');
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!currentUser) {
      // Clear any existing interval when user logs out
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
      return;
    }

    // Function to check if password has been changed externally
    const checkPasswordChanges = async () => {
      try {
        const staffData = await getCollectionData<Staff>('staff');
        const latestUserData = staffData.find(staff => staff.id === currentUser.id);
        
        if (!latestUserData) {
          // User has been deleted
          toast({
            variant: "destructive",
            title: "Tài khoản không tồn tại",
            description: "Tài khoản của bạn đã bị xóa. Vui lòng liên hệ quản trị viên.",
            duration: 10000,
          });
          logout();
          return;
        }

        // Check if password has changed
        if (lastPasswordCheckRef.current && lastPasswordCheckRef.current !== latestUserData.password) {
          toast({
            variant: "destructive",
            title: "Mật khẩu đã thay đổi",
            description: "Mật khẩu tài khoản của bạn đã được thay đổi từ nguồn khác. Vui lòng đăng nhập lại.",
            duration: 10000,
          });
          logout();
          return;
        }

        // Check if email has changed
        if (currentUser.email !== latestUserData.email) {
          toast({
            variant: "destructive", 
            title: "Thông tin tài khoản đã thay đổi",
            description: "Email tài khoản của bạn đã được thay đổi. Vui lòng đăng nhập lại.",
            duration: 10000,
          });
          logout();
          return;
        }

        // Update password reference for next check
        lastPasswordCheckRef.current = latestUserData.password;

      } catch (error) {
        console.error('Error checking password changes:', error);
        // On error, we should be cautious and potentially logout
        // But for now, we'll just log the error to avoid disrupting normal operation
      }
    };

    // Initial password check
    if (currentUser.password) {
      lastPasswordCheckRef.current = currentUser.password;
    }

    // Set up periodic checking (every 2 minutes)
    checkIntervalRef.current = setInterval(checkPasswordChanges, 2 * 60 * 1000);

    // Also check immediately if we don't have the initial password
    if (!lastPasswordCheckRef.current) {
      checkPasswordChanges();
    }

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
    };
  }, [currentUser, logout, toast]);

  // Monitor localStorage changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // If another tab logs out, this tab should also logout
      if (e.key === 'isLoggedIn' && e.newValue === null && currentUser) {
        toast({
          title: "Đăng xuất từ tab khác",
          description: "Bạn đã đăng xuất từ tab khác.",
          duration: 3000,
        });
        logout();
      }

      // If session expiration is cleared in another tab
      if (e.key === 'sessionExpiration' && e.newValue === null && currentUser) {
        logout();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [currentUser, logout, toast]);

  // Check for suspicious activity patterns
  useEffect(() => {
    if (!currentUser) return;

    // Track failed requests or unusual activity
    const trackSuspiciousActivity = () => {
      // This could be expanded to track:
      // - Multiple failed API requests
      // - Unusual access patterns
      // - Concurrent sessions from different locations
      // For now, it's a placeholder for future security enhancements
    };

    const activityInterval = setInterval(trackSuspiciousActivity, 5 * 60 * 1000); // Every 5 minutes
    
    return () => clearInterval(activityInterval);
  }, [currentUser]);
} 