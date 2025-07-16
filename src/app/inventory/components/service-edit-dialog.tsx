'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import type { SpaService } from '@/lib/types';

interface ServiceEditDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  service: SpaService | null;
  onServiceUpdate: (service: SpaService) => Promise<void>;
}

const SERVICE_CATEGORIES = [
  'Massage',
  'Facial', 
  'Body Treatment',
  'Nail Care',
  'Hair Care',
  'Wellness'
];

const STAFF_TYPES = [
  'Chuyên viên massage',
  'Chuyên viên facial',
  'Kỹ thuật viên nail',
  'Chuyên viên tóc',
  'Kỹ thuật viên spa'
];

export function ServiceEditDialog({ isOpen, onOpenChange, service, onServiceUpdate }: ServiceEditDialogProps) {
  const [formData, setFormData] = useState<Partial<SpaService>>({});
  const [loading, setLoading] = useState(false);
  const [newStaff, setNewStaff] = useState('');
  const [newEquipment, setNewEquipment] = useState('');
  const [newBenefit, setNewBenefit] = useState('');
  const [newContraindication, setNewContraindication] = useState('');

  useEffect(() => {
    if (service) {
      setFormData({
        ...service,
        requiredStaff: Array.isArray(service.requiredStaff) ? service.requiredStaff : (service.requiredStaff ? [service.requiredStaff] : []),
        equipment: Array.isArray(service.equipment) ? service.equipment : (service.equipment ? [service.equipment] : []),
        benefits: Array.isArray(service.benefits) ? service.benefits : (service.benefits ? [service.benefits] : []),
        contraindications: Array.isArray(service.contraindications) ? service.contraindications : (service.contraindications ? [service.contraindications] : []),
      });
    }
  }, [service]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service || !formData.name || !formData.category || !formData.price || !formData.duration) {
      return;
    }

    setLoading(true);
    try {
      const updatedService: SpaService = {
        ...service,
        ...formData,
        price: Number(formData.price),
        duration: Number(formData.duration),
        discountPrice: formData.discountPrice ? Number(formData.discountPrice) : undefined,
        preparationTime: formData.preparationTime ? Number(formData.preparationTime) : undefined,
        cleanupTime: formData.cleanupTime ? Number(formData.cleanupTime) : undefined,
        maxCapacity: formData.maxCapacity ? Number(formData.maxCapacity) : undefined,
        updatedAt: new Date().toISOString(),
      };

      await onServiceUpdate(updatedService);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update service:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToArray = (field: keyof SpaService, value: string) => {
    if (!value.trim()) return;
    
    const currentArray = (formData[field] as string[]) || [];
    if (!currentArray.includes(value.trim())) {
      setFormData(prev => ({
        ...prev,
        [field]: [...currentArray, value.trim()]
      }));
    }
    
    // Clear the input
    if (field === 'requiredStaff') setNewStaff('');
    if (field === 'equipment') setNewEquipment('');
    if (field === 'benefits') setNewBenefit('');
    if (field === 'contraindications') setNewContraindication('');
  };

  const removeFromArray = (field: keyof SpaService, index: number) => {
    const currentArray = (formData[field] as string[]) || [];
    setFormData(prev => ({
      ...prev,
      [field]: currentArray.filter((_, i) => i !== index)
    }));
  };

  if (!service) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa dịch vụ</DialogTitle>
          <DialogDescription>
            Cập nhật thông tin chi tiết cho dịch vụ spa
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Thông tin cơ bản</h3>
              
              <div>
                <Label htmlFor="name">Tên dịch vụ *</Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="category">Danh mục *</Label>
                <Select 
                  value={formData.category || ''} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Mô tả *</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Giá dịch vụ (VNĐ) *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="discountPrice">Giá khuyến mãi (VNĐ)</Label>
                  <Input
                    id="discountPrice"
                    type="number"
                    value={formData.discountPrice || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      discountPrice: e.target.value ? Number(e.target.value) : undefined 
                    }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration">Thời gian (phút) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: Number(e.target.value) }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="maxCapacity">Sức chứa tối đa</Label>
                  <Input
                    id="maxCapacity"
                    type="number"
                    value={formData.maxCapacity || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      maxCapacity: e.target.value ? Number(e.target.value) : undefined 
                    }))}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive ?? true}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
                <Label htmlFor="isActive">Dịch vụ đang hoạt động</Label>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Thông tin bổ sung</h3>

              <div>
                <Label htmlFor="roomType">Loại phòng</Label>
                <Input
                  id="roomType"
                  value={formData.roomType || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, roomType: e.target.value }))}
                  placeholder="VD: Phòng massage, Phòng facial"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="preparationTime">Thời gian chuẩn bị (phút)</Label>
                  <Input
                    id="preparationTime"
                    type="number"
                    value={formData.preparationTime || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      preparationTime: e.target.value ? Number(e.target.value) : undefined 
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="cleanupTime">Thời gian dọn dẹp (phút)</Label>
                  <Input
                    id="cleanupTime"
                    type="number"
                    value={formData.cleanupTime || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      cleanupTime: e.target.value ? Number(e.target.value) : undefined 
                    }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="ageRestriction">Giới hạn độ tuổi</Label>
                <Input
                  id="ageRestriction"
                  value={formData.ageRestriction || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, ageRestriction: e.target.value }))}
                  placeholder="VD: Từ 18 tuổi trở lên"
                />
              </div>

              <div>
                <Label htmlFor="imageUrl">URL hình ảnh</Label>
                <Input
                  id="imageUrl"
                  value={formData.imageUrl || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                  placeholder="https://..."
                />
              </div>

              <div>
                <Label htmlFor="aftercareInstructions">Hướng dẫn chăm sóc sau</Label>
                <Textarea
                  id="aftercareInstructions"
                  value={formData.aftercareInstructions || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, aftercareInstructions: e.target.value }))}
                  rows={3}
                  placeholder="Hướng dẫn chăm sóc sau khi sử dụng dịch vụ..."
                />
              </div>
            </div>
          </div>

          {/* Required Staff */}
          <div>
            <Label>Kỹ thuật viên yêu cầu</Label>
            <div className="flex gap-2 mt-2">
              <Select value={newStaff} onValueChange={setNewStaff}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Chọn loại kỹ thuật viên" />
                </SelectTrigger>
                <SelectContent>
                  {STAFF_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                type="button" 
                onClick={() => addToArray('requiredStaff', newStaff)}
                disabled={!newStaff}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {(formData.requiredStaff || []).map((staff, index) => (
                <Badge key={index} variant="outline" className="flex items-center gap-1">
                  {staff}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeFromArray('requiredStaff', index)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          {/* Equipment */}
          <div>
            <Label>Thiết bị cần thiết</Label>
            <div className="flex gap-2 mt-2">
              <Input
                value={newEquipment}
                onChange={(e) => setNewEquipment(e.target.value)}
                placeholder="Nhập tên thiết bị"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addToArray('equipment', newEquipment);
                  }
                }}
              />
              <Button 
                type="button" 
                onClick={() => addToArray('equipment', newEquipment)}
                disabled={!newEquipment.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {(formData.equipment || []).map((item, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {item}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeFromArray('equipment', index)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          {/* Benefits */}
          <div>
            <Label>Lợi ích</Label>
            <div className="flex gap-2 mt-2">
              <Input
                value={newBenefit}
                onChange={(e) => setNewBenefit(e.target.value)}
                placeholder="Nhập lợi ích của dịch vụ"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addToArray('benefits', newBenefit);
                  }
                }}
              />
              <Button 
                type="button" 
                onClick={() => addToArray('benefits', newBenefit)}
                disabled={!newBenefit.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {(formData.benefits || []).map((benefit, index) => (
                <Badge key={index} variant="outline" className="flex items-center gap-1">
                  {benefit}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeFromArray('benefits', index)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          {/* Contraindications */}
          <div>
            <Label>Chống chỉ định</Label>
            <div className="flex gap-2 mt-2">
              <Input
                value={newContraindication}
                onChange={(e) => setNewContraindication(e.target.value)}
                placeholder="Nhập chống chỉ định"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addToArray('contraindications', newContraindication);
                  }
                }}
              />
              <Button 
                type="button" 
                onClick={() => addToArray('contraindications', newContraindication)}
                disabled={!newContraindication.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {(formData.contraindications || []).map((item, index) => (
                <Badge key={index} variant="destructive" className="flex items-center gap-1">
                  {item}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeFromArray('contraindications', index)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}