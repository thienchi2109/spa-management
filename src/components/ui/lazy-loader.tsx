// src/components/ui/lazy-loader.tsx
'use client';

import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LazyLoaderProps {
  children: ReactNode;
  fallback?: ReactNode;
  threshold?: number;
  rootMargin?: string;
  className?: string;
  onVisible?: () => void;
  delay?: number;
}

export function LazyLoader({
  children,
  fallback,
  threshold = 0.1,
  rootMargin = '50px',
  className,
  onVisible,
  delay = 0
}: LazyLoaderProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (delay > 0) {
            setTimeout(() => {
              setIsVisible(true);
              onVisible?.();
            }, delay);
          } else {
            setIsVisible(true);
            onVisible?.();
          }
          observer.unobserve(element);
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin, onVisible, delay]);

  useEffect(() => {
    if (isVisible && !isLoaded) {
      // Small delay to ensure smooth loading
      const timer = setTimeout(() => {
        setIsLoaded(true);
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, isLoaded]);

  const defaultFallback = (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <div ref={elementRef} className={cn('min-h-[100px]', className)}>
      {isLoaded ? children : (fallback || defaultFallback)}
    </div>
  );
}

// Specialized lazy loaders for common use cases
interface LazyCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function LazyCard({ children, className, delay = 100 }: LazyCardProps) {
  return (
    <LazyLoader
      delay={delay}
      className={className}
      fallback={
        <div className="animate-pulse">
          <div className="bg-muted rounded-lg h-48 w-full" />
        </div>
      }
    >
      {children}
    </LazyLoader>
  );
}

interface LazyListProps {
  children: ReactNode;
  itemCount?: number;
  className?: string;
}

export function LazyList({ children, itemCount = 3, className }: LazyListProps) {
  return (
    <LazyLoader
      className={className}
      fallback={
        <div className="space-y-4">
          {Array.from({ length: itemCount }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-muted rounded-lg h-20 w-full" />
            </div>
          ))}
        </div>
      }
    >
      {children}
    </LazyLoader>
  );
}

// Virtual scrolling component for large lists
interface VirtualScrollProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => ReactNode;
  overscan?: number;
  className?: string;
}

export function VirtualScroll<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className
}: VirtualScrollProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div
      ref={scrollElementRef}
      className={cn('overflow-auto', className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        {visibleItems.map((item, index) => (
          <div
            key={startIndex + index}
            style={{
              position: 'absolute',
              top: (startIndex + index) * itemHeight,
              height: itemHeight,
              width: '100%'
            }}
          >
            {renderItem(item, startIndex + index)}
          </div>
        ))}
      </div>
    </div>
  );
}