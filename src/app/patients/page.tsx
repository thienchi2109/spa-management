
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { appointments as mockAppointments, invoices as mockInvoices, patients as mockPatients, medicalRecords as mockMedicalRecords, staticToday } from '@/lib/mock-data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UploadCloud, Phone, MapPin, HeartPulse, Loader2, Search, X, Trash2 } from 'lucide-react';
import type { Patient, Appointment, Invoice, MedicalRecord } from '@/lib/types';
import { formatDate, calculateAge, generatePatientId } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { PatientForm } from './components/patient-form';
import { PatientDetail } from './components/patient-detail';
import { seedAndFetchCollection, addPatient, updatePatient, deletePatient } from '@/lib/sheets-utils';
import { useToast } from '@/hooks/use-toast';

const translateGender = (gender: Patient['gender']) => {
    switch(gender) {
        case 'Male': return 'Nam';
        case 'Female': return 'Nữ';
        case 'Other': return 'Khác';
        default: return gender;
    }
}

export default function PatientsPage() {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        async function loadData() {
            try {
                const [patientsData, appointmentsData, invoicesData, medicalRecordsData] = await Promise.all([
                    seedAndFetchCollection('patients', mockPatients),
                    seedAndFetchCollection('appointments', mockAppointments),
                    seedAndFetchCollection('invoices', mockInvoices),
                    seedAndFetchCollection('medicalRecords', mockMedicalRecords),
                ]);
                setPatients(patientsData);
                setAppointments(appointmentsData);
                setInvoices(invoicesData);
                setMedicalRecords(medicalRecordsData);
            } catch (error) {
                console.error("Failed to load data from Firestore", error);
                toast({
                    variant: 'destructive',
                    title: 'Lỗi tải dữ liệu',
                    description: 'Không thể tải dữ liệu bệnh nhân từ máy chủ.'
                });
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [toast]);

    // Utility function to normalize Vietnamese text for search
    const normalizeVietnameseText = useCallback((text: string): string => {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
            .replace(/đ/g, 'd')
            .replace(/Đ/g, 'd');
    }, []);

    // Get patients with appointments or in walk-in queue for today
    const getTodayRelevantPatients = useCallback(() => {
        // Use actual today date instead of static date
        const actualToday = new Date().toISOString().split('T')[0];

        console.log('=== DEBUG getTodayRelevantPatients ===');
        console.log('Total appointments loaded:', appointments.length);
        console.log('staticToday (old):', staticToday);
        console.log('actualToday (using this):', actualToday);

        const todayAppointments = appointments.filter(app => {
            console.log(`Comparing: "${app.date}" === "${actualToday}"`, app.date === actualToday);
            return app.date === actualToday;
        });

        const relevantPatientNames = new Set(todayAppointments.map(app => app.patientName));
        const relevantPatients = patients.filter(patient => relevantPatientNames.has(patient.name));



        return relevantPatients;
    }, [patients, appointments]);

    // Search function across multiple fields
    const searchPatients = useCallback((searchTerm: string, allPatients: Patient[]): Patient[] => {
        try {
            if (!searchTerm.trim()) {
                console.log('No search term - showing relevant patients for today');
                const todayRelevant = getTodayRelevantPatients();
                console.log('Today relevant patients:', todayRelevant.length);

                return todayRelevant;
            }

            const normalizedSearch = normalizeVietnameseText(searchTerm.trim());

            return allPatients.filter(patient => {
                try {
                    const normalizedName = normalizeVietnameseText(patient.name || '');
                    const normalizedAddress = normalizeVietnameseText(patient.address || '');
                    const normalizedPhone = (patient.phone || '').replace(/\s+/g, '');
                    const birthYearStr = (patient.birthYear || '').toString();

                    return (
                        normalizedName.includes(normalizedSearch) ||
                        normalizedAddress.includes(normalizedSearch) ||
                        normalizedPhone.includes(normalizedSearch) ||
                        birthYearStr.includes(normalizedSearch)
                    );
                } catch (error) {
                    console.warn('Error filtering patient:', patient.id, error);
                    return false;
                }
            });
        } catch (error) {
            console.error('Error in searchPatients:', error);
            toast({
                variant: 'destructive',
                title: 'Lỗi tìm kiếm',
                description: 'Đã có lỗi xảy ra khi tìm kiếm bệnh nhân.',
            });
            return getTodayRelevantPatients();
        }
    }, [normalizeVietnameseText, getTodayRelevantPatients, toast]);

    // Debounced search with loading state
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

    useEffect(() => {
        setIsSearching(true);
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setIsSearching(false);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Filtered patients based on search
    const filteredPatients = useMemo(() => {
        const result = searchPatients(debouncedSearchTerm, patients);
        console.log('Total patients in database:', patients.length);
        console.log('Filtered patients result:', result.length);
        console.log('Search term:', debouncedSearchTerm);
        return result;
    }, [searchPatients, debouncedSearchTerm, patients]);

    const handleSavePatient = async (patientData: Omit<Patient, 'id' | 'lastVisit' | 'avatarUrl' | 'documents'>) => {
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

            // Use Google Sheets instead of Firestore
            await addPatient(patientToAdd);
            setPatients(prev => [...prev, patientToAdd]);
            setIsCreateDialogOpen(false);
            toast({
                title: 'Thêm thành công',
                description: `Hồ sơ bệnh nhân ${patientToAdd.name} đã được tạo với mã ${patientId}.`,
            });
        } catch (error) {
            console.error("Error adding patient: ", error);
            toast({
                variant: 'destructive',
                title: 'Thêm thất bại',
                description: 'Đã có lỗi xảy ra khi thêm bệnh nhân mới.',
            });
        }
    };

    const handleDeletePatient = async (patientId: string, patientName: string) => {
        try {
            await deletePatient(patientId);
            setPatients(prev => prev.filter(patient => patient.id !== patientId));
            toast({
                title: 'Xóa thành công',
                description: `Hồ sơ bệnh nhân ${patientName} đã được xóa.`,
            });
        } catch (error) {
            console.error("Error deleting patient: ", error);
            toast({
                variant: 'destructive',
                title: 'Xóa thất bại',
                description: 'Đã có lỗi xảy ra khi xóa hồ sơ bệnh nhân.',
            });
        }
    };
    
    const handleUpdatePatient = async (updatedPatientData: Patient) => {
        try {
            // Use Google Sheets instead of Firestore
            await updatePatient(updatedPatientData);

            setPatients(prevPatients => 
                prevPatients.map(p =>
                    p.id === updatedPatientData.id ? updatedPatientData : p
                )
            );
            setSelectedPatient(updatedPatientData);
             toast({
                title: "Cập nhật thành công",
                description: `Thông tin bệnh nhân ${updatedPatientData.name} đã được lưu.`,
            });
        } catch (e) {
            console.error("Error updating patient: ", e);
            toast({
                variant: 'destructive',
                title: 'Cập nhật thất bại',
                description: 'Đã có lỗi xảy ra khi lưu thông tin bệnh nhân.',
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
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-headline font-bold">Hồ sơ bệnh nhân</h1>
        <div className="flex items-center gap-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Tìm theo tên, địa chỉ, số điện thoại, năm sinh..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10 w-80"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setSearchTerm('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Add Patient Button */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                  <Button>
                      <UploadCloud className="mr-2 h-4 w-4" />
                      Thêm bệnh nhân mới
                  </Button>
              </DialogTrigger>
              <DialogContent>
                  <DialogHeader>
                      <DialogTitle>Thêm hồ sơ bệnh nhân mới</DialogTitle>
                      <DialogDescription>Nhập thông tin chi tiết cho bệnh nhân.</DialogDescription>
                  </DialogHeader>
                  <PatientForm
                      onSave={handleSavePatient}
                      onClose={() => setIsCreateDialogOpen(false)}
                  />
              </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search Status */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {isSearching && <Loader2 className="h-4 w-4 animate-spin" />}
        <span>
          {searchTerm ? (
            <>Tìm thấy {filteredPatients.length} bệnh nhân khớp với "{searchTerm}"</>
          ) : (
            <>Hiển thị {filteredPatients.length} bệnh nhân có lịch hẹn hôm nay (ngày {new Date().toLocaleDateString('vi-VN')})</>
          )}
        </span>
      </div>

      {filteredPatients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-10 text-center text-muted-foreground">
            <Search className="mx-auto h-12 w-12 mb-4" />
            <p className="text-lg font-semibold">
              {searchTerm ? 'Không tìm thấy bệnh nhân' : 'Không có bệnh nhân nào'}
            </p>
            <p>
              {searchTerm
                ? `Không có bệnh nhân nào khớp với tìm kiếm "${searchTerm}".`
                : 'Không có bệnh nhân nào có lịch hẹn hôm nay.'
              }
            </p>
            {searchTerm && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setSearchTerm('')}
              >
                Xóa tìm kiếm
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPatients.map((patient) => (
            <Card key={patient.id} className="flex flex-col">
              <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={patient.avatarUrl} alt={patient.name} data-ai-hint="person portrait"/>
                  <AvatarFallback>{patient.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="grid gap-1">
                  <CardTitle className="font-headline">{patient.name}</CardTitle>
                  <CardDescription>
                    {calculateAge(patient.birthYear)} tuổi, {translateGender(patient.gender)}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="flex-grow space-y-4">
                  <div className="text-sm text-muted-foreground space-y-2">
                      <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 flex-shrink-0" />
                          <span>{patient.phone}</span>
                      </div>
                      <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <span>{patient.address}</span>
                      </div>
                      {patient.medicalHistory && (
                          <div className="flex items-start gap-2 pt-2">
                              <HeartPulse className="h-4 w-4 flex-shrink-0 mt-0.5 text-primary" />
                              <p className="text-sm text-foreground line-clamp-2">{patient.medicalHistory}</p>
                          </div>
                      )}
                  </div>
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">Lần khám cuối: {formatDate(patient.lastVisit)}</p>
                  <div className="flex items-center gap-2">
                      <AlertDialog>
                          <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                              </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                              <AlertDialogHeader>
                                  <AlertDialogTitle>Xác nhận xóa hồ sơ</AlertDialogTitle>
                                  <AlertDialogDescription>
                                      Bạn có chắc chắn muốn xóa hồ sơ bệnh nhân <strong>{patient.name}</strong>?
                                      Hành động này không thể hoàn tác và sẽ xóa tất cả dữ liệu liên quan.
                                  </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                                  <AlertDialogAction
                                      onClick={() => handleDeletePatient(patient.id, patient.name)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                      Xóa hồ sơ
                                  </AlertDialogAction>
                              </AlertDialogFooter>
                          </AlertDialogContent>
                      </AlertDialog>
                      <Button variant="outline" size="sm" onClick={() => setSelectedPatient(patient)}>
                          Xem chi tiết
                      </Button>
                  </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedPatient} onOpenChange={(open) => !open && setSelectedPatient(null)}>
        <DialogContent className="sm:max-w-3xl">
          {selectedPatient && (
            <PatientDetail
              patient={selectedPatient}
              appointments={appointments}
              invoices={invoices}
              medicalRecords={medicalRecords}
              onUpdatePatient={handleUpdatePatient}
              onClose={() => setSelectedPatient(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
