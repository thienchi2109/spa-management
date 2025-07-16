'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  Clock, 
  Users, 
  Star,
  Sparkles
} from 'lucide-react';
import type { SpaService } from '@/lib/types';

interface ServiceCardProps {
  service: SpaService;
  onView: (service: SpaService) => void;
  onEdit: (service: SpaService) => void;
  onDelete: (service: SpaService) => void;
}

const formatPrice = (price: number | string) => {
  let numPrice = 0;
  
  if (typeof price === 'string') {
    // Remove currency symbols and spaces first
    let cleanPrice = price.replace(/[₫đ\s]/g, '');
    
    // Handle Vietnamese number format (380.000 or 380,000)
    if (cleanPrice.includes(',') && cleanPrice.includes('.')) {
      // If dot comes after comma, dot is decimal separator
      if (cleanPrice.lastIndexOf('.') > cleanPrice.lastIndexOf(',')) {
        cleanPrice = cleanPrice.replace(/,/g, '');
      } else {
        // Comma is decimal separator, dot is thousands separator
        cleanPrice = cleanPrice.replace(/\./g, '').replace(',', '.');
      }
    } else if (cleanPrice.includes(',')) {
      // Only comma - could be thousands separator or decimal
      const parts = cleanPrice.split(',');
      if (parts.length === 2 && parts[1].length <= 2) {
        // Likely decimal separator (e.g., 380,50)
        cleanPrice = cleanPrice.replace(',', '.');
      } else {
        // Likely thousands separator (e.g., 380,000)
        cleanPrice = cleanPrice.replace(/,/g, '');
      }
    } else if (cleanPrice.includes('.')) {
      // Only dot - could be thousands separator or decimal
      const parts = cleanPrice.split('.');
      if (parts.length === 2 && parts[1].length <= 2) {
        // Likely decimal separator (e.g., 380.50)
        // Keep as is
      } else {
        // Likely thousands separator (e.g., 380.000)
        cleanPrice = cleanPrice.replace(/\./g, '');
      }
    }
    
    numPrice = parseFloat(cleanPrice) || 0;
  } else {
    numPrice = price;
  }
  
  // If price seems too small (under 10000), multiply by 1000 
  // This handles cases where Google Sheets returns 280 instead of 280000
  if (numPrice > 0 && numPrice < 10000) {
    numPrice = numPrice * 1000;
  }
  
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(numPrice);
};

