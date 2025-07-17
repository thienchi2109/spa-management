'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Filter, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import type { Appointment, Staff, Invoice } from '@/lib/types';

export interface AppointmentFilters {
  appointmentStatus: Appointment['status'] | 'all';
  paymentStatus: Invoice['status'] | 'all';
  staffMember: string | 'all'; // staff name or 'all'
}

interface AppointmentFiltersProps {
  filters: AppointmentFilters;
  onFiltersChange: (filters: AppointmentFilters) => void;
  staff: Staff[];
  className?: string;
}

const appointmentStatusOptions = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'Scheduled', label: 'Đã lên lịch' },
  { value: 'Completed', label: 'Hoàn thành' },
  { value: 'Cancelled', label: 'Đã hủy' },
] as const;

const paymentStatusOptions = [
  { value: 'all', label: 'Tất cả thanh toán' },
  { value: 'Paid', label: 'Đã thanh toán' },
  { value: 'Pending', label: 'Chờ thanh toán' },
  { value: 'Overdue', label: 'Quá hạn' },
] as const;

const getStatusBadgeClasses = (status: string) => {
  switch (status) {
    case 'Scheduled':
      return 'border-l-4 border-l-green-600 bg-green-50 text-green-800';
    case 'Completed':
      return 'border-l-4 border-l-blue-600 bg-blue-50 text-blue-800';
    case 'Cancelled':
      return 'border-l-4 border-l-red-600 bg-red-50 text-red-800';
    case 'Paid':
      return 'bg-green-50 text-green-800 border-green-200';
    case 'Pending':
      return 'bg-yellow-50 text-yellow-800 border-yellow-200';
    case 'Overdue':
      return 'bg-red-50 text-red-800 border-red-200';
    default:
      return 'bg-gray-50 text-gray-800 border-gray-200';
  }
};

export function AppointmentFiltersComponent({
  filters,
  onFiltersChange,
  staff,
  className = ''
}: AppointmentFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasActiveFilters = filters.appointmentStatus !== 'all' ||
                          filters.paymentStatus !== 'all' ||
                          filters.staffMember !== 'all';

  const activeFilterCount = [
    filters.appointmentStatus !== 'all',
    filters.paymentStatus !== 'all',
    filters.staffMember !== 'all'
  ].filter(Boolean).length;

  const handleClearAllFilters = () => {
    onFiltersChange({
      appointmentStatus: 'all',
      paymentStatus: 'all',
      staffMember: 'all'
    });
  };

  const handleFilterChange = (filterType: keyof AppointmentFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [filterType]: value
    });
  };

  const removeFilter = (filterType: keyof AppointmentFilters) => {
    handleFilterChange(filterType, 'all');
  };

  const staffOptions = [
    { value: 'all', label: 'Tất cả nhân viên' },
    ...staff.map(s => ({ value: s.name, label: s.name }))
  ];

  return (
    <Card className={`${className} ${hasActiveFilters ? 'ring-2 ring-primary/20 border-primary/30' : ''} transition-all duration-200`}>
      <CardContent className="p-4">
        {/* Header with Filter Icon and Clear Button */}
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="md:hidden flex items-center gap-2 hover:bg-accent rounded-md p-2 -ml-2 transition-colors"
            >
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium mobile-text-sm">Bộ lọc</span>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="text-xs h-5 min-w-[20px] flex items-center justify-center">
                  {activeFilterCount}
                </Badge>
              )}
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
            <div className="hidden md:flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">Bộ lọc</span>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </div>
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAllFilters}
              className="h-8 px-2 mobile-text-sm hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Xóa tất cả</span>
              <span className="sm:hidden">Xóa</span>
            </Button>
          )}
        </div>

        {/* Filter Controls - Desktop Layout */}
        <div className="hidden md:grid md:grid-cols-3 gap-4 mb-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Trạng thái lịch hẹn
            </label>
            <Select
              value={filters.appointmentStatus}
              onValueChange={(value) => handleFilterChange('appointmentStatus', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {appointmentStatusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Trạng thái thanh toán
            </label>
            <Select
              value={filters.paymentStatus}
              onValueChange={(value) => handleFilterChange('paymentStatus', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {paymentStatusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Kỹ thuật viên
            </label>
            <Select
              value={filters.staffMember}
              onValueChange={(value) => handleFilterChange('staffMember', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {staffOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filter Controls - Mobile Layout */}
        <div className={`md:hidden space-y-3 mb-4 transition-all duration-200 ${
          isExpanded ? 'block' : 'hidden'
        }`}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Trạng thái lịch hẹn
            </label>
            <Select
              value={filters.appointmentStatus}
              onValueChange={(value) => handleFilterChange('appointmentStatus', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {appointmentStatusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Trạng thái thanh toán
            </label>
            <Select
              value={filters.paymentStatus}
              onValueChange={(value) => handleFilterChange('paymentStatus', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {paymentStatusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Kỹ thuật viên
            </label>
            <Select
              value={filters.staffMember}
              onValueChange={(value) => handleFilterChange('staffMember', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {staffOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active Filter Badges */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {filters.appointmentStatus !== 'all' && (
              <Badge
                variant="outline"
                className={`flex items-center gap-1 mobile-text-sm ${getStatusBadgeClasses(filters.appointmentStatus)}`}
              >
                <span className="truncate max-w-[120px] sm:max-w-none">
                  {appointmentStatusOptions.find(opt => opt.value === filters.appointmentStatus)?.label}
                </span>
                <button
                  onClick={() => removeFilter('appointmentStatus')}
                  className="ml-1 hover:bg-black/10 rounded-full p-0.5 transition-colors"
                  aria-label="Xóa bộ lọc trạng thái"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

            {filters.paymentStatus !== 'all' && (
              <Badge
                variant="outline"
                className={`flex items-center gap-1 mobile-text-sm ${getStatusBadgeClasses(filters.paymentStatus)}`}
              >
                <span className="truncate max-w-[120px] sm:max-w-none">
                  {paymentStatusOptions.find(opt => opt.value === filters.paymentStatus)?.label}
                </span>
                <button
                  onClick={() => removeFilter('paymentStatus')}
                  className="ml-1 hover:bg-black/10 rounded-full p-0.5 transition-colors"
                  aria-label="Xóa bộ lọc thanh toán"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

            {filters.staffMember !== 'all' && (
              <Badge 
                variant="outline" 
                className="flex items-center gap-1 bg-blue-50 text-blue-800 border-blue-200 mobile-text-sm"
              >
                <span className="truncate max-w-[120px] sm:max-w-none">
                  {staffOptions.find(opt => opt.value === filters.staffMember)?.label}
                </span>
                <button
                  onClick={() => removeFilter('staffMember')}
                  className="ml-1 hover:bg-black/10 rounded-full p-0.5 transition-colors"
                  aria-label="Xóa bộ lọc nhân viên"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
