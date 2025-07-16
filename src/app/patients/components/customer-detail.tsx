'use client';

import { useState } from 'react';
import type { Customer, Appointment, Invoice } from '@/lib/types';
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Cake,
  Phone,
  MapPin,
  CreditCard,
  Pencil,
  History,
  Calendar,
} from 'lucide-react';
import { calculateAge, formatDate, formatCurrency } from '@/lib/utils';
import { CustomerForm } from './customer-form';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface CustomerDetailProps {
  customer: Customer;
  appointments: Appointment[];
  invoices: Invoice[];
  onUpdateCustomer: (customer: Customer) => void;
  onClose: () => void;
}

const translateGender = (gender: Customer['gender']) => {
  switch (gender) {
    case 'Male':
      return 'Nam';
    case 'Female':
      return 'Nữ';
    case 'Other':
      return 'Khác';
    default:
      return gender;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'Completed':
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Hoàn thành</Badge>;
    case 'Scheduled':
      return <Badge variant="outline">Đã đặt lịch</Badge>;
    case 'Cancelled':
      return <Badge variant="destructive">Đã hủy</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getPaymentStatusBadge = (status: string) => {
  switch (status) {
    case 'Paid':
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Đã thanh toán</Badge>;
    case 'Pending':
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Chờ thanh toán</Badge>;
    case 'Overdue':
      return <Badge variant="destructive">Quá hạn</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export function CustomerDetail({ customer, appointments, invoices, onUpdateCustomer, onClose }: CustomerDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  // Get customer's appointment history
  const customerAppointments = appointments
    .filter(app => app.patientName === customer.name)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Get customer's invoice history
  const customerInvoices = invoices
    .filter(inv => inv.patientName === customer.name)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleSaveCustomerInfo = (formData: Omit<Customer, 'id' | 'lastVisit' | 'avatarUrl' | 'tongChiTieu'>) => {
    const updatedCustomer = { ...customer, ...formData };
    onUpdateCustomer(updatedCustomer);
    setIsEditing(false);
    toast({
      title: "Đã lưu thành công",
      description: `Thông tin khách hàng ${updatedCustomer.name} đã được cập nhật.`,
    });
  };

  if (isEditing) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Chỉnh sửa thông tin khách hàng</DialogTitle>
          <DialogDescription>Cập nhật thông tin chi tiết cho {customer.name}.</DialogDescription>
        </DialogHeader>
        <div className="py-4 max-h-[60vh] overflow-y-auto pr-4">
          <CustomerForm 
            initialData={customer} 
            onSave={handleSaveCustomerInfo} 
            onClose={() => setIsEditing(false)}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <DialogHeader>
        <div className="flex items-start gap-4">
          <Avatar className="h-20 w-20 border">
            <AvatarImage src={customer.avatarUrl} alt={customer.name} data-ai-hint="person portrait" />
            <AvatarFallback>{customer.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <DialogTitle className="text-2xl font-headline">{customer.name}</DialogTitle>
            <DialogDescription className="text-base">
              Mã khách hàng: {customer.id}
            </DialogDescription>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                <span>{translateGender(customer.gender)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Cake className="h-4 w-4" />
                <span>{calculateAge(customer.birthYear)} tuổi (Năm sinh: {customer.birthYear})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CreditCard className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-600">
                  {formatCurrency(customer.tongChiTieu)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </DialogHeader>

      <div className="py-4">
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personal">Thông tin cá nhân</TabsTrigger>
            <TabsTrigger value="appointments">Lịch hẹn ({customerAppointments.length})</TabsTrigger>
            <TabsTrigger value="invoices">Hóa đơn ({customerInvoices.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="mt-4 space-y-6 max-h-[60vh] overflow-y-auto pr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Phone className="h-5 w-5 text-primary" />
                <span>{customer.phone}</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <MapPin className="h-5 w-5 text-primary" />
                <span>{customer.address}</span>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-5 w-5 text-green-600" />
                  <h4 className="font-semibold text-green-800">Tổng chi tiêu</h4>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(customer.tongChiTieu)}
                </p>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <h4 className="font-semibold text-blue-800">Lần đến cuối</h4>
                </div>
                <p className="text-lg font-medium text-blue-600">
                  {formatDate(customer.lastVisit)}
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="appointments" className="mt-4 max-h-[60vh] overflow-y-auto pr-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                <h4 className="font-semibold">Lịch sử lịch hẹn</h4>
              </div>
              
              {customerAppointments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ngày</TableHead>
                      <TableHead>Thời gian</TableHead>
                      <TableHead>Chuyên viên</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Ghi chú</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerAppointments.map((appointment) => (
                      <TableRow key={appointment.id}>
                        <TableCell>{formatDate(appointment.date)}</TableCell>
                        <TableCell>{appointment.startTime} - {appointment.endTime}</TableCell>
                        <TableCell>{appointment.doctorName}</TableCell>
                        <TableCell>{getStatusBadge(appointment.status)}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {appointment.notes || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center text-sm text-muted-foreground py-8 border-2 border-dashed rounded-lg">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Chưa có lịch hẹn nào.</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="invoices" className="mt-4 max-h-[60vh] overflow-y-auto pr-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                <h4 className="font-semibold">Lịch sử hóa đơn</h4>
              </div>
              
              {customerInvoices.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ngày</TableHead>
                      <TableHead>Số tiền</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Dịch vụ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>{formatDate(invoice.date)}</TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(invoice.amount)}
                        </TableCell>
                        <TableCell>{getPaymentStatusBadge(invoice.status)}</TableCell>
                        <TableCell className="max-w-xs">
                          <div className="space-y-1">
                            {invoice.items.map((item, index) => (
                              <div key={index} className="text-sm">
                                {item.name} (x{item.quantity})
                              </div>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center text-sm text-muted-foreground py-8 border-2 border-dashed rounded-lg">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Chưa có hóa đơn nào.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <DialogFooter className="pt-2 sm:justify-between">
        <Button type="button" onClick={() => setIsEditing(true)}>
          <Pencil className="mr-2 h-4 w-4" />
          Sửa
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>Đóng</Button>
      </DialogFooter>
    </>
  );
}