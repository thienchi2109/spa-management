
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter, 
  DialogClose 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { Medication } from '@/lib/types';

interface MedicationEditDialogProps {
  medication: Medication | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onMedicationUpdate: (updatedMedication: Medication) => void;
}

export function MedicationEditDialog({ medication, isOpen, onOpenChange, onMedicationUpdate }: MedicationEditDialogProps) {
  const [formData, setFormData] = useState<Partial<Medication>>({});
  const { toast } = useToast();

  useEffect(() => {
    if (medication) {
      setFormData(medication);
    } else {
      setFormData({});
    }
  }, [medication]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value === '' ? '' : Number(value) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medication) return;

    // Basic validation
    if (!formData.name || !formData.batchNo || !formData.expiryDate) {
        toast({
            variant: 'destructive',
            title: 'Lỗi',
            description: 'Vui lòng điền đầy đủ các trường bắt buộc.',
        });
        return;
    }

    onMedicationUpdate({ ...medication, ...formData });
    onOpenChange(false);
  };

  if (!medication) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa thông tin thuốc</DialogTitle>
          <DialogDescription>Cập nhật chi tiết cho {medication.name}. Nhấn lưu để cập nhật.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
            {/* Column 1 */}
            <div className="space-y-2">
              <div>
                <Label htmlFor="name">Tên thuốc</Label>
                <Input id="name" name="name" value={formData.name || ''} onChange={handleChange} />
              </div>
              <div>
                <Label htmlFor="activeIngredient">Hoạt chất</Label>
                <Input id="activeIngredient" name="activeIngredient" value={formData.activeIngredient || ''} onChange={handleChange} />
              </div>
              <div>
                <Label htmlFor="dosageForm">Dạng bào chế</Label>
                <Input id="dosageForm" name="dosageForm" value={formData.dosageForm || ''} onChange={handleChange} />
              </div>
               <div>
                <Label htmlFor="concentration">Nồng độ</Label>
                <Input id="concentration" name="concentration" value={formData.concentration || ''} onChange={handleChange} />
              </div>
            </div>
            
            {/* Column 2 */}
            <div className="space-y-2">
              <div>
                <Label htmlFor="batchNo">Số lô</Label>
                <Input id="batchNo" name="batchNo" value={formData.batchNo || ''} onChange={handleChange} />
              </div>
              <div>
                <Label htmlFor="expiryDate">Ngày hết hạn</Label>
                <Input id="expiryDate" name="expiryDate" type="date" value={formData.expiryDate || ''} onChange={handleChange} />
              </div>
              <div>
                <Label htmlFor="manufacturer">Nhà sản xuất</Label>
                <Input id="manufacturer" name="manufacturer" value={formData.manufacturer || ''} onChange={handleChange} />
              </div>
              <div>
                <Label htmlFor="supplier">Nhà cung cấp</Label>
                <Input id="supplier" name="supplier" value={formData.supplier || ''} onChange={handleChange} />
              </div>
            </div>

            {/* Column 3 */}
            <div className="space-y-2">
               <div>
                <Label htmlFor="stock">Tồn kho</Label>
                <Input id="stock" name="stock" type="number" value={formData.stock || 0} onChange={handleNumericChange} />
              </div>
              <div>
                <Label htmlFor="importPrice">Giá nhập</Label>
                <Input id="importPrice" name="importPrice" type="number" value={formData.importPrice || 0} onChange={handleNumericChange} />
              </div>
              <div>
                <Label htmlFor="sellPrice">Giá bán</Label>
                <Input id="sellPrice" name="sellPrice" type="number" value={formData.sellPrice || 0} onChange={handleNumericChange} />
              </div>
              <div>
                <Label htmlFor="storageLocation">Vị trí lưu kho</Label>
                <Input id="storageLocation" name="storageLocation" value={formData.storageLocation || ''} onChange={handleChange} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Hủy</Button>
            </DialogClose>
            <Button type="submit">Lưu thay đổi</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
