'use client';

import React, { useState, useEffect } from 'react';
import { X, Smartphone, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const BANNER_STORAGE_KEY = 'mobile-optimization-banner-dismissed';

export function MobileOptimizationBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    // Only show on mobile devices
    if (!isMobile) return;

    // Check if banner was previously dismissed
    const wasDismissed = localStorage.getItem(BANNER_STORAGE_KEY);
    if (!wasDismissed) {
      // Show banner after a short delay
      const timer = setTimeout(() => {
        setIsVisible(true);
        setIsAnimating(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isMobile]);

  const handleDismiss = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      localStorage.setItem(BANNER_STORAGE_KEY, 'true');
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm transition-all duration-300 ease-out',
        isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      )}
    >
      <div className="rounded-lg border bg-card/95 backdrop-blur-sm p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Smartphone className="h-4 w-4 text-primary" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-card-foreground">
              Tối ưu hóa Mobile
            </h3>
            <div className="mt-1 space-y-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>Sidebar tự động đóng</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>Touch feedback cải thiện</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>Responsive design tối ưu</span>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 flex-shrink-0"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Đóng</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to show mobile optimization tips
 */
export function useMobileOptimizationTips() {
  const isMobile = useIsMobile();
  const [showTips, setShowTips] = useState(false);

  useEffect(() => {
    if (isMobile) {
      const hasSeenTips = localStorage.getItem('mobile-tips-seen');
      if (!hasSeenTips) {
        setShowTips(true);
      }
    }
  }, [isMobile]);

  const dismissTips = () => {
    setShowTips(false);
    localStorage.setItem('mobile-tips-seen', 'true');
  };

  return {
    showTips: showTips && isMobile,
    dismissTips,
  };
}
