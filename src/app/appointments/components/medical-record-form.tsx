'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import { Calendar as CalendarIcon, Loader2, Stethoscope, CreditCard, Plus, Trash2, Search } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { format } from 'date-fns';
import type { Appointment, MedicalRecord, Medication, PrescriptionItem, Prescription } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { seedAndFetchCollection } from '@/lib/firestore-utils';
import { generatePrescriptionId, printPrescription, generatePrescriptionValidUntil } from '@/lib/utils';
import { DEFAULT_CLINIC_INFO } from '@/lib/prescription-constants';

const medicalRecordSchema = z.object({
  symptoms: z.string().min(1, 'Vui lòng nhập triệu chứng.'),
  diagnosis: z.string().min(1, 'Vui lòng nhập chẩn đoán.'),
  treatment: z.string().min(1, 'Vui lòng nhập phương pháp điều trị.'),
  prescription: z.string().optional(),
  nextAppointment: z.date().optional(),
  notes: z.string().optional(),
});

type MedicalRecordFormValues = z.infer<typeof medicalRecordSchema>;

interface MedicalRecordFormProps {
  appointment: Appointment;
  onSave: (recordData: Omit<MedicalRecord, 'id'>) => Promise<void>;
  onClose: () => void;
  onCreateInvoice?: () => void;
}

