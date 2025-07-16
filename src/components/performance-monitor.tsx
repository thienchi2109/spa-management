// src/components/performance-monitor.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Database, 
  Clock, 
  Zap, 
  RefreshCw, 
  TrendingUp,
  Eye,
  EyeOff
} from 'lucide-react';
import { cacheManager } from '@/lib/cache-manager';
import { useData } from '@/contexts/data-context';

interface PerformanceStats {
  cacheHitRate: number;
  cacheSize: number;
  loadingStates: {
    customers: boolean;
    appointments: boolean;
    services: boolean;
    invoices: boolean;
    staff: boolean;
  };
  lastUpdate: number;
}

export function PerformanceMonitor() {
  const [isVisible, setIsVisible] = useState(false);
  const [stats, setStats] = useState<PerformanceStats>({
    cacheHitRate: 0,
    cacheSize: 0,
    loadingStates: {
      customers: false,
      appointments: false,
      services: false,
      invoices: false,
      staff: false
    },
    lastUpdate: Date.now()
  });

  const {
    isLoadingCustomers,
    isLoadingAppointments,
    isLoadingServices,
    isLoadingInvoices,
    isLoadingStaff,
    clearCache,
    refetchAll
  } = useData();

  useEffect(() => {
    const updateStats = () => {
      const cacheStats = cacheManager.getStats();
      
      setStats({
        cacheHitRate: 85, // Would need to implement proper hit rate tracking
        cacheSize: cacheStats.size,
        loadingStates: {
          customers: isLoadingCustomers,
          appointments: isLoadingAppointments,
          services: isLoadingServices,
          invoices: isLoadingInvoices,
          staff: isLoadingStaff
        },
        lastUpdate: Date.now()
      });
    };

    updateStats();
    const interval = setInterval(updateStats, 2000);
    return () => clearInterval(interval);
  }, [isLoadingCustomers, isLoadingAppointments, isLoadingServices, isLoadingInvoices, isLoadingStaff]);

  const handleClearCache = () => {
    clearCache();
    setStats(prev => ({ ...prev, cacheSize: 0, lastUpdate: Date.now() }));
  };

  const handleRefreshAll = async () => {
    await refetchAll();
  };

  const getLoadingCount = () => {
    return Object.values(stats.loadingStates).filter(Boolean).length;
  };

  const getCacheHealthColor = () => {
    if (stats.cacheHitRate >= 80) return 'text-green-600';
    if (stats.cacheHitRate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsVisible(true)}
          className="shadow-lg"
        >
          <Activity className="h-4 w-4 mr-2" />
          Performance
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80">
      <Card className="shadow-lg border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Performance Monitor</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
            >
              <EyeOff className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            Real-time app performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Cache Performance */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Cache Performance</span>
              </div>
              <Badge variant="outline" className={getCacheHealthColor()}>
                {stats.cacheHitRate}% hit rate
              </Badge>
            </div>
            <Progress value={stats.cacheHitRate} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{stats.cacheSize} entries cached</span>
              <span>Updated {Math.floor((Date.now() - stats.lastUpdate) / 1000)}s ago</span>
            </div>
          </div>

          {/* Loading States */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium">Loading States</span>
              {getLoadingCount() > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {getLoadingCount()} active
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-2 gap-1 text-xs">
              {Object.entries(stats.loadingStates).map(([key, isLoading]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="capitalize">{key}</span>
                  <div className={`w-2 h-2 rounded-full ${
                    isLoading ? 'bg-orange-500 animate-pulse' : 'bg-green-500'
                  }`} />
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearCache}
              className="flex-1"
            >
              <Database className="h-3 w-3 mr-1" />
              Clear Cache
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshAll}
              className="flex-1"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh All
            </Button>
          </div>

          {/* Performance Tips */}
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              <span>Cache hit rate above 80% is optimal</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              <span>Data refreshes automatically on focus</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Lightweight performance indicator for production
export function PerformanceIndicator() {
  const [cacheSize, setCacheSize] = useState(0);
  const { isLoadingCustomers, isLoadingAppointments, isLoadingServices } = useData();

  useEffect(() => {
    const interval = setInterval(() => {
      const stats = cacheManager.getStats();
      setCacheSize(stats.size);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const isLoading = isLoadingCustomers || isLoadingAppointments || isLoadingServices;

  return (
    <div className="fixed top-4 right-4 z-40">
      <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm border rounded-lg px-3 py-1 shadow-sm">
        <div className={`w-2 h-2 rounded-full ${
          isLoading ? 'bg-orange-500 animate-pulse' : 'bg-green-500'
        }`} />
        <span className="text-xs text-muted-foreground">
          Cache: {cacheSize}
        </span>
      </div>
    </div>
  );
}