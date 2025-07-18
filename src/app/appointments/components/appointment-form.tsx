'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';

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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon, UserPlus, Loader2, Plus, X, Check } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import type { Appointment, Staff, Customer, SpaService, AppointmentService } from '@/lib/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { SimplifiedCustomerForm } from './simplified-customer-form';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { useData } from '@/contexts/data-context';

const appointmentServiceSchema = z.object({
  serviceId: z.string(),
  serviceName: z.string(),
  quantity: z.number().min(1),
  unitPrice: z.number().min(0),
  totalPrice: z.number().min(0),
  discount: z.number().min(0).optional(),
});

const baseAppointmentFormSchema = z.object({
  patientName: z.string({ required_error: 'Vui lòng chọn khách hàng.' }).min(1, 'Vui lòng chọn khách hàng.'),
  doctorName: z.string({ required_error: 'Vui lòng chọn kỹ thuật viên.' }),
  schedulerName: z.string({ required_error: 'Vui lòng chọn nhân viên giữ lịch.' }),
  date: z.date({ required_error: 'Vui lòng chọn ngày.' }),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Thời gian không hợp lệ (HH:mm).' }),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Thời gian không hợp lệ (HH:mm).' }),
  services: z.array(appointmentServiceSchema).optional(),
}).refine(data => {
  if (!data.startTime || !data.endTime) return true;
  return data.endTime > data.startTime;
}, {
    message: "Thời gian kết thúc phải sau thời gian bắt đầu.",
    path: ["endTime"],
});

type AppointmentFormValues = z.infer<typeof baseAppointmentFormSchema>;

interface AppointmentFormProps {
    selectedDate?: Date;
    staff: Staff[];
    appointments: Appointment[];
    patients: Customer[];
    services: SpaService[];
    onSave: (appointment: Omit<Appointment, 'id'>) => Promise<void>;
    onSavePatient: (patientData: Omit<Customer, 'id' | 'lastVisit' | 'avatarUrl' | 'tongChiTieu' | 'createdAt'>) => Promise<Customer | undefined>;
    onClose: () => void;
    editingAppointment?: Appointment | null;
}

