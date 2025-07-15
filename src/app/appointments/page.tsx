'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { appointments as mockAppointments, patients as mockPatients, staff as mockStaff, invoices as mockInvoices } from '@/lib/mock-data';
import { PlusCircle, Calendar as CalendarIcon, Search, UserPlus, Users, CreditCard, Loader2 } from 'lucide-react';
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
import { formatDate, calculateAge, generatePatientId } from '@/lib/utils';
import { DailyTimeline } from './components/daily-timeline';
import { AppointmentForm } from './components/appointment-form';
import { format } from 'date-fns';
import type { Appointment, Patient, Invoice, InvoiceItem, Staff, MedicalRecord } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppointmentsTable } from './components/appointments-table';
import { FindPatientForm } from './components/find-patient-form';
import { InvoiceForm } from '@/app/invoices/components/invoice-form';
import { AppointmentFiltersComponent, type AppointmentFilters } from './components/appointment-filters';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { addDoc, collection, doc, updateDoc, writeBatch, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { seedAndFetchCollection } from '@/lib/firestore-utils';
import { useToast } from '@/hooks/use-toast';


export default function AppointmentsPage() {
  const [date, setDate] = useState<Date | undefined>();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAppointmentDialogOpen, setIsAppointmentDialogOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const [walkInQueue, setWalkInQueue] = useState<Patient[]>([]);
  const [isWalkInDialogOpen, setIsWalkInDialogOpen] = useState(false);

  const [invoiceCandidate, setInvoiceCandidate] = useState<Appointment | null>(null);

  // Filter state
  const [filters, setFilters] = useState<AppointmentFilters>({
    appointmentStatus: 'all',
    paymentStatus: 'all',
    staffMember: 'all'
  });


  useEffect(() => {
    setDate(new Date());

    async function loadData() {
        try {
            const [patientsData, appointmentsData, invoicesData, staffData] = await Promise.all([
                seedAndFetchCollection('patients', mockPatients),
                seedAndFetchCollection('appointments', mockAppointments),
                seedAndFetchCollection('invoices', mockInvoices),
                seedAndFetchCollection('staff', mockStaff),
            ]);
            setPatients(patientsData);
            setAppointments(appointmentsData);
            setInvoices(invoicesData);
            setStaff(staffData);
        } catch (error) {
            console.error("Failed to load data from Firestore", error);
            toast({
                variant: 'destructive',
                title: 'Lỗi tải dữ liệu',
                description: 'Không thể tải dữ liệu từ máy chủ.'
            });
        } finally {
            setLoading(false);
        }
    }
    loadData();

  }, [toast]);

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
        const docRef = await addDoc(collection(db, 'appointments'), appointmentToAdd);
        const newAppointment = { ...appointmentToAdd, id: docRef.id };
        setAppointments(prev => [...prev, newAppointment]);
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
    let appointmentForInvoice: Appointment | undefined;
    const updatedAppointments = appointments.map(app => {
      if (app.id === appointmentId) {
        appointmentForInvoice = { ...app, status: newStatus };
        return appointmentForInvoice;
      }
      return app;
    });

    try {
        const appointmentRef = doc(db, 'appointments', appointmentId);
        await updateDoc(appointmentRef, { status: newStatus });
        setAppointments(updatedAppointments);

        toast({
            title: 'Cập nhật thành công',
            description: 'Trạng thái lịch hẹn đã được thay đổi.',
        });

        // Update patient's last visit date when appointment is completed
        if (newStatus === 'Completed' && appointmentForInvoice) {
            const patientToUpdate = patients.find(p => p.name === appointmentForInvoice!.patientName);
            if (patientToUpdate) {
                const patientRef = doc(db, 'patients', patientToUpdate.id);
                await updateDoc(patientRef, { lastVisit: appointmentForInvoice.date });
                
                const updatedPatients = patients.map(p => p.id === patientToUpdate.id ? { ...p, lastVisit: appointmentForInvoice!.date } : p);
                setPatients(updatedPatients);
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
        const invoiceRef = doc(db, 'invoices', invoiceId);
        await updateDoc(invoiceRef, { status: newStatus });
        const updatedInvoices = invoices.map(inv =>
          inv.id === invoiceId ? { ...inv, status: newStatus } : inv
        );
        setInvoices(updatedInvoices);
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

  const handleSavePatient = async (patientData: Omit<Patient, 'id' | 'lastVisit' | 'avatarUrl' | 'documents'>): Promise<Patient> => {
    try {
        // Generate custom patient ID
        const patientId = generatePatientId(patients);

        const patientToAdd = {
            ...patientData,
            id: patientId,
            lastVisit: new Date().toISOString().split('T')[0],
            avatarUrl: 'https://placehold.co/100x100.png',
            documents: [],
        };

        // Use setDoc with custom ID instead of addDoc
        await setDoc(doc(db, 'patients', patientId), patientToAdd);
        setPatients(prev => [...prev, patientToAdd]);
        toast({
            title: 'Thêm thành công',
            description: `Hồ sơ bệnh nhân ${patientToAdd.name} đã được tạo với mã ${patientId}.`,
        });
        return patientToAdd;
    } catch (error) {
        console.error("Error adding patient: ", error);
        toast({
            variant: 'destructive',
            title: 'Thêm thất bại',
            description: 'Đã có lỗi xảy ra khi thêm bệnh nhân mới.',
        });
        throw error; // Re-throw error to be caught by the caller form
    }
  };
  
  const handleSaveInvoice = async (invoiceData: { items: { id?: string; description: string; amount: number; }[] }, status: 'Paid' | 'Pending') => {
    if (!invoiceCandidate) return;

    try {
        const totalAmount = invoiceData.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
        const invoiceItems: InvoiceItem[] = invoiceData.items.map(item => ({
            id: item.id || new Date().toISOString(),
            description: item.description,
            amount: item.amount
        }));
        
        const invoiceToAdd = {
            patientName: invoiceCandidate.patientName,
            date: invoiceCandidate.date,
            items: invoiceItems,
            amount: totalAmount,
            status: status,
        };
        const docRef = await addDoc(collection(db, 'invoices'), invoiceToAdd);
        const newInvoice = { ...invoiceToAdd, id: docRef.id };
        setInvoices(prev => [...prev, newInvoice]);
        setInvoiceCandidate(null);
        toast({
            title: 'Tạo hóa đơn thành công',
            description: `Hóa đơn cho ${newInvoice.patientName} đã được tạo.`,
        });
    } catch (error) {
        console.error("Error adding invoice: ", error);
        toast({
            variant: 'destructive',
            title: 'Lỗi',
            description: 'Không thể tạo hóa đơn mới.',
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
        
        const docRef = await addDoc(collection(db, 'medicalRecords'), medicalRecordToAdd);
        const newMedicalRecord = { ...medicalRecordToAdd, id: docRef.id };
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

  const handleAddToWalkInQueue = (patient: Patient) => {
    setWalkInQueue(prev => {
        if (prev.some(p => p.id === patient.id)) {
            return prev;
        }
        return [...prev, patient];
    });
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
      // Delete from Firestore
      await deleteDoc(doc(db, 'appointments', appointmentId));

      // Update local state
      const updatedAppointments = appointments.filter(app => app.id !== appointmentId);
      setAppointments(updatedAppointments);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Tabs defaultValue="timeline" className="space-y-4 flex flex-col h-full">
        <div className="flex items-center justify-between flex-wrap gap-y-4">
          <div className="flex items-center gap-4">
              <h1 className="text-2xl font-headline font-bold">Lịch hẹn</h1>
              <TabsList>
                  <TabsTrigger value="timeline">Dòng thời gian</TabsTrigger>
                  <TabsTrigger value="table">Bảng</TabsTrigger>
              </TabsList>
          </div>
          <div className="flex items-center gap-4 flex-wrap justify-end">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Tìm theo tên bệnh nhân..."
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
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Đặt lịch khám
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Lên lịch hẹn mới</DialogTitle>
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
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Tạo hóa đơn</DialogTitle>
                    <DialogDescription>Tạo hóa đơn cho cuộc hẹn đã hoàn thành.</DialogDescription>
                </DialogHeader>
                <InvoiceForm
                    patientName={invoiceCandidate.patientName}
                    date={invoiceCandidate.date}
                    onSave={handleSaveInvoice}
                    onClose={() => setInvoiceCandidate(null)}
                />
            </DialogContent>
        </Dialog>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
                <CardTitle className="font-headline text-xl">Hàng chờ khám</CardTitle>
                <CardDescription>Quản lý bệnh nhân đến khám không có lịch hẹn.</CardDescription>
            </div>
             <Dialog open={isWalkInDialogOpen} onOpenChange={setIsWalkInDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Thêm vào hàng chờ
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Thêm bệnh nhân vào hàng chờ</DialogTitle>
                  <DialogDescription>
                    Tìm bệnh nhân đã có hoặc tạo hồ sơ mới để thêm vào hàng chờ.
                  </DialogDescription>
                </DialogHeader>
                 <FindPatientForm
                    patients={patients}
                    walkInQueue={walkInQueue}
                    onAddToQueue={handleAddToWalkInQueue}
                    onSaveNewPatient={handleSavePatient}
                    onClose={() => setIsWalkInDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
        </CardHeader>
        <CardContent>
          {walkInQueue.length === 0 ? (
            <div className="text-center text-muted-foreground py-10 border-2 border-dashed rounded-lg flex flex-col items-center justify-center">
              <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="font-semibold">Hàng chờ trống</p>
              <p className="text-sm">Hiện không có bệnh nhân nào đang chờ khám.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {walkInQueue.map((patient, index) => (
                <li key={patient.id} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                        {index + 1}
                    </span>
                    <div>
                        <p className="font-semibold">{patient.name}</p>
                        <p className="text-sm text-muted-foreground">
                            {calculateAge(patient.birthYear)} tuổi, {patient.phone}
                        </p>
                    </div>
                  </div>
                  <Button size="sm">Bắt đầu khám</Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
