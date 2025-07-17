// src/hooks/use-optimistic-updates.ts
'use client';

import { useState, useCallback } from 'react';
import { cacheManager, getCacheKey } from '@/lib/cache-manager';

interface OptimisticUpdateOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error, rollbackData: T) => void;
  invalidateCache?: string[];
}

export function useOptimisticUpdates<T extends { id: string }>(
  collectionName: string
) {
  const [isUpdating, setIsUpdating] = useState(false);

  const optimisticUpdate = useCallback(async <R>(
    updateFn: () => Promise<R>,
    optimisticData: T,
    options: OptimisticUpdateOptions<T> = {}
  ): Promise<R> => {
    const { onSuccess, onError, invalidateCache = [] } = options;
    
    setIsUpdating(true);
    
    // Get current cache data for rollback
    const cacheKey = getCacheKey.collection(collectionName);
    const currentData = cacheManager.get<T[]>(cacheKey) || [];
    
    try {
      // Apply optimistic update to cache
      const optimisticArray = currentData.map(item => 
        item.id === optimisticData.id ? optimisticData : item
      );
      
      // If item doesn't exist, add it
      if (!currentData.find(item => item.id === optimisticData.id)) {
        optimisticArray.push(optimisticData);
      }
      
      cacheManager.set(cacheKey, optimisticArray);
      console.log(`🚀 Optimistic update applied for ${collectionName}:${optimisticData.id}`);
      
      // Perform actual update
      const result = await updateFn();
      
      // Invalidate related caches
      invalidateCache.forEach(pattern => {
        cacheManager.invalidatePattern(pattern);
      });
      
      onSuccess?.(optimisticData);
      console.log(`✅ Optimistic update confirmed for ${collectionName}:${optimisticData.id}`);
      
      return result;
    } catch (error) {
      // Rollback optimistic update
      cacheManager.set(cacheKey, currentData);
      console.log(`❌ Optimistic update rolled back for ${collectionName}:${optimisticData.id}`);
      
      onError?.(error as Error, optimisticData);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, [collectionName]);

  const optimisticDelete = useCallback(async <R>(
    deleteFn: () => Promise<R>,
    itemId: string,
    options: OptimisticUpdateOptions<T> = {}
  ): Promise<R> => {
    const { onError, invalidateCache = [] } = options;
    
    setIsUpdating(true);
    
    // Get current cache data for rollback
    const cacheKey = getCacheKey.collection(collectionName);
    const currentData = cacheManager.get<T[]>(cacheKey) || [];
    const itemToDelete = currentData.find(item => item.id === itemId);
    
    try {
      // Apply optimistic delete to cache
      const optimisticArray = currentData.filter(item => item.id !== itemId);
      cacheManager.set(cacheKey, optimisticArray);
      console.log(`🗑️ Optimistic delete applied for ${collectionName}:${itemId}`);
      
      // Perform actual delete
      const result = await deleteFn();
      
      // Invalidate related caches
      invalidateCache.forEach(pattern => {
        cacheManager.invalidatePattern(pattern);
      });
      
      console.log(`✅ Optimistic delete confirmed for ${collectionName}:${itemId}`);
      
      return result;
    } catch (error) {
      // Rollback optimistic delete
      cacheManager.set(cacheKey, currentData);
      console.log(`❌ Optimistic delete rolled back for ${collectionName}:${itemId}`);
      
      if (itemToDelete) {
        onError?.(error as Error, itemToDelete);
      }
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, [collectionName]);

  const optimisticAdd = useCallback(async <R>(
    addFn: () => Promise<R>,
    newItem: T,
    options: OptimisticUpdateOptions<T> = {}
  ): Promise<R> => {
    const { onSuccess, onError, invalidateCache = [] } = options;

    setIsUpdating(true);

    // Get current cache data for rollback
    const cacheKey = getCacheKey.collection(collectionName);
    const currentData = cacheManager.get<T[]>(cacheKey) || [];

    try {
      // Apply optimistic add to cache
      const optimisticArray = [...currentData, newItem];
      cacheManager.set(cacheKey, optimisticArray);
      console.log(`➕ Optimistic add applied for ${collectionName}:${newItem.id}`);

      // Perform actual add
      const result = await addFn();

      // If the result contains the actual item with real ID, update the cache
      if (result && typeof result === 'object' && 'id' in result) {
        const actualItem = result as T;
        const updatedArray = optimisticArray.map(item =>
          item.id === newItem.id ? actualItem : item
        );
        cacheManager.set(cacheKey, updatedArray);
        console.log(`🔄 Updated optimistic item with real ID: ${newItem.id} -> ${actualItem.id}`);
      }

      // Invalidate related caches
      invalidateCache.forEach(pattern => {
        cacheManager.invalidatePattern(pattern);
      });

      onSuccess?.(newItem);
      console.log(`✅ Optimistic add confirmed for ${collectionName}:${newItem.id}`);

      return result;
    } catch (error) {
      // Rollback optimistic add
      cacheManager.set(cacheKey, currentData);
      console.log(`❌ Optimistic add rolled back for ${collectionName}:${newItem.id}`);

      onError?.(error as Error, newItem);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, [collectionName]);

  return {
    optimisticUpdate,
    optimisticDelete,
    optimisticAdd,
    isUpdating
  };
}