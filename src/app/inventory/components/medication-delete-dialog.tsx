'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  AlertTriangle, 
  Trash2, 
  X, 
  Loader2,
  Package,
  DollarSign,
  Calendar,
  FileText,
  ShieldAlert
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Medication } from '@/lib/types';

interface MedicationDeleteDialogProps {
  medication: Medication | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (medication: Medication) => Promise<void>;
}

interface DeleteWarning {
  type: 'error' | 'warning' | 'info';
  message: string;
  icon: React.ReactNode;
}

// Helper function to get delete warnings
function getDeleteWarnings(medication: Medication): DeleteWarning[] {
  const warnings: DeleteWarning[] = [];

  // Stock value warning
  if (medication.stock > 0) {
    const stockValue = medication.stock * medication.importPrice;
    warnings.push({
      type: 'error',
      message: `Thuốc còn tồn kho ${medication.stock} ${medication.unit} (giá trị: ${formatCurrency(stockValue)})`,
      icon: <Package className="h-4 w-4" />
    });
  }

  // Expiry warning
  const expiryDate = new Date(medication.expiryDate);
  const today = new Date();
  if (expiryDate > today) {
    warnings.push({
      type: 'warning',
      message: `Thuốc chưa hết hạn (hết hạn: ${formatDate(medication.expiryDate)})`,
      icon: <Calendar className="h-4 w-4" />
    });
  }

  // High value warning
  const stockValue = medication.stock * medication.sellPrice;
  if (stockValue > 1000000) { // > 1 triệu VNĐ
    warnings.push({
      type: 'error',
      message: `Giá trị tồn kho cao (${formatCurrency(stockValue)})`,
      icon: <DollarSign className="h-4 w-4" />
    });
  }

  // Prescription warning (simulated - in real app would check actual prescriptions)
  const hasActivePrescriptions = Math.random() > 0.7; // Simulate 30% chance
  if (hasActivePrescriptions) {
    warnings.push({
      type: 'error',
      message: 'Thuốc đang được sử dụng trong đơn thuốc hiện tại',
      icon: <FileText className="h-4 w-4" />
    });
  }

  return warnings;
}

// Helper function to determine if deletion is high risk
function isHighRiskDeletion(warnings: DeleteWarning[]): boolean {
  return warnings.some(warning => warning.type === 'error');
}

export function MedicationDeleteDialog({ medication, open, onOpenChange, onDelete }: MedicationDeleteDialogProps) {
  const [confirmationText, setConfirmationText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!medication) return null;

  const warnings = getDeleteWarnings(medication);
  const isHighRisk = isHighRiskDeletion(warnings);
  const requiredConfirmationText = isHighRisk ? medication.name : '';

  // Handle delete confirmation
  const handleDelete = async () => {
    if (isHighRisk && confirmationText !== requiredConfirmationText) {
      setError('Vui lòng nhập chính xác tên thuốc để xác nhận xóa');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await onDelete(medication);
      onOpenChange(false);
      setConfirmationText('');
    } catch (error) {
      console.error('Error deleting medication:', error);
      setError('Có lỗi xảy ra khi xóa thuốc. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle dialog close
  const handleClose = () => {
    if (!isLoading) {
      onOpenChange(false);
      setConfirmationText('');
      setError('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Xóa thuốc khỏi kho
          </DialogTitle>
          <DialogDescription>
            Bạn có chắc chắn muốn xóa thuốc này khỏi hệ thống? Hành động này không thể hoàn tác.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Medication Info */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold text-lg">{medication.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {medication.activeIngredient} • {medication.concentration} • {medication.dosageForm}
                </p>
                <p className="text-sm text-muted-foreground">
                  Số lô: {medication.batchNo} • Vị trí: {medication.storageLocation}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Tồn kho</div>
                <div className="font-bold text-lg">{medication.stock} {medication.unit}</div>
              </div>
            </div>
          </div>

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-amber-500" />
                <h4 className="font-semibold">Cảnh báo trước khi xóa</h4>
              </div>
              
              <div className="space-y-2">
                {warnings.map((warning, index) => (
                  <Alert 
                    key={index} 
                    variant={warning.type === 'error' ? 'destructive' : 'default'}
                    className={
                      warning.type === 'warning' ? 'border-amber-200 bg-amber-50' :
                      warning.type === 'info' ? 'border-blue-200 bg-blue-50' : ''
                    }
                  >
                    {warning.icon}
                    <AlertDescription className={
                      warning.type === 'warning' ? 'text-amber-700' :
                      warning.type === 'info' ? 'text-blue-700' : ''
                    }>
                      {warning.message}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>

              {isHighRisk && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Cảnh báo nghiêm trọng:</strong> Việc xóa thuốc này có thể gây ảnh hưởng đến hoạt động của phòng khám.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* High Risk Confirmation */}
          {isHighRisk && (
            <div className="space-y-3">
              <Separator />
              <div>
                <Label htmlFor="confirmation" className="text-sm font-medium">
                  Để xác nhận xóa, vui lòng nhập tên thuốc: <span className="font-bold text-red-600">{medication.name}</span>
                </Label>
                <Input
                  id="confirmation"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder="Nhập tên thuốc để xác nhận"
                  className="mt-2"
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Impact Summary */}
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <h5 className="font-medium text-red-800 mb-2">Tác động khi xóa:</h5>
            <ul className="text-sm text-red-700 space-y-1">
              <li>• Thuốc sẽ bị xóa vĩnh viễn khỏi hệ thống</li>
              <li>• Không thể khôi phục thông tin sau khi xóa</li>
              {medication.stock > 0 && (
                <li>• Mất thông tin về {medication.stock} {medication.unit} tồn kho</li>
              )}
              <li>• Lịch sử nhập/xuất kho sẽ bị ảnh hưởng</li>
              <li>• Báo cáo thống kê có thể không chính xác</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            <X className="h-4 w-4 mr-2" />
            Hủy
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading || (isHighRisk && confirmationText !== requiredConfirmationText)}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            {isLoading ? 'Đang xóa...' : 'Xóa thuốc'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
