'use client';

import { useState } from 'react';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import type { Appointment, Staff, Invoice } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Clock, User, Stethoscope, Tag, AlertCircle, CheckCircle2, XCircle, CreditCard } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


const getStatusInfo = (status: Appointment['status']): {
  text: string,
  variant: 'outline',
  icon: React.FC<React.SVGProps<SVGSVGElement>>,
  classes: string
} => {
  const baseClasses = 'border-l-4 bg-green-50';

  switch (status) {
    case 'Scheduled':
      return {
        text: 'Đã lên lịch',
        variant: 'outline',
        icon: AlertCircle,
        classes: `${baseClasses} border-l-green-600 text-green-800`
      };
    case 'Completed':
      return {
        text: 'Hoàn thành',
        variant: 'outline',
        icon: CheckCircle2,
        classes: `${baseClasses} border-l-blue-600 text-blue-800 opacity-70`
      };
    case 'Cancelled':
      return {
        text: 'Đã hủy',
        variant: 'outline',
        icon: XCircle,
        classes: `${baseClasses} border-l-red-600 text-red-800 opacity-50 line-through`
      };
    default:
      return {
        text: status,
        variant: 'outline',
        icon: AlertCircle,
        classes: `${baseClasses} border-l-gray-400 text-gray-800`
      };
  }
};

const getInvoiceStatusVariant = (status: Invoice['status']): 'accent' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'Paid':
      return 'accent';
    case 'Pending':
      return 'outline';
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

interface AppointmentDetailProps {
  appointment: Appointment;
  staffMember?: Staff;
  invoice?: Invoice;
  onUpdateStatus: (appointmentId: string, newStatus: Appointment['status']) => void;
  onUpdateInvoiceStatus: (invoiceId: string, newStatus: Invoice['status']) => void;
  onCreateInvoice: (appointment: Appointment) => void;
  onEditAppointment: (appointment: Appointment) => void;
}

