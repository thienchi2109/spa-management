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
import { formatDate, generatePatientId } from '@/lib/utils';
import { DailyTimeline } from './components/daily-timeline';
import { AppointmentForm } from './components/appointment-form';
import { format } from 'date-fns';
import type { Appointment, Patient, Customer, Invoice, InvoiceItem, Staff, MedicalRecord } from '@/lib/types';
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
  const { toast } = useToast();

  // Use cached data from context
  const {
    appointments,
    customers: patients,
    invoices,
    staff,
    isLoadingAppointments,
    isLoadingCustomers,
    isLoadingInvoices,
    isLoadingStaff,
    addAppointmentOptimistic,
    updateAppointmentOptimistic,
    deleteAppointmentOptimistic,
    addCustomerOptimistic,
    updateCustomerOptimistic
  } = useData();



  const [invoiceCandidate, setInvoiceCandidate] = useState<Appointment | null>(null);

  // Filter state
  const [filters, setFilters] = useState<AppointmentFilters>({
    appointmentStatus: 'all',
    paymentStatus: 'all',
    staffMember: 'all'
  });


  useEffect(() => {
    setDate(new Date());
  }, []);

  const selectedDateString = date ? format(date, 'yyyy-MM-dd') : '';

  const appointmentsForSelectedDate = useMemo(() =>
    appointments.filter((app) => app.date === selectedDateString),
    [appointments, selectedDateString]
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
  }, [appointmentsForSelectedDate, searchTerm, filters, invoices]);

  const staffForDay = useMemo(() => {
    const staffNamesOnSchedule = [
      ...new Set(appointmentsForSelectedDate.map((app) => app.doctorName)),
    ];
    if (staffNamesOnSchedule.length === 0) {
      return [];
    }
    return staff.filter((s) => staffNamesOnSchedule.includes(s.name));
  }, [appointmentsForSelectedDate, staff]);

  const handleSaveAppointment = async (newAppointmentData: Omit<Appointment, 'id' | 'status'>) => {
    try {
      const appointmentToAdd = {
        ...newAppointmentData,
        status: 'Scheduled' as Appointment['status'],
      };
      
      // Use optimistic update from cached data context
      await addAppointmentOptimistic(appointmentToAdd, async () => {
        return await addAppointment(appointmentToAdd);
      });
      
      toast({
        title: 'Lưu thành công',
        description: 'Lịch hẹn đã được tạo.',
      });
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

  const handleSavePatient = async (patientData: Omit<Customer, 'id' | 'lastVisit' | 'avatarUrl' | 'tongChiTieu'>): Promise<Customer> => {
    try {
      // Generate custom patient ID
      const patientId = generatePatientId(patients);

      const patientToAdd = {
        ...patientData,
        id: patientId,
        lastVisit: new Date().toISOString().split('T')[0],
        avatarUrl: 'https://placehold.co/100x100.png',
        tongChiTieu: 0,
      };

      // Use optimistic update from cached data context
      const newPatient = await addCustomerOptimistic(patientToAdd, async () => {
        return await addPatient(patientToAdd);
      });
      
      toast({
        title: 'Thêm thành công',
        description: `Hồ sơ khách hàng ${newPatient.name} đã được tạo với mã ${patientId}.`,
      });
      return newPatient;
    } catch (error) {
      console.error("Error adding patient: ", error);
      toast({
        variant: 'destructive',
        title: 'Thêm thất bại',
        description: 'Đã có lỗi xảy ra khi thêm khách hàng mới.',
      });
      throw error; // Re-throw error to be caught by the caller form
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
    // For now, we'll show a toast indicating the feature is coming soon
    // In a full implementation, this would open an edit dialog
    toast({
      title: 'Tính năng đang phát triển',
      description: 'Chức năng chỉnh sửa lịch hẹn sẽ được cập nhật trong phiên bản tiếp theo.',
    });
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
  const isLoading = isLoadingAppointments || isLoadingCustomers || isLoadingStaff;
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Đang tải dữ liệu...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <Tabs defaultValue="timeline" className="space-y-4 flex flex-col h-full">
        <div className="flex items-center justify-between flex-wrap gap-y-4">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-headline font-bold spa-text-gradient">Lịch hẹn</h1>
            <TabsList className="spa-glass">
              <TabsTrigger value="timeline">Dòng thời gian</TabsTrigger>
              <TabsTrigger value="table">Bảng</TabsTrigger>
            </TabsList>
          </div>
          <div className="flex items-center gap-4 flex-wrap justify-end">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Tìm theo tên khách hàng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-[250px]"
              />
            </div>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? formatDate(format(date, 'yyyy-MM-dd')) : <span>Chọn ngày</span>}
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
            <Dialog open={isAppointmentDialogOpen} onOpenChange={setIsAppointmentDialogOpen}>
              <DialogTrigger asChild>
                <Button className="spa-button-accent">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Đặt lịch hẹn
                </Button>
              </DialogTrigger>
              <DialogContent className="spa-glass">
                <DialogHeader>
                  <DialogTitle className="text-xl font-headline">Lên lịch hẹn mới</DialogTitle>
                  <DialogDescription>
                    Điền thông tin chi tiết để lên lịch hẹn mới.
                  </DialogDescription>
                </DialogHeader>
                <AppointmentForm
                  selectedDate={date}
                  staff={staff}
                  appointments={appointments}
                  patients={patients}
                  onSave={handleSaveAppointment}
                  onSavePatient={handleSavePatient}
                  onClose={() => setIsAppointmentDialogOpen(false)}
                  editingAppointment={null}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <TabsContent value="timeline" className="flex-1 overflow-auto">
          <DailyTimeline appointments={dailyAppointments} staff={staffForDay} onUpdateStatus={handleUpdateAppointmentStatus} onUpdateInvoiceStatus={handleUpdateInvoiceStatus} invoices={invoices} onCreateInvoice={setInvoiceCandidate} onSaveMedicalRecord={handleSaveMedicalRecord} />
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
            onSaveMedicalRecord={handleSaveMedicalRecord}
            onEditAppointment={handleEditAppointment}
            onDeleteAppointment={handleDeleteAppointment}
            showResultsCount={true}
          />
        </TabsContent>
      </Tabs>

      {invoiceCandidate && (
        <Dialog open={!!invoiceCandidate} onOpenChange={(open) => !open && setInvoiceCandidate(null)}>
          <DialogContent className="sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle>Tạo hóa đơn</DialogTitle>
              <DialogDescription>Tạo hóa đơn cho cuộc hẹn đã hoàn thành.</DialogDescription>
            </DialogHeader>
            <POSInvoiceForm
              patientName={invoiceCandidate.patientName}
              date={invoiceCandidate.date}
              onSave={handleSaveInvoice}
              onClose={() => setInvoiceCandidate(null)}
            />
          </DialogContent>
        </Dialog>
      )}


    </div>
  );
}
