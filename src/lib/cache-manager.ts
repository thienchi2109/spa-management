// src/lib/cache-manager.ts
import type { 
  Customer, 
  Appointment, 
  Invoice, 
  Staff, 
  SpaService,
  MedicalRecord
} from './types';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface CacheConfig {
  ttl: number;
  maxSize?: number;
}

class CacheManager {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes
  private maxCacheSize = 100;

  // Cache configurations for different data types
  private cacheConfigs: Record<string, CacheConfig> = {
    customers: { ttl: 10 * 60 * 1000 }, // 10 minutes
    appointments: { ttl: 2 * 60 * 1000 }, // 2 minutes (more frequent updates)
    services: { ttl: 30 * 60 * 1000 }, // 30 minutes (less frequent changes)
    staff: { ttl: 60 * 60 * 1000 }, // 1 hour
    invoices: { ttl: 15 * 60 * 1000 }, // 15 minutes
    medicalRecords: { ttl: 30 * 60 * 1000 }
  };

  set<T>(key: string, data: T, customTTL?: number): void {
    // Clean up expired entries if cache is getting full
    if (this.cache.size >= this.maxCacheSize) {
      this.cleanup();
    }

    const collectionType = key.split(':')[0];
    const config = this.cacheConfigs[collectionType];
    const ttl = customTTL || config?.ttl || this.defaultTTL;

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });

    console.log(`🔄 Cache SET: ${key} (TTL: ${ttl}ms)`);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      console.log(`❌ Cache MISS: ${key}`);
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      console.log(`⏰ Cache EXPIRED: ${key}`);
      return null;
    }

    console.log(`✅ Cache HIT: ${key}`);
    return entry.data;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
    console.log(`🗑️ Cache INVALIDATED: ${key}`);
  }

  invalidatePattern(pattern: string): void {
    const keysToDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => {
      this.cache.delete(key);
      console.log(`🗑️ Cache INVALIDATED (pattern): ${key}`);
    });
  }

  clear(): void {
    this.cache.clear();
    console.log('🧹 Cache CLEARED');
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    console.log(`🧹 Cache CLEANUP: Removed ${keysToDelete.length} expired entries`);
  }

  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    entries: Array<{ key: string; age: number; ttl: number }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      age: now - entry.timestamp,
      ttl: entry.ttl
    }));

    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      hitRate: 0, // Would need to track hits/misses for accurate calculation
      entries
    };
  }
}

// Singleton instance
export const cacheManager = new CacheManager();

// Cache key generators
export const getCacheKey = {
  collection: (collectionName: string) => `${collectionName}:all`,
  item: (collectionName: string, id: string) => `${collectionName}:item:${id}`,
  search: (collectionName: string, query: string) => `${collectionName}:search:${btoa(query)}`,
  filtered: (collectionName: string, filters: Record<string, any>) => 
    `${collectionName}:filtered:${btoa(JSON.stringify(filters))}`,
  user: (userId: string) => `user:${userId}`,
  todayAppointments: (date: string) => `appointments:today:${date}`,
  customerAppointments: (customerId: string) => `appointments:customer:${customerId}`,
  customerInvoices: (customerId: string) => `invoices:customer:${customerId}`
};