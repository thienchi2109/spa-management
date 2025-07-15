'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, Search, Save, FileText, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import type { Prescription, PrescriptionItem, Patient, Medication } from '@/lib/types';
import { 
  generatePrescriptionId, 
  calculatePrescriptionTotal, 
  calculateItemTotal,
  generatePrescriptionValidUntil,
  formatCurrency 
} from '@/lib/utils';
import { 
  PRESCRIPTION_STATUSES, 
  DEFAULT_CLINIC_INFO, 
  COMMON_DOSAGE_INSTRUCTIONS,
  COMMON_DOSAGE_FREQUENCIES,
  COMMON_DOSAGE_AMOUNTS,
  MEDICATION_UNITS,
  PRESCRIPTION_VALIDATION
} from '@/lib/prescription-constants';
import { seedAndFetchCollection } from '@/lib/firestore-utils';

interface PrescriptionFormProps {
  patient?: Patient;
  doctorName: string;
  doctorId?: string;
  doctorLicense?: string;
  medicalRecordId?: string;
  appointmentId?: string;
  diagnosis?: string;
  symptoms?: string;
  onSave?: (prescription: Prescription) => void;
  onCancel?: () => void;
  initialData?: Partial<Prescription>;
  mode?: 'create' | 'edit';
}

export default function PrescriptionForm({
  patient,
  doctorName,
  doctorId,
  doctorLicense,
  medicalRecordId,
  appointmentId,
  diagnosis = '',
  symptoms = '',
  onSave,
  onCancel,
  initialData,
  mode = 'create'
}: PrescriptionFormProps) {
  const { toast } = useToast();
  const [availableMedications, setAvailableMedications] = useState<Medication[]>([]);
  const [isLoadingMedications, setIsLoadingMedications] = useState(true);

  useEffect(() => {
    const fetchMedications = async () => {
      try {
        const meds = await seedAndFetchCollection('medications', []);
        setAvailableMedications(meds);
      } catch (error) {
        console.error("Failed to load medications:", error);
        toast({ variant: 'destructive', title: 'Lỗi', description: 'Không thể tải danh sách thuốc.' });
      } finally {
        setIsLoadingMedications(false);
      }
    };
    fetchMedications();
  }, [toast]);
  
  // Filter medications that are in stock and not expired
  const validMedications = availableMedications.filter(med => {
    const today = new Date('2025-07-13');
    today.setHours(0, 0, 0, 0);
    const expiryDate = new Date(med.expiryDate);
    return med.stock > 0 && expiryDate > today;
  });

  // Form state
  const [formData, setFormData] = useState<Partial<Prescription>>({
    patientId: patient?.id || '',
    patientName: patient?.name || '',
    patientAge: patient?.birthYear ? new Date().getFullYear() - patient.birthYear : undefined,
    patientGender: patient?.gender || '',
    patientWeight: undefined,
    patientAddress: patient?.address || '',
    doctorId: doctorId || '',
    doctorName: doctorName,
    doctorLicense: doctorLicense || '',
    medicalRecordId: medicalRecordId || '',
    appointmentId: appointmentId || '',
    date: new Date().toISOString().split('T')[0],
    diagnosis: diagnosis,
    symptoms: symptoms,
    items: [],
    totalCost: 0,
    doctorNotes: '',
    nextAppointment: '',
    status: PRESCRIPTION_STATUSES.DRAFT,
    clinicInfo: DEFAULT_CLINIC_INFO,
    ...initialData
  });

  const [currentItem, setCurrentItem] = useState<Partial<PrescriptionItem>>({
    medicationId: '',
    medicationName: '',
    concentration: '',
    dosageForm: '',
    quantity: 1,
    unit: 'Viên',
    dosage: '',
    instructions: '',
    unitPrice: 0,
    totalCost: 0,
    notes: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calculate total cost when items change
  useEffect(() => {
    const total = calculatePrescriptionTotal(formData.items || []);
    setFormData(prev => ({ ...prev, totalCost: total }));
  }, [formData.items]);

  // Calculate current item total when quantity or price changes
  useEffect(() => {
    const total = calculateItemTotal(currentItem.quantity || 0, currentItem.unitPrice || 0);
    setCurrentItem(prev => ({ ...prev, totalCost: total }));
  }, [currentItem.quantity, currentItem.unitPrice]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.patientId) newErrors.patient = 'Vui lòng chọn bệnh nhân';
    if (!formData.diagnosis?.trim()) newErrors.diagnosis = 'Vui lòng nhập chẩn đoán';
    if (!formData.items?.length) newErrors.items = 'Vui lòng thêm ít nhất một loại thuốc';
    
    if (formData.items && formData.items.length > PRESCRIPTION_VALIDATION.MAX_ITEMS) {
      newErrors.items = `Không thể thêm quá ${PRESCRIPTION_VALIDATION.MAX_ITEMS} loại thuốc`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateCurrentItem = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!currentItem.medicationId?.trim()) newErrors.medication = 'Vui lòng chọn thuốc';
    if (!currentItem.quantity || currentItem.quantity < PRESCRIPTION_VALIDATION.MIN_QUANTITY) {
      newErrors.quantity = `Số lượng phải lớn hơn ${PRESCRIPTION_VALIDATION.MIN_QUANTITY}`;
    }
    if (currentItem.quantity && currentItem.quantity > PRESCRIPTION_VALIDATION.MAX_QUANTITY) {
      newErrors.quantity = `Số lượng không thể vượt quá ${PRESCRIPTION_VALIDATION.MAX_QUANTITY}`;
    }
    if (!currentItem.dosage?.trim()) newErrors.dosage = 'Vui lòng nhập liều dùng';
    if (!currentItem.instructions?.trim()) newErrors.instructions = 'Vui lòng nhập cách dùng';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addMedicationItem = () => {
    if (!validateCurrentItem()) return;

    const newItem: PrescriptionItem = {
      id: `PI${Date.now()}`,
      medicationId: currentItem.medicationId || '',
      medicationName: currentItem.medicationName || '',
      concentration: currentItem.concentration || '',
      dosageForm: currentItem.dosageForm || '',
      quantity: currentItem.quantity || 1,
      unit: currentItem.unit || 'Viên',
      dosage: currentItem.dosage || '',
      instructions: currentItem.instructions || '',
      unitPrice: currentItem.unitPrice || 0,
      totalCost: currentItem.totalCost || 0,
      notes: currentItem.notes || ''
    };

    setFormData(prev => ({
      ...prev,
      items: [...(prev.items || []), newItem]
    }));

    // Reset current item
    setCurrentItem({
      medicationId: '',
      medicationName: '',
      concentration: '',
      dosageForm: '',
      quantity: 1,
      unit: 'Viên',
      dosage: '',
      instructions: '',
      unitPrice: 0,
      totalCost: 0,
      notes: ''
    });

    setErrors({});
    toast({
      title: 'Thành công',
      description: 'Đã thêm thuốc vào đơn'
    });
  };

  const removeMedicationItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items?.filter((_, i) => i !== index) || []
    }));
    toast({
      title: 'Thành công', 
      description: 'Đã xóa thuốc khỏi đơn'
    });
  };

  const handleMedicationSelect = (medicationId: string) => {
    const medication = validMedications.find(med => med.id === medicationId);
    if (medication) {
      setCurrentItem(prev => ({
        ...prev,
        medicationId: medication.id,
        medicationName: medication.name,
        concentration: medication.concentration,
        dosageForm: medication.dosageForm,
        unit: medication.unit,
        unitPrice: medication.sellPrice || 0,
        totalCost: (prev.quantity || 1) * (medication.sellPrice || 0)
      }));
    }
  };

  const handleSave = async (status: typeof PRESCRIPTION_STATUSES[keyof typeof PRESCRIPTION_STATUSES]) => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const prescriptionId = mode === 'create'
        ? generatePrescriptionId([], formData.clinicInfo?.licenseNumber || '01234', 'C') // TODO: Get existing prescriptions for collision check
        : formData.id || '';

      const prescription: Prescription = {
        id: prescriptionId,
        patientId: formData.patientId || '',
        patientName: formData.patientName || '',
        patientAge: formData.patientAge,
        patientGender: formData.patientGender,
        patientWeight: formData.patientWeight,
        patientAddress: formData.patientAddress,
        doctorId: formData.doctorId || '',
        doctorName: formData.doctorName || '',
        doctorLicense: formData.doctorLicense,
        medicalRecordId: formData.medicalRecordId,
        appointmentId: formData.appointmentId,
        date: formData.date || new Date().toISOString().split('T')[0],
        diagnosis: formData.diagnosis || '',
        symptoms: formData.symptoms,
        items: formData.items || [],
        totalCost: formData.totalCost || 0,
        doctorNotes: formData.doctorNotes,
        nextAppointment: formData.nextAppointment,
        status: status,
        validUntil: generatePrescriptionValidUntil(formData.date || new Date().toISOString().split('T')[0]),
        clinicInfo: formData.clinicInfo || DEFAULT_CLINIC_INFO,
        createdAt: formData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      onSave?.(prescription);
      toast({
        title: status === PRESCRIPTION_STATUSES.DRAFT 
          ? 'Lưu bản nháp thành công' 
          : 'Hoàn thành đơn thuốc thành công',
        description: status === PRESCRIPTION_STATUSES.DRAFT 
          ? 'Đơn thuốc đã được lưu dưới dạng bản nháp' 
          : 'Đơn thuốc đã được hoàn thành và sẵn sàng cấp phát'
      });
    } catch (error) {
      console.error('Error saving prescription:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Có lỗi xảy ra khi lưu đơn thuốc'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Patient Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Thông tin bệnh nhân
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="patientName">Tên bệnh nhân *</Label>
              <Input
                id="patientName"
                value={formData.patientName || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, patientName: e.target.value }))}
                placeholder="Nhập tên bệnh nhân"
                className={errors.patient ? 'border-red-500' : ''}
              />
              {errors.patient && <p className="text-sm text-red-500 mt-1">{errors.patient}</p>}
            </div>
            <div>
              <Label htmlFor="patientAge">Tuổi</Label>
              <Input
                id="patientAge"
                type="number"
                value={formData.patientAge || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, patientAge: parseInt(e.target.value) || undefined }))}
                placeholder="Tuổi"
              />
            </div>
            <div>
              <Label htmlFor="patientWeight">Cân nặng (kg)</Label>
              <Input
                id="patientWeight"
                type="number"
                value={formData.patientWeight || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, patientWeight: parseFloat(e.target.value) || undefined }))}
                placeholder="Cân nặng"
              />
            </div>
            <div>
              <Label htmlFor="patientGender">Giới tính</Label>
              <Select
                value={formData.patientGender || ''}
                onValueChange={(value) => setFormData(prev => ({ ...prev, patientGender: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn giới tính" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Nam</SelectItem>
                  <SelectItem value="Female">Nữ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="patientAddress">Địa chỉ</Label>
            <Input
              id="patientAddress"
              value={formData.patientAddress || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, patientAddress: e.target.value }))}
              placeholder="Địa chỉ bệnh nhân"
            />
          </div>
        </CardContent>
      </Card>

      {/* Medical Information */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin y tế</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="diagnosis">Chẩn đoán *</Label>
            <Input
              id="diagnosis"
              value={formData.diagnosis || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, diagnosis: e.target.value }))}
              placeholder="Nhập chẩn đoán"
              className={errors.diagnosis ? 'border-red-500' : ''}
            />
            {errors.diagnosis && <p className="text-sm text-red-500 mt-1">{errors.diagnosis}</p>}
          </div>
          <div>
            <Label htmlFor="symptoms">Triệu chứng</Label>
            <Textarea
              id="symptoms"
              value={formData.symptoms || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, symptoms: e.target.value }))}
              placeholder="Mô tả triệu chứng"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Add Medication Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Thêm thuốc vào đơn
            </div>
            <Badge variant="outline">
              {validMedications.length} thuốc có sẵn
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Show available medications info */}
          {validMedications.length === 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Không có thuốc nào có sẵn trong kho. Tất cả thuốc đều đã hết hạn hoặc hết tồn kho.
              </AlertDescription>
            </Alert>
          )}

          

          {/* Medication Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="medicationSelect">Chọn thuốc từ kho * ({validMedications.length} loại)</Label>
              <Select 
                value={currentItem.medicationId || ''} 
                onValueChange={handleMedicationSelect}
              >
                <SelectTrigger className={errors.medication ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Chọn thuốc từ kho" />
                </SelectTrigger>
                <SelectContent className="max-h-64 overflow-y-auto">
                  {validMedications.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      Không có thuốc nào có sẵn
                    </div>
                  ) : (
                    validMedications.map(med => {
                      const isLowStock = med.stock <= med.minStockThreshold;
                      const isExpiringSoon = new Date(med.expiryDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
                      
                      return (
                        <SelectItem key={med.id} value={med.id}>
                          <div className="flex flex-col w-full">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{med.name}</span>
                              {isLowStock && <Badge variant="secondary" className="text-xs">Sắp hết</Badge>}
                              {isExpiringSoon && <Badge variant="outline" className="text-xs">Gần hết hạn</Badge>}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              Tồn kho: {med.stock} {med.unit} | Giá: {(med.sellPrice || 0).toLocaleString()}đ
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {med.concentration} • {med.dosageForm}
                            </span>
                          </div>
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
              {errors.medication && <p className="text-sm text-red-500 mt-1">{errors.medication}</p>}
            </div>
            <div>
              <Label htmlFor="concentration">Nồng độ/Hàm lượng</Label>
              <Input
                id="concentration"
                value={currentItem.concentration || ''}
                onChange={(e) => setCurrentItem(prev => ({ ...prev, concentration: e.target.value }))}
                placeholder="VD: 500mg, 10ml"
                disabled={!!currentItem.medicationId}
              />
            </div>
            <div>
              <Label htmlFor="dosageForm">Dạng bào chế</Label>
              <Input
                id="dosageForm"
                value={currentItem.dosageForm || ''}
                onChange={(e) => setCurrentItem(prev => ({ ...prev, dosageForm: e.target.value }))}
                placeholder="VD: Viên nén, Chai, Ống"
                disabled={!!currentItem.medicationId}
              />
            </div>
            <div>
              <Label htmlFor="unitPrice">Giá đơn vị (VND)</Label>
              <Input
                id="unitPrice"
                type="number"
                value={currentItem.unitPrice || ''}
                onChange={(e) => setCurrentItem(prev => ({ 
                  ...prev, 
                  unitPrice: parseFloat(e.target.value) || 0,
                  totalCost: (prev.quantity || 1) * (parseFloat(e.target.value) || 0)
                }))}
                placeholder="Giá"
                disabled={!!currentItem.medicationId}
              />
            </div>
          </div>

          {/* Quantity and Unit */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="quantity">Số lượng *</Label>
              <Input
                id="quantity"
                type="number"
                step="0.1"
                min="0.1"
                value={currentItem.quantity || ''}
                onChange={(e) => setCurrentItem(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 1 }))}
                placeholder="Số lượng"
                className={errors.quantity ? 'border-red-500' : ''}
              />
              {errors.quantity && <p className="text-sm text-red-500 mt-1">{errors.quantity}</p>}
            </div>
            <div>
              <Label htmlFor="unit">Đơn vị</Label>
              <Select
                value={currentItem.unit || 'Viên'}
                onValueChange={(value) => setCurrentItem(prev => ({ ...prev, unit: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn đơn vị" />
                </SelectTrigger>
                <SelectContent>
                  {MEDICATION_UNITS.map(unit => (
                    <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Thành tiền</Label>
              <div className="h-10 px-3 py-2 border rounded-md bg-gray-50 flex items-center">
                {formatCurrency(currentItem.totalCost || 0)}
              </div>
            </div>
          </div>

          {/* Dosage Instructions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dosage">Liều dùng *</Label>
              <div className="space-y-2">
                <Input
                  id="dosage"
                  value={currentItem.dosage || ''}
                  onChange={(e) => setCurrentItem(prev => ({ ...prev, dosage: e.target.value }))}
                  placeholder="VD: 1 viên/lần, 3 lần/ngày"
                  className={errors.dosage ? 'border-red-500' : ''}
                />
                <div className="flex flex-wrap gap-1">
                  {COMMON_DOSAGE_AMOUNTS.slice(0, 6).map(amount => (
                    <Button
                      key={amount}
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={() => setCurrentItem(prev => ({
                        ...prev,
                        dosage: `${amount}, ${COMMON_DOSAGE_FREQUENCIES[2]}`
                      }))}
                      className="text-xs"
                    >
                      {amount}
                    </Button>
                  ))}
                </div>
              </div>
              {errors.dosage && <p className="text-sm text-red-500 mt-1">{errors.dosage}</p>}
            </div>
            <div>
              <Label htmlFor="instructions">Cách dùng *</Label>
              <div className="space-y-2">
                <Textarea
                  id="instructions"
                  value={currentItem.instructions || ''}
                  onChange={(e) => setCurrentItem(prev => ({ ...prev, instructions: e.target.value }))}
                  placeholder="Hướng dẫn sử dụng chi tiết"
                  rows={3}
                  className={errors.instructions ? 'border-red-500' : ''}
                />
                <div className="flex flex-wrap gap-1">
                  {COMMON_DOSAGE_INSTRUCTIONS.slice(0, 4).map(instruction => (
                    <Button
                      key={instruction}
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={() => setCurrentItem(prev => ({
                        ...prev,
                        instructions: prev.instructions ? `${prev.instructions}. ${instruction}` : instruction
                      }))}
                      className="text-xs"
                    >
                      {instruction}
                    </Button>
                  ))}
                </div>
              </div>
              {errors.instructions && <p className="text-sm text-red-500 mt-1">{errors.instructions}</p>}
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="itemNotes">Ghi chú</Label>
            <Input
              id="itemNotes"
              value={currentItem.notes || ''}
              onChange={(e) => setCurrentItem(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Ghi chú thêm cho thuốc này"
            />
          </div>

          {/* Add Button */}
          <div className="flex justify-end">
            <Button onClick={addMedicationItem} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Thêm vào đơn thuốc
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Prescription Items List */}
      {formData.items && formData.items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Danh sách thuốc trong đơn ({formData.items.length})</span>
              <Badge variant="outline">
                Tổng: {formatCurrency(formData.totalCost || 0)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Scrollable medication list with max height */}
            <ScrollArea className="max-h-80 pr-4">
              <div className="space-y-4">
                {formData.items.map((item, index) => (
                  <div key={item.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-lg">{item.medicationName}</h4>
                        {item.concentration && (
                          <p className="text-sm text-gray-600">
                            Nồng độ: {item.concentration}
                            {item.dosageForm && ` • Dạng: ${item.dosageForm}`}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMedicationItem(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Số lượng:</span> {item.quantity} {item.unit}
                      </div>
                      <div>
                        <span className="font-medium">Liều dùng:</span> {item.dosage}
                      </div>
                      <div>
                        <span className="font-medium">Thành tiền:</span> {formatCurrency(item.totalCost)}
                      </div>
                    </div>

                    <div className="text-sm">
                      <span className="font-medium">Cách dùng:</span> {item.instructions}
                    </div>

                    {item.notes && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Ghi chú:</span> {item.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            {errors.items && (
              <Alert className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-red-600">
                  {errors.items}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Doctor Notes and Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin bổ sung</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="doctorNotes">Lời dặn của bác sĩ</Label>
            <Textarea
              id="doctorNotes"
              value={formData.doctorNotes || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, doctorNotes: e.target.value }))}
              placeholder="Lời dặn, chú ý đặc biệt cho bệnh nhân..."
              rows={4}
              maxLength={PRESCRIPTION_VALIDATION.MAX_DOCTOR_NOTES_LENGTH}
            />
            <p className="text-xs text-gray-500 mt-1">
              {(formData.doctorNotes || '').length}/{PRESCRIPTION_VALIDATION.MAX_DOCTOR_NOTES_LENGTH} ký tự
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nextAppointment">Ngày hẹn tái khám</Label>
              <Input
                id="nextAppointment"
                type="date"
                value={formData.nextAppointment || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, nextAppointment: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="prescriptionDate">Ngày kê đơn</Label>
              <Input
                id="prescriptionDate"
                type="date"
                value={formData.date || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-600">Số loại thuốc</p>
              <p className="text-2xl font-bold text-blue-600">{formData.items?.length || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Tổng chi phí</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(formData.totalCost || 0)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Trạng thái</p>
              <Badge variant="outline" className="text-sm">
                {formData.status === PRESCRIPTION_STATUSES.DRAFT ? 'Bản nháp' : 'Hoàn thành'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel}>
          Hủy
        </Button>
        <Button 
          variant="outline" 
          onClick={() => handleSave(PRESCRIPTION_STATUSES.DRAFT)}
          disabled={isLoading}
        >
          <Save className="h-4 w-4 mr-2" />
          Lưu nháp
        </Button>
        <Button 
          onClick={() => handleSave(PRESCRIPTION_STATUSES.FINALIZED)}
          disabled={isLoading}
        >
          <FileText className="h-4 w-4 mr-2" />
          Hoàn thành đơn thuốc
        </Button>
      </div>
    </div>
  );
}
