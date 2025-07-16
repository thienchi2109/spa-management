'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Clock, 
  Users, 
  Star, 
  AlertTriangle, 
  Heart, 
  Settings,
  MapPin,
  Timer,
  Sparkles
} from 'lucide-react';
import type { SpaService } from '@/lib/types';

interface ServiceDetailDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  service: SpaService | null;
}

const formatPrice = (price: number | string) => {
  let numPrice = 0;
  
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

export function ServiceDetailDialog({ isOpen, onOpenChange, service }: ServiceDetailDialogProps) {
  if (!service) return null;

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
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
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
                Khuyến mãi -{discountPercent}%
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-gray-50 text-gray-600">
                Giá chuẩn
              </Badge>
            )}
          </div>
          <DialogTitle className="text-2xl">{service.name}</DialogTitle>
          <DialogDescription className="text-base">
            {service.description}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Thông tin cơ bản
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Giá gốc:</span>
                  <p className="font-medium">{formatPrice(service.price)}</p>
                </div>
                {hasDiscount && (
                  <div>
                    <span className="text-sm text-muted-foreground">Giá khuyến mãi:</span>
                    <p className="font-medium text-green-600">{formatPrice(service.discountPrice!)}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Thời gian thực hiện:</span>
                  <p className="font-medium flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formatDuration(service.duration)}
                  </p>
                </div>
                {service.maxCapacity && (
                  <div>
                    <span className="text-sm text-muted-foreground">Sức chứa tối đa:</span>
                    <p className="font-medium flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {service.maxCapacity} khách
                    </p>
                  </div>
                )}
              </div>

              {service.roomType && (
                <div>
                  <span className="text-sm text-muted-foreground">Loại phòng:</span>
                  <p className="font-medium flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {service.roomType}
                  </p>
                </div>
              )}

              {(service.preparationTime || service.cleanupTime) && (
                <div className="grid grid-cols-2 gap-4">
                  {service.preparationTime && (
                    <div>
                      <span className="text-sm text-muted-foreground">Thời gian chuẩn bị:</span>
                      <p className="font-medium flex items-center gap-1">
                        <Timer className="h-4 w-4" />
                        {service.preparationTime} phút
                      </p>
                    </div>
                  )}
                  {service.cleanupTime && (
                    <div>
                      <span className="text-sm text-muted-foreground">Thời gian dọn dẹp:</span>
                      <p className="font-medium flex items-center gap-1">
                        <Timer className="h-4 w-4" />
                        {service.cleanupTime} phút
                      </p>
                    </div>
                  )}
                </div>
              )}

              {service.ageRestriction && (
                <div>
                  <span className="text-sm text-muted-foreground">Giới hạn độ tuổi:</span>
                  <p className="font-medium">{service.ageRestriction}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Staff & Equipment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Yêu cầu nhân sự & thiết bị
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {service.requiredStaff && (
                <div>
                  <span className="text-sm text-muted-foreground mb-2 block">Kỹ thuật viên yêu cầu:</span>
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(service.requiredStaff) ? (
                      service.requiredStaff.map((staff, index) => (
                        <Badge key={index} variant="outline">
                          {staff}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="outline">
                        {service.requiredStaff}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {service.equipment && (
                <div>
                  <span className="text-sm text-muted-foreground mb-2 block">Thiết bị cần thiết:</span>
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(service.equipment) ? (
                      service.equipment.map((item, index) => (
                        <Badge key={index} variant="secondary">
                          {item}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="secondary">
                        {service.equipment}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Benefits */}
          {service.benefits && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Lợi ích
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Array.isArray(service.benefits) ? (
                  <ul className="space-y-2">
                    {service.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Heart className="h-4 w-4 text-pink-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex items-start gap-2">
                    <Heart className="h-4 w-4 text-pink-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{service.benefits}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Contraindications */}
          {service.contraindications && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Chống chỉ định
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Array.isArray(service.contraindications) ? (
                  <ul className="space-y-2">
                    {service.contraindications.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{service.contraindications}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Aftercare Instructions */}
        {service.aftercareInstructions && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Hướng dẫn chăm sóc sau dịch vụ</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {service.aftercareInstructions}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Service Image */}
        {service.imageUrl && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Hình ảnh dịch vụ</CardTitle>
            </CardHeader>
            <CardContent>
              <img 
                src={service.imageUrl} 
                alt={service.name}
                className="w-full h-64 object-cover rounded-lg"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
}