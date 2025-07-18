'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Calendar as CalendarIcon, Search, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { formatDate, generateKhachHangId } from '@/lib/utils';
import { DailyTimeline } from './components/daily-timeline';
import { AppointmentForm } from './components/appointment-form';
import { format } from 'date-fns';
import type { Appointment, Customer, Invoice, InvoiceItem, Staff, MedicalRecord } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppointmentsTable } from './components/appointments-table';

import { POSInvoiceForm } from '@/app/invoices/components/pos-invoice-form';
import { AppointmentFiltersComponent, type AppointmentFilters } from './components/appointment-filters';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  addAppointment,
  updateAppointment,
  deleteAppointment,
  addPatient,
  updatePatient,
  addCustomer,
  addInvoice,
  updateInvoice,
  addMedicalRecord
} from '@/lib/sheets-utils';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/contexts/data-context';


export default function AppointmentsPage() {
  const [date, setDate] = useState<Date | undefined>();
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [isAppointmentDialogOpen, setIsAppointmentDialogOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { toast } = useToast();

  // Use cached data from context
  const {
    appointments,
    customers: patients,
    invoices,
    staff,
    services,
    isLoadingAppointments,
    isLoadingCustomers,
    isLoadingInvoices,
    isLoadingStaff,
    isLoadingServices,
    addAppointmentOptimistic,
    updateAppointmentOptimistic,
    deleteAppointmentOptimistic,
    addCustomerOptimistic,
    updateCustomerOptimistic
  } = useData();



  const [invoiceCandidate, setInvoiceCandidate] = useState<Appointment | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<AppointmentFilters>({
    appointmentStatus: 'all',
    paymentStatus: 'all',
    staffMember: 'all'
  });


  useEffect(() => {
    setDate(new Date());
  }, []);

  // Debug: Log when appointments change
  useEffect(() => {
    console.log('📅 Appointments data updated:', appointments.length, 'appointments');
  }, [appointments]);

  const selectedDateString = date ? format(date, 'yyyy-MM-dd') : '';

  const appointmentsForSelectedDate = useMemo(() =>
    appointments.filter((app) => app.date === selectedDateString),
    [appointments, selectedDateString, refreshTrigger]
  );

  const dailyAppointments = useMemo(() => {
    let filteredAppointments = appointmentsForSelectedDate.filter((app) =>
      app.patientName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Apply appointment status filter
    if (filters.appointmentStatus !== 'all') {
      filteredAppointments = filteredAppointments.filter(app =>
        app.status === filters.appointmentStatus
      );
    }

    // Apply staff member filter
    if (filters.staffMember !== 'all') {
      filteredAppointments = filteredAppointments.filter(app =>
        app.doctorName === filters.staffMember
      );
    }

    // Apply payment status filter
    if (filters.paymentStatus !== 'all') {
      filteredAppointments = filteredAppointments.filter(app => {
        const invoice = invoices.find(inv =>
          inv.patientName === app.patientName && inv.date === app.date
        );
        return invoice ? invoice.status === filters.paymentStatus : filters.paymentStatus === 'Pending';
      });
    }

    return filteredAppointments;
  }, [appointmentsForSelectedDate, searchTerm, filters, invoices, refreshTrigger]);

  const staffForDay = useMemo(() => {
    const activeStaff = staff.filter(s => s.role !== 'admin');
    const staffNamesOnSchedule = [
      ...new Set(appointmentsForSelectedDate.map((app) => app.doctorName)),
    ];
    const scheduledStaff = activeStaff.filter((s) => staffNamesOnSchedule.includes(s.name));
    
    // If no one is scheduled, show all active staff as options
    if (scheduledStaff.length === 0) {
      return activeStaff;
    }
    
    return scheduledStaff;
  }, [appointmentsForSelectedDate, staff]);

  const handleSaveAppointment = async (newAppointmentData: Omit<Appointment, 'id' | 'status'>) => {
    try {
      // Generate a temporary ID for optimistic update
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const appointmentToAdd = {
        ...newAppointmentData,
        id: tempId,
        status: 'Scheduled' as Appointment['status'],
      };

      // Use optimistic update from cached data context
      const result = await addAppointmentOptimistic(appointmentToAdd, async () => {
        // Remove the temp ID before sending to API
        const { id, ...dataWithoutId } = appointmentToAdd;
        return await addAppointment(dataWithoutId);
      });

      // Close dialog after successful save
      setIsAppointmentDialogOpen(false);

      // Trigger UI refresh
      setRefreshTrigger(prev => prev + 1);

      toast({
        title: 'Lưu thành công',
        description: 'Lịch hẹn đã được tạo.',
      });

      console.log('✅ Appointment added successfully:', result);
    } catch (error) {
      console.error("Error adding appointment: ", error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể tạo lịch hẹn mới.',
      });
    }
  };

  const handleUpdateAppointmentStatus = async (appointmentId: string, newStatus: Appointment['status']) => {
    try {
      const appointmentToUpdate = appointments.find(app => app.id === appointmentId);
      if (!appointmentToUpdate) return;

      const updatedAppointment = { ...appointmentToUpdate, status: newStatus };

      // Use optimistic update from cached data context
      await updateAppointmentOptimistic(updatedAppointment, async () => {
        return await updateAppointment(updatedAppointment);
      });

      toast({
        title: 'Cập nhật thành công',
        description: 'Trạng thái lịch hẹn đã được thay đổi.',
      });

      // When appointment is completed, auto-create invoice if services exist
      if (newStatus === 'Completed' && appointmentToUpdate.services && appointmentToUpdate.services.length > 0) {
        await handleAutoCreateInvoice(appointmentToUpdate);
      }

      // Update patient's last visit date when appointment is completed
      if (newStatus === 'Completed') {
        const patientToUpdate = patients.find(p => p.name === appointmentToUpdate.patientName);
        if (patientToUpdate) {
          const updatedPatient = { ...patientToUpdate, lastVisit: appointmentToUpdate.date };

          // Use optimistic update for patient as well
          await updateCustomerOptimistic(updatedPatient, async () => {
            return await updatePatient(updatedPatient);
          });
        }
      }
    } catch (error) {
      console.error("Error updating appointment status: ", error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể cập nhật trạng thái lịch hẹn.',
      });
    }
  };

  const handleAutoCreateInvoice = async (appointment: Appointment) => {
    if (!appointment.services || appointment.services.length === 0) return;

    try {
      const invoiceItems: InvoiceItem[] = appointment.services.map(service => ({
        name: service.serviceName,
        quantity: service.quantity,
        price: service.unitPrice
      }));

      const totalAmount = appointment.services.reduce((total, service) => total + service.totalPrice, 0);

      const invoiceToAdd = {
        patientName: appointment.patientName,
        date: appointment.date,
        items: invoiceItems,
        amount: totalAmount,
        status: 'Pending' as Invoice['status'],
        discount: 0,
        notes: `Tự động tạo từ lịch hẹn ${appointment.id}`,
      };

      // Use direct API call for invoices
      const newInvoice = await addInvoice(invoiceToAdd);

      toast({
        title: 'Tạo hóa đơn thành công',
        description: `Hóa đơn đã được tạo tự động cho ${appointment.patientName} với ${appointment.services.length} dịch vụ.`,
      });

      console.log('✅ Auto-created invoice:', newInvoice);
    } catch (error) {
      console.error("Error auto-creating invoice: ", error);
      toast({
        variant: 'destructive',
        title: 'Lỗi tạo hóa đơn',
        description: 'Không thể tạo hóa đơn tự động. Vui lòng tạo thủ công.',
      });
    }
  };

  const handleUpdateInvoiceStatus = async (invoiceId: string, newStatus: Invoice['status']) => {
    try {
      // Find and update invoice in Google Sheets
      const invoiceToUpdate = invoices.find(inv => inv.id === invoiceId);
      if (invoiceToUpdate) {
        const updatedInvoice = { ...invoiceToUpdate, status: newStatus };
        await updateInvoice(updatedInvoice);
      }

      toast({
        title: 'Thanh toán thành công',
        description: 'Trạng thái hóa đơn đã được cập nhật.',
      });
    } catch (error) {
      console.error("Error updating invoice status: ", error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể cập nhật trạng thái hóa đơn.',
      });
    }
  };

  const handleSavePatient = async (patientData: Omit<Customer, 'id' | 'lastVisit' | 'avatarUrl' | 'tongChiTieu' | 'createdAt'>): Promise<Customer> => {
    try {
      const newPatientId = generateKhachHangId(patients);
      const newPatient: Customer = {
        id: newPatientId,
        ...patientData,
        lastVisit: '',
        avatarUrl: '',
        tongChiTieu: 0,
        createdAt: new Date().toISOString(),
      };

      const result = await addCustomerOptimistic(newPatient, async () => {
         return await addCustomer(newPatient);
      });
      
      toast({
        title: 'Thêm thành công',
        description: 'Đã thêm khách hàng mới.',
      });

      // After saving, return the new patient data
      return result;
    } catch (error) {
      console.error("Error adding patient: ", error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể thêm khách hàng.',
      });
      // Re-throw the error to be caught by the caller if needed
      throw error;
    }
  };

  const handleSaveInvoice = async (invoiceData: {
    items: Array<{
      name: string;
      quantity: number;
      price: number;
    }>;
    totalAmount: number;
    discount: number;
    notes?: string;
  }, status: 'Paid' | 'Pending') => {
    if (!invoiceCandidate) return;

    try {
      const invoiceItems: InvoiceItem[] = invoiceData.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price
      }));

      const invoiceToAdd = {
        patientName: invoiceCandidate.patientName,
        date: invoiceCandidate.date,
        items: invoiceItems,
        amount: invoiceData.totalAmount,
        status: status,
        discount: invoiceData.discount,
        notes: invoiceData.notes,
      };

      // Use direct API call for invoices (no optimistic update available yet)
      const newInvoice = await addInvoice(invoiceToAdd);
      setInvoiceCandidate(null);
      
      // Update customer spending if payment is completed
      if (status === 'Paid') {
        const customerToUpdate = patients.find(p => p.name === invoiceCandidate.patientName);
        if (customerToUpdate) {
          const updatedCustomer = { 
            ...customerToUpdate, 
            tongChiTieu: customerToUpdate.tongChiTieu + invoiceData.totalAmount 
          };
          await updateCustomerOptimistic(updatedCustomer, async () => {
            return await updatePatient(updatedCustomer);
          });
        }
      }
      
      toast({
        title: 'Tạo hóa đơn thành công',
        description: `Hóa đơn POS cho ${newInvoice.patientName} đã được tạo với ${invoiceData.items.length} dịch vụ.`,
      });
    } catch (error) {
      console.error("Error adding POS invoice: ", error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể tạo hóa đơn POS mới.',
      });
    }
  };

  const handleSaveMedicalRecord = async (recordData: Omit<MedicalRecord, 'id'>) => {
    try {
      // Find patient ID based on patient name
      const patient = patients.find(p => p.name === recordData.patientName);
      const medicalRecordToAdd = {
        ...recordData,
        patientId: patient?.id || '',
      };

      // Use Google Sheets instead of Firestore
      const newMedicalRecord = await addMedicalRecord(medicalRecordToAdd);
      setMedicalRecords(prev => [...prev, newMedicalRecord]);

      toast({
        title: 'Lưu thành công',
        description: 'Kết quả khám bệnh đã được ghi nhận.',
      });
    } catch (error) {
      console.error("Error saving medical record: ", error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể lưu kết quả khám bệnh.',
      });
    }
  };



  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setIsEditDialogOpen(true);
  };

  const handleUpdateAppointment = async (updatedAppointmentData: Omit<Appointment, 'id'>) => {
    if (!editingAppointment) return;

    try {
      const updatedAppointment = {
        ...updatedAppointmentData,
        id: editingAppointment.id,
      };

      // Use optimistic update from cached data context
      await updateAppointmentOptimistic(updatedAppointment, async () => {
        return await updateAppointment(updatedAppointment);
      });

      setEditingAppointment(null);
      setIsEditDialogOpen(false);
      
      toast({
        title: 'Cập nhật thành công',
        description: 'Thông tin lịch hẹn đã được cập nhật.',
      });
    } catch (error) {
      console.error("Error updating appointment: ", error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể cập nhật lịch hẹn.',
      });
    }
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    try {
      // Use optimistic update from cached data context
      await deleteAppointmentOptimistic(appointmentId, async () => {
        return await deleteAppointment(appointmentId);
      });

      toast({
        title: 'Xóa thành công',
        description: 'Lịch hẹn đã được xóa khỏi hệ thống.',
      });
    } catch (error) {
      console.error("Error deleting appointment: ", error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể xóa lịch hẹn. Vui lòng thử lại.',
      });
    }
  };

  // Show loading state while any critical data is loading
  const isLoading = isLoadingAppointments || isLoadingCustomers || isLoadingStaff || isLoadingServices;
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Đang tải dữ liệu...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-8 animate-fade-in">
      <Tabs defaultValue="timeline" className="space-y-4 flex flex-col h-full">
        {/* Mobile-optimized header */}
        <div className="space-y-4">
          {/* Title and View Toggle - Mobile First */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <h1 className="text-2xl sm:text-3xl font-headline font-bold spa-text-gradient">Lịch hẹn</h1>
              <TabsList className="spa-glass w-fit">
                <TabsTrigger value="timeline" className="text-xs sm:text-sm">Dòng thời gian</TabsTrigger>
                <TabsTrigger value="table" className="text-xs sm:text-sm">Bảng</TabsTrigger>
              </TabsList>
            </div>
            
            {/* Mobile: New Appointment Button - Prominent */}
            <div className="sm:hidden">
              <Button
                className="spa-button-accent w-full"
                onClick={() => setIsAppointmentDialogOpen(true)}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Đặt lịch hẹn
              </Button>
            </div>
          </div>

          {/* Controls Row - Mobile Optimized */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            {/* Left side: Search and Date Picker */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 flex-1">
              {/* Search - Full width on mobile */}
              <div className="relative flex-1 sm:max-w-[300px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Tìm theo tên khách hàng..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
              
              {/* Date Picker */}
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex-1 sm:w-auto">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    <span className="truncate">
                      {date ? formatDate(format(date, 'yyyy-MM-dd')) : 'Chọn ngày'}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(selectedDate) => {
                      setDate(selectedDate);
                      setIsCalendarOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            {/* Right side: Desktop New Appointment Button */}
            <div className="hidden sm:block">
              <Button
                className="spa-button-accent"
                onClick={() => setIsAppointmentDialogOpen(true)}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Đặt lịch hẹn
              </Button>
            </div>
          </div>
        </div>
        <TabsContent value="timeline" className="flex-1 overflow-auto">
          <DailyTimeline appointments={dailyAppointments} staff={staffForDay} onUpdateStatus={handleUpdateAppointmentStatus} onUpdateInvoiceStatus={handleUpdateInvoiceStatus} invoices={invoices} onCreateInvoice={setInvoiceCandidate} onEditAppointment={handleEditAppointment} />
        </TabsContent>
        <TabsContent value="table" className="flex-1 overflow-auto space-y-4">
          <AppointmentFiltersComponent
            filters={filters}
            onFiltersChange={setFilters}
            staff={staff}
          />
          <AppointmentsTable
            appointments={dailyAppointments}
            staff={staff}
            onUpdateStatus={handleUpdateAppointmentStatus}
            onUpdateInvoiceStatus={handleUpdateInvoiceStatus}
            invoices={invoices}
            onCreateInvoice={setInvoiceCandidate}
            onEditAppointment={handleEditAppointment}
            onDeleteAppointment={handleDeleteAppointment}
            showResultsCount={true}
          />
        </TabsContent>
      </Tabs>

      {invoiceCandidate && (
        <Dialog open={!!invoiceCandidate} onOpenChange={(open) => !open && setInvoiceCandidate(null)}>
          <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="mobile-text-lg">Tạo hóa đơn</DialogTitle>
              <DialogDescription className="mobile-text-sm">Tạo hóa đơn cho cuộc hẹn đã hoàn thành.</DialogDescription>
            </DialogHeader>
            <POSInvoiceForm
              patientName={invoiceCandidate.patientName}
              date={invoiceCandidate.date}
              preSelectedServices={invoiceCandidate.services}
              onSave={handleSaveInvoice}
              onClose={() => setInvoiceCandidate(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {editingAppointment && (
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
          if (!open) {
            setEditingAppointment(null);
            setIsEditDialogOpen(false);
          }
        }}>
          <DialogContent className="spa-dialog max-w-[95vw] sm:max-w-4xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="mobile-text-lg font-headline">Chỉnh sửa lịch hẹn</DialogTitle>
              <DialogDescription className="mobile-text-sm">
                Cập nhật thông tin chi tiết cho lịch hẹn.
              </DialogDescription>
            </DialogHeader>
            <AppointmentForm
              selectedDate={new Date(editingAppointment.date)}
              staff={staff}
              appointments={appointments}
              patients={patients}
              services={services}
              onSave={handleUpdateAppointment}
              onSavePatient={handleSavePatient}
              onClose={() => {
                setEditingAppointment(null);
                setIsEditDialogOpen(false);
              }}
              editingAppointment={editingAppointment}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* New Appointment Dialog */}
      <Dialog open={isAppointmentDialogOpen} onOpenChange={setIsAppointmentDialogOpen}>
        <DialogContent className="spa-dialog max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-hidden">
          <div className="flex flex-col max-h-full">
            <DialogHeader className="flex-shrink-0 space-y-2 pb-4">
              <DialogTitle className="text-lg sm:text-xl font-headline">Lên lịch hẹn mới</DialogTitle>
              <DialogDescription className="text-sm">
                Điền thông tin chi tiết để lên lịch hẹn mới.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto">
              <AppointmentForm
                selectedDate={date}
                staff={staff}
                appointments={appointments}
                patients={patients}
                services={services}
                onSave={handleSaveAppointment}
                onSavePatient={handleSavePatient}
                onClose={() => setIsAppointmentDialogOpen(false)}
                editingAppointment={null}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
