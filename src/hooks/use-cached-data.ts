// src/hooks/use-cached-data.ts
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { cacheManager, getCacheKey } from '@/lib/cache-manager';
import { getCollectionData } from '@/lib/sheets-utils';

interface UseCachedDataOptions {
  enabled?: boolean;
  refetchOnWindowFocus?: boolean;
  refetchInterval?: number;
  staleTime?: number;
}

interface UseCachedDataResult<T> {
  data: T[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  isStale: boolean;
}

export function useCachedData<T extends { id: string }>(
  collectionName: string,
  options: UseCachedDataOptions = {}
): UseCachedDataResult<T> {
  const {
    enabled = true,
    refetchOnWindowFocus = true,
    refetchInterval,
    staleTime = 30000 // 30 seconds
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);

  const fetchTimeoutRef = useRef<NodeJS.Timeout>();
  const intervalRef = useRef<NodeJS.Timeout>();

  const cacheKey = getCacheKey.collection(collectionName);

  const fetchData = useCallback(async (force = false) => {
    if (!enabled) return;

    try {
      setIsError(false);
      setError(null);

      // Check cache first (unless forced)
      if (!force) {
        const cachedData = cacheManager.get<T[]>(cacheKey);
        if (cachedData) {
          setData(cachedData);
          setIsLoading(false);
          setLastFetch(Date.now());
          return;
        }
      }

      setIsLoading(true);
      console.log(`🔄 Fetching fresh data for ${collectionName}`);
      
      const freshData = await getCollectionData<T>(collectionName);
      
      // Cache the fresh data
      cacheManager.set(cacheKey, freshData);
      
      setData(freshData);
      setLastFetch(Date.now());
      
      console.log(`✅ Fresh data loaded for ${collectionName}: ${freshData.length} items`);
    } catch (err) {
      console.error(`❌ Error fetching ${collectionName}:`, err);
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      
      // Try to use stale cache data as fallback
      const staleData = cacheManager.get<T[]>(cacheKey);
      if (staleData) {
        setData(staleData);
        console.log(`🔄 Using stale cache data for ${collectionName}`);
      }
    } finally {
      setIsLoading(false);
    }
  }, [collectionName, cacheKey, enabled]);

  const refetch = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [fetchData, enabled]);

  // Refetch interval
  useEffect(() => {
    if (refetchInterval && enabled) {
      intervalRef.current = setInterval(() => {
        fetchData();
      }, refetchInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [refetchInterval, fetchData, enabled]);

  // Window focus refetch
  useEffect(() => {
    if (!refetchOnWindowFocus || !enabled) return;

    const handleFocus = () => {
      // Only refetch if data is stale
      if (Date.now() - lastFetch > staleTime) {
        fetchData();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetchOnWindowFocus, fetchData, lastFetch, staleTime, enabled]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const isStale = Date.now() - lastFetch > staleTime;

  return {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isStale
  };
}

// Specialized hooks for common collections
export function useCachedCustomers(options?: UseCachedDataOptions) {
  return useCachedData<any>('customers', {
    refetchInterval: 2 * 60 * 1000, // 2 minutes
    ...options
  });
}

export function useCachedAppointments(options?: UseCachedDataOptions) {
  return useCachedData<any>('appointments', {
    refetchInterval: 1 * 60 * 1000, // 1 minute (more frequent for appointments)
    ...options
  });
}

export function useCachedServices(options?: UseCachedDataOptions) {
  return useCachedData<any>('services', {
    refetchInterval: 10 * 60 * 1000, // 10 minutes (less frequent for services)
    ...options
  });
}

export function useCachedInvoices(options?: UseCachedDataOptions) {
  return useCachedData<any>('invoices', {
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    ...options
  });
}

export function useCachedStaff(options?: UseCachedDataOptions) {
  return useCachedData<any>('staff', {
    refetchInterval: 30 * 60 * 1000, // 30 minutes (staff changes infrequently)
    ...options
  });
}