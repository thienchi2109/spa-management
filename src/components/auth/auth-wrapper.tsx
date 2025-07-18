'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useAuthMonitor } from '@/hooks/use-auth-monitor';
import { MainLayout } from '@/components/layout/main-layout';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const { currentUser, isLoading, refreshAuth } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  // Enable security monitoring
  useAuthMonitor();

  useEffect(() => {
    // Wait until loading is complete before doing anything
    if (isLoading) {
      return;
    }

    const isAuthPage = pathname === '/login';

    // If user is not logged in and not on the login page, redirect to login
    if (!currentUser && !isAuthPage) {
      console.log('User not authenticated, redirecting to login');
      router.replace('/login'); // Use replace instead of push to prevent back navigation
    }

    // If user is logged in and tries to access the login page, redirect to home
    if (currentUser && isAuthPage) {
      console.log('User already authenticated, redirecting to home');
      router.replace('/'); // Use replace instead of push
    }
  }, [currentUser, isLoading, router, pathname]);

  // Add focus event listener to refresh auth when user returns to tab
  useEffect(() => {
    const handleFocus = () => {
      // Only refresh if user is logged in
      if (currentUser) {
        console.log('Page focused, refreshing authentication');
        refreshAuth();
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden && currentUser) {
        console.log('Page became visible, refreshing authentication');
        refreshAuth();
      }
    };

    // Check auth when page gains focus or becomes visible
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentUser, refreshAuth]);

  // Periodic auth refresh every 5 minutes
  useEffect(() => {
    if (!currentUser) return;

    const refreshInterval = setInterval(() => {
      console.log('Periodic auth refresh');
      refreshAuth();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(refreshInterval);
  }, [currentUser, refreshAuth]);

  // While authentication status is loading, show a full-screen loader
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Đang kiểm tra đăng nhập...</p>
        </div>
      </div>
    );
  }

  // If not logged in and on the login page, show the children (Login page)
  if (!currentUser && pathname === '/login') {
    return <>{children}</>;
  }

  // If logged in and not on the login page, show the children within the main layout
  if (currentUser && pathname !== '/login') {
    return <MainLayout>{children}</MainLayout>;
  }

  // In other cases (like redirecting), return null to avoid rendering anything
  return null;
}