export function AppointmentDetail({ appointment, staffMember, invoice, onUpdateStatus, onUpdateInvoiceStatus, onCreateInvoice, onEditAppointment }: AppointmentDetailProps) {
  const [currentStatus, setCurrentStatus] = useState<Appointment['status']>(appointment.status);
  const [currentInvoiceStatus, setCurrentInvoiceStatus] = useState<Invoice['status'] | undefined>(invoice?.status);
  const statusInfo = getStatusInfo(currentStatus);

  const handleSaveChanges = () => {
    onUpdateStatus(appointment.id, currentStatus);
    if (invoice && currentInvoiceStatus && currentInvoiceStatus !== invoice.status) {
      onUpdateInvoiceStatus(invoice.id, currentInvoiceStatus);
    }
  };



  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="font-headline text-xl">
          Chi tiết lịch hẹn
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="flex items-start gap-4 p-4 border rounded-lg bg-secondary/30">
          {staffMember?.avatarUrl && (
            <Avatar className="h-16 w-16 border">
              <AvatarImage src={staffMember.avatarUrl} alt={staffMember.name} data-ai-hint="doctor nurse" />
              <AvatarFallback>{staffMember.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
          )}
          <div className="flex-1 space-y-1">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              {appointment.patientName}
            </h3>
            <p className="text-muted-foreground flex items-center gap-2 text-sm">
              <Stethoscope className="h-4 w-4" />
              với {appointment.doctorName}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{formatDate(appointment.date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{appointment.startTime} - {appointment.endTime}</span>
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <Badge variant={statusInfo.variant} className={`flex items-center gap-1.5 ${statusInfo.classes}`}>
              <statusInfo.icon className="h-3.5 w-3.5" />
              {statusInfo.text}
            </Badge>
          </div>
        </div>

        {/* Services Section */}
        {appointment.services && appointment.services.length > 0 && (
          <div className="space-y-3">
            <Separator />
            <div>
              <h4 className="font-semibold text-base mb-3 flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-primary" />
                Dịch vụ đã chọn ({appointment.services.length})
              </h4>
              <div className="space-y-2">
                {appointment.services.map((service, index) => {
                  // Debug log to see service data
                  console.log('🔍 Service data:', service);
                  
                  return (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-secondary/20">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{service.serviceName || service.name || 'Tên dịch vụ không xác định'}</p>
                        <p className="text-xs text-muted-foreground">
                          Số lượng: {service.quantity || 1}
                          {service.duration ? ` • ${service.duration} phút` : ''}
                          {service.category ? ` • ${service.category}` : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">
                          {formatCurrency(service.totalPrice || service.unitPrice || service.price || 0)}
                        </p>
                        {service.unitPrice && service.quantity && service.quantity > 1 && (
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(service.unitPrice)} x {service.quantity}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 pt-2 border-t">
                <div className="flex justify-between items-center font-semibold">
                  <span>Tổng tiền dịch vụ:</span>
                  <span className="text-primary">
                    {formatCurrency(
                      appointment.services.reduce((total, service) => {
                        const price = service.totalPrice || service.unitPrice || service.price || 0;
                        return total + price;
                      }, 0)
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="pt-2 space-y-2">
          <Label htmlFor="status-select" className="text-sm font-medium">Cập nhật trạng thái lịch hẹn</Label>
          <Select
            value={currentStatus}
            onValueChange={(value) => setCurrentStatus(value as Appointment['status'])}
          >
            <SelectTrigger id="status-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Scheduled">Đã lên lịch</SelectItem>
              <SelectItem value="Completed">Hoàn thành</SelectItem>
              <SelectItem value="Cancelled">Đã hủy</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />
        <div className="pt-2 space-y-2">
          <h4 className="font-semibold text-base">Thông tin thanh toán</h4>
          {invoice ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm items-center">
              <span className="text-muted-foreground">Tổng tiền:</span>
              <span className="font-medium text-right">{formatCurrency(invoice.amount)}</span>

              <span className="text-muted-foreground">Trạng thái:</span>
              <div className="text-right">
                <Badge variant={getInvoiceStatusVariant(currentInvoiceStatus!)}>
                  {translateInvoiceStatus(currentInvoiceStatus!)}
                </Badge>
              </div>

              {currentInvoiceStatus !== 'Paid' && (
                <>
                  <span /> {/* Empty cell for alignment */}
                  <div className="col-start-2 text-right mt-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:text-primary/90" onClick={() => setCurrentInvoiceStatus('Paid')}>
                            <CreditCard className="h-4 w-4" />
                            <span className="sr-only">Đánh dấu là đã thanh toán</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Đánh dấu là đã thanh toán</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </>
              )}
            </div>
          ) : currentStatus === 'Completed' ? (
            <div className="flex flex-col items-start gap-2 pt-1">
              <p className="text-sm text-muted-foreground">Chưa có hóa đơn.</p>
              <DialogClose asChild>
                <Button size="sm" onClick={() => onCreateInvoice(appointment)}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Tạo hóa đơn
                </Button>
              </DialogClose>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground pt-1">Hóa đơn sẽ được tạo sau khi lịch hẹn hoàn thành.</p>
          )}
        </div>

        {staffMember && (
          <div className="p-4 border rounded-lg space-y-2 text-sm mt-4">
            <h4 className="font-semibold text-base mb-2">Thông tin kỹ thuật viên</h4>
            <p><strong>Vai trò:</strong> {staffMember.role}</p>
            <p><strong>Email:</strong> {staffMember.email}</p>
            <p><strong>SĐT:</strong> {staffMember.phone}</p>
          </div>
        )}
      </div>
      <DialogFooter className="flex justify-end gap-2">
        {appointment.status !== 'Completed' && (
          <DialogClose asChild>
            <Button variant="secondary" onClick={() => onEditAppointment(appointment)}>Sửa</Button>
          </DialogClose>
        )}
        <DialogClose asChild>
          <Button type="button" variant="outline">Hủy</Button>
        </DialogClose>
        <DialogClose asChild>
          <Button type="button" onClick={handleSaveChanges}>Lưu thay đổi</Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  );
}
