
'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Medication } from '@/lib/types';
import { formatDate, formatCurrency } from '@/lib/utils';
import {
  Pill,
  Building2,
  Calendar,
  Package,
  AlertTriangle,
  MapPin,
  Tag,
  Warehouse,
  FileText,
  Globe,
  DollarSign,
  ShoppingCart,
  Boxes
} from 'lucide-react';

interface MedicationDetailDialogProps {
  medication: Medication | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
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

export function MedicationDetailDialog({ medication, isOpen, onOpenChange }: MedicationDetailDialogProps) {
  if (!medication) {
    return null;
  }

  const expiryStatus = getExpiryStatus(medication.expiryDate);
  const stockStatus = getStockStatus(medication.stock, medication.minStockThreshold);

  const detailItems = [
    { icon: Pill, label: 'Hoạt chất', value: medication.activeIngredient },
    { icon: Tag, label: 'Dạng bào chế', value: medication.dosageForm },
    { icon: Boxes, label: 'Nồng độ', value: medication.concentration },
    { icon: Package, label: 'Đơn vị', value: medication.unit },
    { icon: Package, label: 'Số lô', value: medication.batchNo },
    { icon: Calendar, label: 'Ngày hết hạn', value: formatDate(medication.expiryDate) },
    { icon: Building2, label: 'Nhà sản xuất', value: medication.manufacturer },
    { icon: Globe, label: 'Nước sản xuất', value: medication.manufacturerCountry },
    { icon: FileText, label: 'Số đăng ký', value: medication.registrationNumber },
    { icon: ShoppingCart, label: 'Nhà cung cấp', value: medication.supplier },
    { icon: DollarSign, label: 'Giá nhập', value: formatCurrency(medication.importPrice) },
    { icon: DollarSign, label: 'Giá bán', value: formatCurrency(medication.sellPrice) },
    { icon: Warehouse, label: 'Tồn kho', value: `${medication.stock} ${medication.unit}` },
    { icon: AlertTriangle, label: 'Ngưỡng tồn kho tối thiểu', value: `${medication.minStockThreshold} ${medication.unit}` },
    { icon: MapPin, label: 'Vị trí lưu kho', value: medication.storageLocation },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{medication.name}</DialogTitle>
          <DialogDescription>
            Thông tin chi tiết về thuốc.
          </DialogDescription>
          <div className="flex items-center gap-2 pt-2">
            <Badge variant={expiryStatus.variant}>{expiryStatus.label}</Badge>
            <Badge variant={stockStatus.variant}>{stockStatus.label}</Badge>
          </div>
        </DialogHeader>
        <div className="py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {detailItems.map(item => (
            <div key={item.label} className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50">
              <item.icon className="h-5 w-5 mt-1 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="font-semibold">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Đóng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
