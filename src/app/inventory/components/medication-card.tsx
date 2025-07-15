'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Pill, 
  MapPin, 
  Building2, 
  Calendar, 
  Package, 
  AlertTriangle,
  TrendingDown,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { Medication } from '@/lib/types';

interface MedicationCardProps {
  medication: Medication;
  onView?: (medication: Medication) => void;
  onEdit?: (medication: Medication) => void;
  onDelete?: (medication: Medication) => void;
}

function getExpiryStatus(expiryDate: string) {
  const today = new Date('2024-07-30'); // Using static date for consistency
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { status: 'expired', label: 'Đã hết hạn', variant: 'destructive' as const };
  } else if (diffDays <= 30) {
    return { status: 'expiring', label: 'Sắp hết hạn', variant: 'secondary' as const };
  } else {
    return { status: 'valid', label: 'Còn hạn', variant: 'default' as const };
  }
}

function getStockStatus(stock: number, minThreshold: number) {
  if (stock === 0) {
    return { status: 'out', label: 'Hết hàng', variant: 'destructive' as const };
  } else if (stock <= minThreshold) {
    return { status: 'low', label: 'Tồn kho thấp', variant: 'secondary' as const };
  } else {
    return { status: 'normal', label: 'Bình thường', variant: 'default' as const };
  }
}

export function MedicationCard({ medication, onView, onEdit, onDelete }: MedicationCardProps) {
  const expiryStatus = getExpiryStatus(medication.expiryDate);
  const stockStatus = getStockStatus(medication.stock, medication.minStockThreshold);

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-foreground mb-1">
              {medication.name}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Pill className="h-4 w-4" />
              <span>{medication.activeIngredient}</span>
              <span className="text-xs">•</span>
              <span>{medication.dosageForm}</span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <Badge variant={expiryStatus.variant} className="text-xs">
              {expiryStatus.label}
            </Badge>
            {stockStatus.status !== 'normal' && (
              <Badge variant={stockStatus.variant} className="text-xs">
                {stockStatus.label}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Thông tin cơ bản */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Số lô:</span>
              <span className="font-medium">{medication.batchNo}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Hết hạn:</span>
              <span className="font-medium">{formatDate(medication.expiryDate)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">NSX:</span>
              <span className="font-medium text-xs">{medication.manufacturer}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Vị trí:</span>
              <span className="font-medium text-xs">{medication.storageLocation}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Tồn kho:</span>
              <span className="font-bold text-lg">{medication.stock}</span>
              <span className="text-muted-foreground text-xs">{medication.unit}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Giá bán:</span>
              <span className="font-medium text-green-600">{formatCurrency(medication.sellPrice)}</span>
            </div>
          </div>
        </div>

        {/* Cảnh báo */}
        {(stockStatus.status !== 'normal' || expiryStatus.status !== 'valid') && (
          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <div className="text-xs text-muted-foreground">
              {stockStatus.status !== 'normal' && (
                <span>Tồn kho thấp hơn ngưỡng tối thiểu ({medication.minStockThreshold} {medication.unit})</span>
              )}
              {stockStatus.status !== 'normal' && expiryStatus.status !== 'valid' && (
                <span> • </span>
              )}
              {expiryStatus.status === 'expired' && (
                <span>Thuốc đã hết hạn sử dụng</span>
              )}
              {expiryStatus.status === 'expiring' && (
                <span>Thuốc sắp hết hạn trong 30 ngày</span>
              )}
            </div>
          </div>
        )}

        {/* Thông tin bổ sung */}
        <div className="pt-2 border-t border-border/50">
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div>
              <span>SĐK: </span>
              <span className="font-mono">{medication.registrationNumber}</span>
            </div>
            <div>
              <span>Nước SX: </span>
              <span>{medication.manufacturerCountry}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2">
          {onView && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onView(medication)}
              className="h-8"
            >
              <Eye className="h-3 w-3 mr-1" />
              Xem
            </Button>
          )}
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(medication)}
              className="h-8"
            >
              <Edit className="h-3 w-3 mr-1" />
              Sửa
            </Button>
          )}
          {onDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(medication)}
              className="h-8 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Xóa
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
