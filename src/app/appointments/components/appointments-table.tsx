'use client';

import type { Appointment, Staff, Invoice } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, FileSearch, Pencil, Trash2, CalendarSearch } from 'lucide-react';
import { AppointmentDetail } from './appointment-detail';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
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
import { useState } from 'react';

const getStatusVariant = (status: Appointment['status']): 'secondary' | 'accent' | 'destructive' | 'outline' => {
  // Using outline variant for all statuses to create subtle, consistent appearance
  return 'outline';
};

const getStatusClasses = (status: Appointment['status']) => {
  switch (status) {
    case 'Scheduled':
      return 'border-l-4 border-l-green-600 bg-green-50 text-green-800';
    case 'Completed':
      return 'border-l-4 border-l-blue-600 bg-green-50 text-blue-800 opacity-70';
    case 'Cancelled':
      return 'border-l-4 border-l-red-600 bg-green-50 text-red-800 opacity-50 line-through';
    default:
      return 'border-l-4 border-l-gray-400 bg-green-50 text-gray-800';
  }
};

const translateStatus = (status: Appointment['status']) => {
  switch (status) {
    case 'Scheduled':
      return 'Đã lên lịch';
    case 'Completed':
      return 'Hoàn thành';
    case 'Cancelled':
      return 'Đã hủy';
    default:
      return status;
  }
};

const getInvoiceStatusVariant = (status: Invoice['status']): 'accent' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'Paid':
      return 'accent';
    case 'Pending':
      return 'secondary';
    case 'Overdue':
      return 'destructive';
    default:
      return 'outline';
  }
};

const translateInvoiceStatus = (status: Invoice['status']) => {
    switch (status) {
        case 'Paid': return 'Đã thanh toán';
        case 'Pending': return 'Chờ thanh toán';
        case 'Overdue': return 'Quá hạn';
        default: return status;
    }
}

interface AppointmentsTableProps {
  appointments: Appointment[];
  staff: Staff[];
  invoices: Invoice[];
  onUpdateStatus: (appointmentId: string, newStatus: Appointment['status']) => void;
  onUpdateInvoiceStatus: (invoiceId: string, newStatus: Invoice['status']) => void;
  onCreateInvoice: (appointment: Appointment) => void;
  onEditAppointment?: (appointment: Appointment) => void;
  onDeleteAppointment?: (appointmentId: string) => void;
  showResultsCount?: boolean;
}

export function AppointmentsTable({ appointments, staff, invoices, onUpdateStatus, onUpdateInvoiceStatus, onCreateInvoice, onEditAppointment, onDeleteAppointment, showResultsCount = false }: AppointmentsTableProps) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);

  const handleEditClick = (appointment: Appointment) => {
    if (onEditAppointment) {
      onEditAppointment(appointment);
    }
  };

  const handleDeleteClick = (appointment: Appointment) => {
    setAppointmentToDelete(appointment);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (appointmentToDelete && onDeleteAppointment) {
      onDeleteAppointment(appointmentToDelete.id);
      setDeleteConfirmOpen(false);
      setAppointmentToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setAppointmentToDelete(null);
  };
  if (appointments.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-10 text-center text-muted-foreground">
          <CalendarSearch className="mx-auto h-12 w-12 mb-4" />
          <p className="text-lg font-semibold">Không tìm thấy lịch hẹn</p>
          <p>Không có lịch hẹn nào khớp với tìm kiếm của bạn cho ngày đã chọn.</p>
        </CardContent>
      </Card>
    );
  }

  const sortedAppointments = [...appointments].sort((a, b) =>
    a.startTime.localeCompare(b.startTime)
  );

  return (
    <Card>
      {showResultsCount && (
        <div className="px-6 py-3 border-b bg-muted/30">
          <p className="text-sm text-muted-foreground">
            Hiển thị <span className="font-medium text-foreground">{sortedAppointments.length}</span> lịch hẹn
          </p>
        </div>
      )}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[110px] sm:w-[100px] font-semibold">Thời gian</TableHead>
              <TableHead className="w-[160px] min-w-[140px] sm:min-w-[120px] font-semibold">Khách hàng</TableHead>
              <TableHead className="hidden md:table-cell w-[140px] font-semibold">Kỹ thuật viên</TableHead>
              <TableHead className="w-[120px] sm:w-[100px] font-semibold">Trạng thái</TableHead>
              <TableHead className="hidden sm:table-cell w-[120px] font-semibold">Phí dịch vụ</TableHead>
              <TableHead className="w-[120px] sm:w-[100px] font-semibold">Thanh toán</TableHead>
              <TableHead className="text-right w-[90px] sm:w-[70px] font-semibold">Hành động</TableHead>
            </TableRow>
          </TableHeader>
        <TableBody>
          {sortedAppointments.map((appointment) => {
            const staffMember = staff.find(s => s.name === appointment.doctorName);
            const invoice = invoices.find(inv => inv.patientName === appointment.patientName && inv.date === appointment.date);
            return (
              <TableRow key={appointment.id} className="hover:bg-muted/50 transition-colors">
                <TableCell className="font-medium">
                  <div className="whitespace-nowrap text-sm">
                    {appointment.startTime} - {appointment.endTime}
                  </div>
                </TableCell>
                <TableCell className="font-medium">{appointment.patientName}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">{appointment.doctorName}</TableCell>
                <TableCell>
                  <Badge
                    variant={getStatusVariant(appointment.status)}
                    className={getStatusClasses(appointment.status)}
                  >
                    {translateStatus(appointment.status)}
                  </Badge>
                </TableCell>
                 <TableCell className="hidden sm:table-cell font-medium text-right">
                  {invoice ? formatCurrency(invoice.amount) : '–'}
                </TableCell>
                <TableCell>
                  {invoice ? (
                    <Badge variant={getInvoiceStatusVariant(invoice.status)}>
                      {translateInvoiceStatus(invoice.status)}
                    </Badge>
                  ) : (
                    '–'
                  )}
                </TableCell>
                <TableCell className="text-right">
                    <Dialog>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Mở menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Hành động</DropdownMenuLabel>
                                <DialogTrigger asChild>
                                  <DropdownMenuItem>
                                      <FileSearch className="mr-2 h-4 w-4" />
                                      <span>Xem chi tiết</span>
                                  </DropdownMenuItem>
                                </DialogTrigger>
                                <DropdownMenuItem
                                    onClick={() => handleEditClick(appointment)}
                                    disabled={!onEditAppointment || appointment.status === 'Completed'}
                                >
                                    <Pencil className="mr-2 h-4 w-4" />
                                    <span>Sửa</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => handleDeleteClick(appointment)}
                                    disabled={!onDeleteAppointment}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Xóa</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <AppointmentDetail 
                            appointment={appointment} 
                            staffMember={staffMember} 
                            invoice={invoice}
                            onUpdateStatus={onUpdateStatus}
                            onUpdateInvoiceStatus={onUpdateInvoiceStatus}
                            onCreateInvoice={onCreateInvoice}
                        />
                    </Dialog>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa lịch hẹn</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa lịch hẹn của bệnh nhân{' '}
              <span className="font-semibold">{appointmentToDelete?.patientName}</span>{' '}
              vào lúc{' '}
              <span className="font-semibold">
                {appointmentToDelete?.startTime} - {appointmentToDelete?.endTime}
              </span>?
              <br />
              <br />
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>
              Hủy bỏ
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Xóa lịch hẹn
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