const formatDuration = (minutes: number | string) => {
  const numMinutes = typeof minutes === 'string' ? parseInt(minutes) || 0 : minutes;
  if (numMinutes < 60) {
    return `${numMinutes} phút`;
  }
  const hours = Math.floor(numMinutes / 60);
  const remainingMinutes = numMinutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} giờ`;
  }
  return `${hours}h ${remainingMinutes}p`;
};

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    'Massage': 'bg-blue-100 text-blue-800',
    'Facial': 'bg-pink-100 text-pink-800',
    'Body Treatment': 'bg-green-100 text-green-800',
    'Nail Care': 'bg-purple-100 text-purple-800',
    'Hair Care': 'bg-orange-100 text-orange-800',
    'Wellness': 'bg-teal-100 text-teal-800',
  };
  return colors[category] || 'bg-gray-100 text-gray-800';
};

export function ServiceCard({ service, onView, onEdit, onDelete }: ServiceCardProps) {
  // Parse price with same logic as formatPrice
  const parsePrice = (price: number | string) => {
    if (typeof price === 'string') {
      // Handle Vietnamese number format (380.000 or 380,000)
      // Remove currency symbols and spaces first
      let cleanPrice = price.replace(/[₫\s]/g, '');
      
      // If it contains both comma and dot, determine which is decimal separator
      if (cleanPrice.includes(',') && cleanPrice.includes('.')) {
        // If dot comes after comma, dot is decimal separator
        if (cleanPrice.lastIndexOf('.') > cleanPrice.lastIndexOf(',')) {
          cleanPrice = cleanPrice.replace(/,/g, '');
        } else {
          // Comma is decimal separator, dot is thousands separator
          cleanPrice = cleanPrice.replace(/\./g, '').replace(',', '.');
        }
      } else if (cleanPrice.includes(',')) {
        // Only comma - could be thousands separator or decimal
        const parts = cleanPrice.split(',');
        if (parts.length === 2 && parts[1].length <= 2) {
          // Likely decimal separator (e.g., 380,50)
          cleanPrice = cleanPrice.replace(',', '.');
        } else {
          // Likely thousands separator (e.g., 380,000)
          cleanPrice = cleanPrice.replace(/,/g, '');
        }
      } else if (cleanPrice.includes('.')) {
        // Only dot - could be thousands separator or decimal
        const parts = cleanPrice.split('.');
        if (parts.length === 2 && parts[1].length <= 2) {
          // Likely decimal separator (e.g., 380.50)
          // Keep as is
        } else {
          // Likely thousands separator (e.g., 380.000)
          cleanPrice = cleanPrice.replace(/\./g, '');
        }
      }
      
      return parseFloat(cleanPrice) || 0;
    }
    return price;
  };
  
  const price = parsePrice(service.price);
  const discountPrice = parsePrice(service.discountPrice || 0);
  const hasDiscount = discountPrice && discountPrice < price;
  const discountPercent = hasDiscount 
    ? Math.round(((price - discountPrice!) / price) * 100)
    : 0;

  return (
    <Card className="h-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={getCategoryColor(service.category)}>
                {service.category}
              </Badge>
              {!service.isActive && (
                <Badge variant="destructive">Ngưng hoạt động</Badge>
              )}
              {hasDiscount ? (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  <Sparkles className="h-3 w-3 mr-1" />
                  -{discountPercent}%
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-gray-50 text-gray-600">
                  Giá chuẩn
                </Badge>
              )}
            </div>
            <CardTitle className="text-lg leading-tight">{service.name}</CardTitle>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(service)}>
                <Eye className="mr-2 h-4 w-4" />
                Xem chi tiết
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(service)}>
                <Edit className="mr-2 h-4 w-4" />
                Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(service)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Xóa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardDescription className="line-clamp-2">
          {service.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Price */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Giá dịch vụ:</span>
            <div className="text-right">
              {hasDiscount ? (
                <div className="flex flex-col items-end">
                  <span className="text-lg font-bold text-green-600">
                    {formatPrice(service.discountPrice!)}
                  </span>
                  <span className="text-sm text-muted-foreground line-through">
                    {formatPrice(service.price)}
                  </span>
                </div>
              ) : (
                <span className="text-lg font-bold">
                  {formatPrice(service.price)}
                </span>
              )}
            </div>
          </div>

          {/* Duration */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Thời gian:</span>
            </div>
            <span className="text-sm font-medium">
              {formatDuration(service.duration)}
            </span>
          </div>

          {/* Capacity */}
          {service.maxCapacity && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>Sức chứa:</span>
              </div>
              <span className="text-sm font-medium">
                {service.maxCapacity} khách
              </span>
            </div>
          )}

          {/* Required Staff */}
          {service.requiredStaff && (
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Yêu cầu:</span>
              <div className="flex flex-wrap gap-1">
                {Array.isArray(service.requiredStaff) ? (
                  <>
                    {service.requiredStaff.slice(0, 2).map((staff, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {staff}
                      </Badge>
                    ))}
                    {service.requiredStaff.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{service.requiredStaff.length - 2}
                      </Badge>
                    )}
                  </>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    {service.requiredStaff}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Benefits Preview */}
          {service.benefits && (
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="h-4 w-4" />
                <span>Lợi ích:</span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {Array.isArray(service.benefits) ? (
                  <>
                    {service.benefits.slice(0, 2).join(', ')}
                    {service.benefits.length > 2 && '...'}
                  </>
                ) : (
                  service.benefits
                )}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}