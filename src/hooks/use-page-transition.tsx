'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Hook to handle page transition states for better UX
 * Provides loading state during navigation
 */
export function usePageTransition() {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Start loading when pathname changes
    setIsLoading(true);
    
    // End loading after a short delay to allow page to render
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 150);

    return () => clearTimeout(timer);
  }, [pathname]);

  return { isLoading, pathname };
}

/**
 * Hook for managing async operations with loading states
 */
export function useAsyncOperation() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = async <T,>(
    operation: () => Promise<T>,
    options?: {
      onSuccess?: (result: T) => void;
      onError?: (error: Error) => void;
      loadingDelay?: number;
    }
  ): Promise<T | null> => {
    try {
      setIsLoading(true);
      setError(null);

      // Optional delay for better UX (prevents flash of loading state)
      if (options?.loadingDelay) {
        await new Promise(resolve => setTimeout(resolve, options.loadingDelay));
      }

      const result = await operation();
      
      if (options?.onSuccess) {
        options.onSuccess(result);
      }
      
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred');
      setError(error.message);
      
      if (options?.onError) {
        options.onError(error);
      }
      
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setIsLoading(false);
    setError(null);
  };

  return {
    isLoading,
    error,
    execute,
    reset,
  };
}