export function AppointmentForm({ selectedDate, staff, appointments, patients, services, onSave, onSavePatient, onClose, editingAppointment }: AppointmentFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [isPatientListVisible, setIsPatientListVisible] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showServiceDialog, setShowServiceDialog] = useState(false);
  const [selectedServices, setSelectedServices] = useState<AppointmentService[]>([]);
  const [dialogSelectedServices, setDialogSelectedServices] = useState<SpaService[]>([]);

  const { currentUser } = useAuth();
  const { refetchCustomers } = useData();

  const filteredPatients = useMemo(() => {
    if (!patientSearch) return [];
    return patients.filter((patient) =>
      patient.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
      patient.phone?.toLowerCase().includes(patientSearch.toLowerCase()) ||
      patient.address?.toLowerCase().includes(patientSearch.toLowerCase())
    );
  }, [patientSearch, patients]);

  const appointmentFormSchema = useMemo(() => {
    return baseAppointmentFormSchema.refine(
      (data) => {
        if (!data.date || !data.doctorName) return true;
        const hasConflict = appointments.some(app =>
            app.id !== editingAppointment?.id &&
            app.doctorName === data.doctorName &&
            app.date === format(data.date, 'yyyy-MM-dd') &&
            app.status === 'Scheduled' &&
            data.startTime < app.endTime &&
            data.endTime > app.startTime
        );
        return !hasConflict;
      },
      {
        message: "Kỹ thuật viên đã có lịch hẹn khác trong khung giờ này.",
        path: ["startTime"],
      }
    );
  }, [appointments, editingAppointment]);

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      patientName: '',
      doctorName: '',
      schedulerName: currentUser?.name || '',
      date: selectedDate || new Date(),
      startTime: '',
      endTime: '',
      services: [],
    },
  });

  useEffect(() => {
    if (editingAppointment) {
      form.reset({
        patientName: editingAppointment.patientName || '',
        doctorName: editingAppointment.doctorName || '',
        schedulerName: editingAppointment.schedulerName || '',
        date: new Date(editingAppointment.date),
        startTime: editingAppointment.startTime || '',
        endTime: editingAppointment.endTime || '',
        services: editingAppointment.services || [],
      });
      setPatientSearch(editingAppointment.patientName || '');
      setSelectedServices(editingAppointment.services || []);
    } else {
      form.reset({
        patientName: '',
        doctorName: '',
        schedulerName: currentUser?.name || '',
        date: selectedDate || new Date(),
        startTime: '',
        endTime: '',
        services: [],
      });
      setPatientSearch('');
      setSelectedServices([]);
    }
  }, [editingAppointment, selectedDate, currentUser, form]);

  async function handleSaveNewCustomer(customerData: Omit<Customer, 'id' | 'lastVisit' | 'avatarUrl' | 'tongChiTieu' | 'createdAt'>) {
    try {
      const newPatient = await onSavePatient(customerData);
      
      if (newPatient) {
        // Update form with new patient's name
        form.setValue('patientName', newPatient.name, { shouldValidate: true });
        setPatientSearch(newPatient.name);
        
        // Close the customer form dialog and refresh patient list
        setShowCustomerForm(false);
        await refetchCustomers();
        
        return newPatient;
      }
    } catch (error) {
      console.error('Failed to save and update form with new customer:', error);
      // Let the caller handle the error toast
      throw error;
    }
  }

  const handleRemoveService = (serviceId: string) => {
    setSelectedServices(prev => prev.filter(s => s.serviceId !== serviceId));
  };

  const handleUpdateServiceQuantity = (serviceId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveService(serviceId);
      return;
    }
    setSelectedServices(prev => prev.map(service =>
      service.serviceId === serviceId
        ? { ...service, quantity, totalPrice: quantity * service.unitPrice }
        : service
    ));
  };

  const getTotalServiceAmount = () => {
    return selectedServices.reduce((total, service) => total + service.totalPrice, 0);
  };

  const handleOpenServiceDialog = () => {
    const currentlySelectedFullServices = services.filter(service =>
      selectedServices.some(ss => ss.serviceId === service.id)
    );
    setDialogSelectedServices(currentlySelectedFullServices);
    setShowServiceDialog(true);
  };

  const handleToggleServiceInDialog = (service: SpaService) => {
    setDialogSelectedServices(prev => {
      const isSelected = prev.some(s => s.id === service.id);
      if (isSelected) {
        return prev.filter(s => s.id !== service.id);
      } else {
        return [...prev, service];
      }
    });
  };

  const handleConfirmServiceSelection = () => {
    const newAppointmentServices: AppointmentService[] = dialogSelectedServices.map(service => {
      const existingService = selectedServices.find(ss => ss.serviceId === service.id);
      if (existingService) {
        return existingService;
      }
      const effectivePrice = service.discountPrice && service.discountPrice < service.price
        ? service.discountPrice
        : service.price;
      return {
        serviceId: service.id,
        serviceName: service.name,
        quantity: 1,
        unitPrice: effectivePrice,
        totalPrice: effectivePrice,
        discount: 0,
      };
    });
    setSelectedServices(newAppointmentServices);
    setShowServiceDialog(false);
  };

  async function onSubmit(data: AppointmentFormValues) {
    setIsSaving(true);
    try {
      const appointmentData = {
        patientName: data.patientName,
        doctorName: data.doctorName,
        schedulerName: data.schedulerName,
        date: format(data.date, 'yyyy-MM-dd'),
        startTime: data.startTime,
        endTime: data.endTime,
        status: editingAppointment ? editingAppointment.status : 'Scheduled',
        services: selectedServices,
      };
      await onSave(appointmentData);
      if (!editingAppointment) {
        form.reset({
          patientName: '',
          doctorName: '',
          schedulerName: currentUser?.name || '',
          date: selectedDate,
          startTime: '',
          endTime: '',
          services: [],
        });
        setPatientSearch('');
        setSelectedServices([]);
      }
      onClose();
    } catch (error) {
      console.error('Error saving appointment:', error);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="patientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên Khách hàng</FormLabel>
                  <div className="flex gap-2">
                    <div className="relative w-full">
                      <FormControl>
                        <Input
                          placeholder="Tìm theo tên, SĐT, địa chỉ..."
                          value={patientSearch}
                          onChange={(e) => {
                            setPatientSearch(e.target.value);
                            if (field.value) field.onChange(undefined);
                            if (!isPatientListVisible) setIsPatientListVisible(true);
                          }}
                          onFocus={() => setIsPatientListVisible(true)}
                          onBlur={() => setTimeout(() => setIsPatientListVisible(false), 200)}
                        />
                      </FormControl>
                      {isPatientListVisible && patientSearch && (
                        <div className="absolute top-full mt-1 w-full z-20">
                          <Card>
                            <ScrollArea className="h-auto max-h-48">
                              <CardContent className="p-2">
                                {filteredPatients.length > 0 ? (
                                  filteredPatients.map((p) => (
                                    <div
                                      key={p.id}
                                      className="p-2 text-sm hover:bg-accent rounded-md cursor-pointer"
                                      onMouseDown={(e) => {
                                          e.preventDefault();
                                          field.onChange(p.name);
                                          setPatientSearch(p.name);
                                          setIsPatientListVisible(false);
                                      }}
                                    >
                                      <div className="font-medium">{p.name}</div>
                                      <div className="text-xs text-muted-foreground">{p.phone} • {p.address}</div>
                                    </div>
                                  ))
                                ) : (
                                  <p className="p-2 text-center text-sm text-muted-foreground">Không tìm thấy khách hàng.</p>
                                )}
                              </CardContent>
                            </ScrollArea>
                          </Card>
                        </div>
                      )}
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button type="button" variant="outline" size="icon" className="flex-shrink-0" onClick={() => setShowCustomerForm(true)}>
                          <UserPlus className="h-4 w-4" />
                          <span className="sr-only">Thêm khách hàng mới</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Thêm khách hàng mới</p></TooltipContent>
                    </Tooltip>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
                control={form.control}
                name="doctorName"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Kỹ thuật viên</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                        <SelectTrigger><SelectValue placeholder="Chọn kỹ thuật viên" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {staff.map((staffMember) => (
                            <SelectItem key={staffMember.id} value={staffMember.name}>{staffMember.name} ({staffMember.role})</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
              control={form.control}
              name="schedulerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nhân viên giữ lịch</FormLabel>
                  <FormControl>
                    <Input {...field} disabled className="bg-muted cursor-not-allowed" placeholder="Tự động điền từ người dùng hiện tại" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Ngày</FormLabel>
                  <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                          {field.value ? formatDate(format(field.value, 'yyyy-MM-dd')) : <span>Chọn ngày</span>}
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
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Giờ bắt đầu</FormLabel>
                    <FormControl><Input type="time" {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Giờ kết thúc</FormLabel>
                    <FormControl><Input type="time" {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FormLabel>Dịch vụ</FormLabel>
                <Button type="button" variant="outline" size="sm" onClick={handleOpenServiceDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm dịch vụ
                </Button>
              </div>
              {selectedServices.length > 0 && (
                <div className="space-y-2">
                  {selectedServices.map((service) => (
                    <div key={service.serviceId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{service.serviceName}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(service.unitPrice)} x {service.quantity}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(service.totalPrice)}
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveService(service.serviceId)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="text-right text-sm font-medium pt-2 border-t">
                    Tổng: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(getTotalServiceAmount())}
                  </div>
                </div>
              )}
              {selectedServices.length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-4 border-2 border-dashed rounded-lg">
                  Chưa chọn dịch vụ nào
                </div>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSaving ? 'Đang lưu...' : (editingAppointment ? 'Lưu thay đổi' : 'Lưu lịch hẹn')}
            </Button>
          </form>
        </Form>
      
      <Dialog open={showCustomerForm} onOpenChange={setShowCustomerForm}>
        <DialogContent className="spa-dialog max-w-[95vw] sm:max-w-md max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="mobile-text-lg">Thêm hồ sơ khách hàng mới</DialogTitle>
            <DialogDescription className="mobile-text-sm">
              Nhập thông tin chi tiết cho khách hàng mới. Thông tin sẽ được tự động điền vào form lịch hẹn.
            </DialogDescription>
          </DialogHeader>
          <SimplifiedCustomerForm
            onSave={async (customerData) => {
              const convertGender = (gender: 'Nam' | 'Nữ' | 'Khác'): 'Male' | 'Female' | 'Other' => {
                switch (gender) {
                  case 'Nam': return 'Male';
                  case 'Nữ': return 'Female';
                  default: return 'Other';
                }
              };
              
              const customerToSave = {
                name: customerData.name,
                phone: customerData.phone,
                address: customerData.address || '',
                gender: convertGender(customerData.gender),
                birthYear: customerData.birthYear || 0,
              };
              
              await handleSaveNewCustomer(customerToSave);
            }}
            onClose={() => setShowCustomerForm(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showServiceDialog} onOpenChange={setShowServiceDialog}>
        <DialogContent className="spa-dialog max-w-[95vw] sm:max-w-4xl max-h-[95vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="mobile-text-lg">Chọn dịch vụ</DialogTitle>
            <DialogDescription className="mobile-text-sm">
              Nhấp để chọn hoặc bỏ chọn nhiều dịch vụ. Nhấn "Xác nhận" để lưu.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="space-y-6 p-1">
              {Object.entries(
                services
                  .filter(service => service.isActive)
                  .reduce((acc, service) => {
                    if (!acc[service.category]) acc[service.category] = [];
                    acc[service.category].push(service);
                    return acc;
                  }, {} as Record<string, SpaService[]>)
              ).map(([category, categoryServices]) => (
                <div key={category} className="space-y-3">
                  <h3 className="font-semibold text-lg border-b pb-2">{category}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categoryServices.map((service) => {
                      const isSelected = dialogSelectedServices.some(s => s.id === service.id);
                      return (
                        <Card
                          key={service.id}
                          className={cn(
                            "cursor-pointer hover:shadow-lg transition-all duration-200 relative border-2",
                            isSelected ? "border-primary bg-primary/5" : "border-transparent"
                          )}
                          onClick={() => handleToggleServiceInDialog(service)}
                        >
                          {isSelected && (
                            <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1 z-10">
                              <Check className="h-4 w-4" />
                            </div>
                          )}
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-base">{service.name}</h4>
                                <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                  <span>{service.duration} phút</span>
                                  {service.requiredStaff && <span>• {Array.isArray(service.requiredStaff) ? service.requiredStaff.join(', ') : service.requiredStaff}</span>}
                                </div>
                              </div>
                              <div className="text-right ml-4 flex-shrink-0">
                                {service.discountPrice && service.discountPrice < service.price ? (
                                  <div className="space-y-1">
                                    <div className="text-sm font-medium text-green-600">
                                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(service.discountPrice)}
                                    </div>
                                    <div className="text-xs text-muted-foreground line-through">
                                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(service.price)}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-sm font-medium">
                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(service.price)}
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-shrink-0 flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowServiceDialog(false)}>Hủy</Button>
            <Button onClick={handleConfirmServiceSelection}>Xác nhận</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
