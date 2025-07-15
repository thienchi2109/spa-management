'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { staff as mockStaff, appointments as mockAppointments, medicalRecords as mockMedicalRecords } from '@/lib/mock-data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Phone, Mail, UserPlus, Loader2, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { StaffForm } from './components/staff-form';
import { StaffDetail } from './components/staff-detail';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { seedAndFetchCollection } from '@/lib/firestore-utils';
import { useToast } from '@/hooks/use-toast';
import type { Staff, Appointment, MedicalRecord } from '@/lib/types';
import { useAuth, useIsAdmin } from '@/contexts/auth-context';

export default function StaffPage() {
    const [staff, setStaff] = useState<Staff[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
    const { toast } = useToast();
    const { currentUser } = useAuth();
    const isAdmin = useIsAdmin();

    useEffect(() => {
        const loadData = async () => {
            try {
                const [staffData, appointmentsData, medicalRecordsData] = await Promise.all([
                    seedAndFetchCollection<Staff>('staff', mockStaff),
                    seedAndFetchCollection<Appointment>('appointments', mockAppointments),
                    seedAndFetchCollection<MedicalRecord>('medicalRecords', mockMedicalRecords),
                ]);
                setStaff(staffData);
                setAppointments(appointmentsData);
                setMedicalRecords(medicalRecordsData);
            } catch (error) {
                console.error('Error loading data:', error);
                toast({
                    variant: 'destructive',
                    title: 'Lỗi tải dữ liệu',
                    description: 'Không thể tải dữ liệu hệ thống.',
                });
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [toast]);

    const handleSaveStaff = async (staffData: Omit<Staff, 'id' | 'avatarUrl'>) => {
        try {
            // Check for duplicate email
            const existingStaff = staff.find(s => s.email.toLowerCase() === staffData.email.toLowerCase());
            if (existingStaff) {
                toast({
                    variant: 'destructive',
                    title: 'Email đã tồn tại',
                    description: 'Email này đã được sử dụng bởi nhân viên khác.',
                });
                return;
            }

            const staffToAdd = {
                ...staffData,
                avatarUrl: 'https://placehold.co/100x100.png',
            };

            const docRef = await addDoc(collection(db, 'staff'), staffToAdd);
            const newStaff = { ...staffToAdd, id: docRef.id };
            setStaff(prev => [...prev, newStaff]);
            setIsCreateDialogOpen(false);

            toast({
                title: 'Thêm thành công',
                description: `Nhân viên ${newStaff.name} đã được thêm vào hệ thống.`,
            });
        } catch (error) {
            console.error("Error adding staff: ", error);
            toast({
                variant: 'destructive',
                title: 'Thêm thất bại',
                description: 'Đã có lỗi xảy ra khi thêm nhân viên mới.',
            });
        }
    };

    const handleViewStaffDetail = (staffMember: Staff) => {
        setSelectedStaff(staffMember);
    };

    const handleCloseStaffDetail = () => {
        setSelectedStaff(null);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-headline font-bold">Nhân viên y tế</h1>
                    {currentUser && (
                        <p className="text-sm text-muted-foreground mt-1">
                            Đăng nhập với tư cách: <span className="font-medium">{currentUser.name}</span>
                            {currentUser.role === 'admin' && <span className="text-primary"> (Quản trị viên)</span>}
                        </p>
                    )}
                </div>
                {isAdmin ? (
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <UserPlus className="mr-2 h-4 w-4" />
                                Thêm nhân viên mới
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Thêm nhân viên y tế mới</DialogTitle>
                            <DialogDescription>
                                Nhập thông tin chi tiết cho nhân viên mới. Tài khoản đăng nhập sẽ được tạo tự động.
                            </DialogDescription>
                        </DialogHeader>
                        <StaffForm
                            onSave={handleSaveStaff}
                            onClose={() => setIsCreateDialogOpen(false)}
                        />
                        </DialogContent>
                    </Dialog>
                ) : (
                    <div className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-md">
                        Chỉ quản trị viên mới có quyền thêm nhân viên
                    </div>
                )}
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {staff.map((staffMember) => (
                    <Card key={staffMember.id} className="flex flex-col">
                        <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                            <Avatar className="h-16 w-16">
                                <AvatarImage src={staffMember.avatarUrl} alt={staffMember.name} data-ai-hint="doctor nurse" />
                                <AvatarFallback>{staffMember.name.slice(0,2)}</AvatarFallback>
                            </Avatar>
                            <div className="grid gap-1">
                                <CardTitle className="font-headline">{staffMember.name}</CardTitle>
                                <div>
                                    <Badge variant={
                                        staffMember.role === 'Bác sĩ' ? 'default' :
                                        staffMember.role === 'admin' ? 'destructive' :
                                        'secondary'
                                    }>
                                        {staffMember.role === 'admin' ? 'Quản trị viên' : staffMember.role}
                                    </Badge>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-grow space-y-3 pt-2">
                             {['Bác sĩ', 'Điều dưỡng'].includes(staffMember.role) && staffMember.licenseNumber && (
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <FileText className="h-4 w-4 flex-shrink-0" />
                                    <span>GPHN: {staffMember.licenseNumber}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <Phone className="h-4 w-4 flex-shrink-0" />
                                <span>{staffMember.phone}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <Mail className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate">{staffMember.email}</span>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => handleViewStaffDetail(staffMember)}
                            >
                                Xem chi tiết
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            {/* Staff Detail Dialog */}
            {selectedStaff && (
                <Dialog open={!!selectedStaff} onOpenChange={handleCloseStaffDetail}>
                    <DialogContent className="sm:max-w-4xl">
                        <StaffDetail
                            staff={selectedStaff}
                            appointments={appointments}
                            medicalRecords={medicalRecords}
                            onClose={handleCloseStaffDetail}
                        />
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