export function MedicalRecordForm({ appointment, onSave, onClose, onCreateInvoice }: MedicalRecordFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionItem[]>([]);
  const [availableMedications, setAvailableMedications] = useState<Medication[]>([]);
  const [isLoadingMedications, setIsLoadingMedications] = useState(true);

  useEffect(() => {
    const fetchMedications = async () => {
      try {
        const meds = await seedAndFetchCollection('medications', []);
        setAvailableMedications(meds);
      } catch (error) {
        console.error("Failed to load medications:", error);
      } finally {
        setIsLoadingMedications(false);
      }
    };
    fetchMedications();
  }, []);
  const [currentMedication, setCurrentMedication] = useState<Partial<PrescriptionItem>>({
    medicationId: '',
    medicationName: '',
    concentration: '',
    dosageForm: '',
    quantity: 1,
    unit: '',
    dosage: '',
    instructions: '',
    unitPrice: 0,
    totalCost: 0,
    notes: ''
  });
  
  // Filter medications that are in stock and not expired
  const validMedications = availableMedications.filter(med => {
    const today = new Date('2025-07-13');
    today.setHours(0, 0, 0, 0);
    const expiryDate = new Date(med.expiryDate);
    return med.stock > 0 && expiryDate > today;
  });

  const form = useForm<MedicalRecordFormValues>({
    resolver: zodResolver(medicalRecordSchema),
    defaultValues: {
      symptoms: '',
      diagnosis: '',
      treatment: '',
      prescription: '',
      notes: '',
    },
  });

  const handleMedicationSelect = (medicationId: string) => {
    const medication = validMedications.find(med => med.id === medicationId);
    if (medication) {
      setCurrentMedication({
        medicationId: medication.id,
        medicationName: medication.name,
        concentration: medication.concentration,
        dosageForm: medication.dosageForm,
        quantity: 1,
        unit: medication.unit,
        dosage: '',
        instructions: '',
        unitPrice: medication.sellPrice || 0,
        totalCost: medication.sellPrice || 0,
        notes: ''
      });
    }
  };

  const handleQuantityChange = (quantity: number) => {
    setCurrentMedication(prev => ({
      ...prev,
      quantity,
      totalCost: quantity * (prev.unitPrice || 0)
    }));
  };

  const addMedicationToPrescription = () => {
    if (!currentMedication.medicationId || !currentMedication.dosage || !currentMedication.instructions) {
      return;
    }

    const newItem: PrescriptionItem = {
      id: `PI${Date.now()}`,
      medicationId: currentMedication.medicationId!,
      medicationName: currentMedication.medicationName!,
      concentration: currentMedication.concentration!,
      dosageForm: currentMedication.dosageForm!,
      quantity: currentMedication.quantity!,
      unit: currentMedication.unit!,
      dosage: currentMedication.dosage!,
      instructions: currentMedication.instructions!,
      unitPrice: currentMedication.unitPrice!,
      totalCost: currentMedication.totalCost!,
      notes: currentMedication.notes || ''
    };

    setPrescriptionItems(prev => [...prev, newItem]);
    
    // Reset current medication
    setCurrentMedication({
      medicationId: '',
      medicationName: '',
      concentration: '',
      dosageForm: '',
      quantity: 1,
      unit: '',
      dosage: '',
      instructions: '',
      unitPrice: 0,
      totalCost: 0,
      notes: ''
    });
  };

  const removeMedicationFromPrescription = (index: number) => {
    setPrescriptionItems(prev => prev.filter((_, i) => i !== index));
  };

  async function onSubmit(data: MedicalRecordFormValues) {
    setIsSaving(true);
    try {
      // Generate prescription text from items
      const prescriptionText = prescriptionItems.map(item => 
        `${item.medicationName} - ${item.dosage}, ${item.instructions} (SL: ${item.quantity} ${item.unit})`
      ).join('; ');

      const medicalRecord: Omit<MedicalRecord, 'id'> = {
        patientId: '', // Will be populated by the parent component
        patientName: appointment.patientName,
        appointmentId: appointment.id,
        date: appointment.date,
        doctorName: appointment.doctorName,
        symptoms: data.symptoms,
        diagnosis: data.diagnosis,
        treatment: data.treatment,
        prescription: prescriptionText || undefined,
        nextAppointment: data.nextAppointment ? format(data.nextAppointment, 'yyyy-MM-dd') : undefined,
        notes: data.notes || undefined,
      };
      
      await onSave(medicalRecord);
      onClose();
    } catch (error) {
      console.error('Error saving medical record:', error);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Stethoscope className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Ghi nhận kết quả khám bệnh</h3>
      </div>
      
      <div className="p-4 bg-secondary/30 rounded-lg">
        <p className="text-sm text-muted-foreground">
          <strong>Bệnh nhân:</strong> {appointment.patientName} | 
          <strong> Ngày khám:</strong> {formatDate(appointment.date)} | 
          <strong> Bác sĩ:</strong> {appointment.doctorName}
        </p>
      </div>

      <div className="h-[600px] overflow-y-auto pr-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="symptoms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Triệu chứng <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Mô tả triệu chứng của bệnh nhân..." 
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="diagnosis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chẩn đoán <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Chẩn đoán bệnh của bác sĩ..." 
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="treatment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phương pháp điều trị <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Phương pháp điều trị được chỉ định..." 
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Enhanced Prescription Section */}
            <div className="space-y-4">
              <h4 className="font-semibold">Kê đơn thuốc</h4>
              
              {/* Medication Selector */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Thêm thuốc vào đơn</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Chọn thuốc</label>
                      <Select 
                        value={currentMedication.medicationId} 
                        onValueChange={handleMedicationSelect}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn thuốc từ kho" />
                        </SelectTrigger>
                        <SelectContent>
                          {validMedications.map(med => (
                            <SelectItem key={med.id} value={med.id}>
                              <div className="flex flex-col">
                                <span>{med.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  Tồn kho: {med.stock} {med.unit} | Giá: {(med.sellPrice || 0).toLocaleString()}đ
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Số lượng</label>
                      <Input
                        type="number"
                        placeholder="1"
                        value={currentMedication.quantity}
                        onChange={(e) => handleQuantityChange(Number(e.target.value))}
                        min="1"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Liều dùng</label>
                      <Input
                        placeholder="VD: 1 viên/lần"
                        value={currentMedication.dosage}
                        onChange={(e) => setCurrentMedication(prev => ({ ...prev, dosage: e.target.value }))}
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Cách dùng</label>
                      <Input
                        placeholder="VD: 3 lần/ngày sau ăn"
                        value={currentMedication.instructions}
                        onChange={(e) => setCurrentMedication(prev => ({ ...prev, instructions: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <Button 
                    type="button" 
                    onClick={addMedicationToPrescription}
                    disabled={!currentMedication.medicationId || !currentMedication.dosage || !currentMedication.instructions}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm vào đơn thuốc
                  </Button>
                </CardContent>
              </Card>

              {/* Prescription Items List */}
              {prescriptionItems.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Đơn thuốc hiện tại</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {prescriptionItems.map((item, index) => (
                        <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium">{item.medicationName}</div>
                            <div className="text-sm text-muted-foreground">
                              {item.dosage} - {item.instructions}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Số lượng: {item.quantity} {item.unit} | Thành tiền: {(item.totalCost || 0).toLocaleString()}đ
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeMedicationFromPrescription(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <div className="text-right font-semibold pt-2 border-t">
                        Tổng chi phí: {prescriptionItems.reduce((sum, item) => sum + (item.totalCost || 0), 0).toLocaleString()}đ
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              </div>

            <FormField
              control={form.control}
              name="nextAppointment"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Ngày hẹn tái khám</FormLabel>
                  <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            formatDate(format(field.value, 'yyyy-MM-dd'))
                          ) : (
                            <span>Chọn ngày hẹn tái khám (nếu có)</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          field.onChange(date);
                          setIsCalendarOpen(false);
                        }}
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0, 0, 0, 0))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lời dặn của bác sĩ</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Nhập lời dặn của bác sĩ..." 
                      className="min-h-[60px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </div>

      {/* Action buttons outside ScrollArea - always visible */}
      <div className="space-y-4 pt-4 border-t">
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Hủy
          </Button>
          <Button 
            type="submit" 
            disabled={isSaving} 
            className="flex-1"
            onClick={form.handleSubmit(onSubmit)}
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSaving ? 'Đang lưu...' : 'Lưu kết quả khám'}
          </Button>
        </div>
        
        {prescriptionItems.length > 0 && (
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => {
              // Create prescription object for printing
              const prescription: Prescription = {
                id: generatePrescriptionId([], DEFAULT_CLINIC_INFO.licenseNumber, 'C'),
                patientId: '', // Will be populated by parent
                patientName: appointment.patientName,
                patientAge: undefined,
                patientGender: undefined,
                patientWeight: undefined,
                patientAddress: undefined,
                doctorId: '',
                doctorName: appointment.doctorName,
                doctorLicense: undefined,
                medicalRecordId: '',
                appointmentId: appointment.id,
                date: appointment.date,
                diagnosis: form.getValues('diagnosis') || 'Đang cập nhật',
                symptoms: form.getValues('symptoms'),
                items: prescriptionItems,
                totalCost: prescriptionItems.reduce((sum, item) => sum + item.totalCost, 0),
                doctorNotes: form.getValues('notes'),
                nextAppointment: form.getValues('nextAppointment') ? format(form.getValues('nextAppointment')!, 'yyyy-MM-dd') : undefined,
                status: 'Finalized',
                validUntil: generatePrescriptionValidUntil(appointment.date),
                clinicInfo: DEFAULT_CLINIC_INFO,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };
              
              printPrescription(prescription);
            }}
          >
            🖨️ In đơn thuốc
          </Button>
        )}
        
        {onCreateInvoice && (
          <div>
            <Button
              type="button"
              variant="outline"
              onClick={onCreateInvoice}
              className="w-full"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Tạo hóa đơn (tùy chọn)
            </Button>
          </div>
        )}
      </div>
    </div>
  );
} 