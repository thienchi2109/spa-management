'use client';

import type { Appointment, Staff, Invoice } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CalendarSearch, CreditCard, CheckCircle2 } from 'lucide-react';
import { AppointmentDetail } from './appointment-detail';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

// Helper function to convert 'HH:mm' to minutes since midnight
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const getStatusClasses = (status: Appointment['status']) => {
    // Unified light green background for all appointments
    const baseClasses = 'bg-green-50 text-gray-800';

    switch (status) {
        case 'Scheduled':
            return `${baseClasses} border-l-4 border-l-green-600`;
        case 'Completed':
            return `${baseClasses} border-l-4 border-l-blue-600 opacity-70`;
        case 'Cancelled':
            return `${baseClasses} border-l-4 border-l-red-600 opacity-50`;
        default:
            return `${baseClasses} border-l-4 border-l-gray-400`;
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

export function DailyTimeline({
  appointments,
  staff,
  onUpdateStatus,
  onUpdateInvoiceStatus,
  invoices,
  onCreateInvoice,
  onEditAppointment
}: {
  appointments: Appointment[];
  staff: Staff[];
  onUpdateStatus: (appointmentId: string, newStatus: Appointment['status']) => void;
  onUpdateInvoiceStatus: (invoiceId: string, newStatus: Invoice['status']) => void;
  invoices: Invoice[];
  onCreateInvoice: (appointment: Appointment) => void;
  onEditAppointment: (appointment: Appointment) => void;
}) {
  const START_HOUR = 7;
  const END_HOUR = 20;
  const timeSlots = Array.from({ length: (END_HOUR - START_HOUR) * 2 }, (_, i) => {
    const totalMinutes = START_HOUR * 60 + i * 30;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  });

  if (staff.length === 0) {
    return (
      <Card className="flex items-center justify-center h-full min-h-[400px]">
        <CardContent className="text-center text-muted-foreground">
          <CalendarSearch className="mx-auto h-12 w-12 mb-4" />
          <p className="text-lg font-semibold">Không có lịch hẹn</p>
          <p>Không có lịch hẹn nào được lên lịch cho ngày đã chọn.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="min-w-full w-max">
        <CardContent className="p-0">
            <div
                className="grid relative"
                style={{
                    gridTemplateColumns: `4rem repeat(${staff.length}, minmax(140px, 1fr))`,
                }}
            >
                {/* Time gutter with lines */}
                <div className="sticky left-0 z-20 bg-card">
                    <div className="h-10 border-b border-r"></div> {/* Header space */}
                    {timeSlots.map((time, i) => (
                        <div key={time} className="h-10 border-b border-r flex items-start justify-center pt-1">
                            {i % 2 === 0 && <span className="text-xs text-muted-foreground -translate-y-1/2 bg-card px-1">{time}</span>}
                        </div>
                    ))}
                </div>

                {/* Doctor columns */}
                {staff.map(staffMember => (
                    <div key={staffMember.id} className="relative border-r">
                        <div className="sticky top-0 z-10 h-10 border-b flex items-center justify-center font-semibold text-center p-2 bg-card">{staffMember.name}</div>
                        {timeSlots.map((_, i) => (
                            <div key={i} className="h-10 border-b"></div>
                        ))}
                        {appointments.filter(a => a.doctorName === staffMember.name).map(appointment => {
                            const startMinutes = timeToMinutes(appointment.startTime);
                            const endMinutes = timeToMinutes(appointment.endTime);
                            const topOffset = ((startMinutes - START_HOUR * 60) / 30) * 2.5; // 2.5rem is height of a 30-min slot
                            const height = ((endMinutes - startMinutes) / 30) * 2.5;
                            const minHeight = 3.5; // Minimum height in rem (56px)
                            const finalHeight = Math.max(height, minHeight);
                            const appointmentStaff = staff.find(s => s.name === appointment.doctorName);
                            const invoice = invoices.find(inv => inv.patientName === appointment.patientName && inv.date === appointment.date);
                            const isShort = height < 4.5; // Consider appointments under 4.5rem as short
                            
                            return (
                                <Dialog key={appointment.id}>
                                    <DialogTrigger asChild>
                                        <div
                                            className={cn("absolute w-[90%] left-[5%] rounded-lg p-1.5 text-xs shadow cursor-pointer hover:ring-2 hover:ring-primary focus-visible:ring-2 focus-visible:ring-primary flex flex-col justify-between overflow-hidden", getStatusClasses(appointment.status))}
                                            style={{
                                                top: `calc(2.5rem + ${topOffset}rem)`, // 2.5rem is header height
                                                height: `${finalHeight}rem`,
                                                minHeight: '3.5rem',
                                            }}
                                            tabIndex={0}
                                        >
                                            <div className="flex-1 min-h-0">
                                                <div className="flex items-center gap-1">
                                                    <p className={cn("font-semibold truncate leading-tight", appointment.status === 'Cancelled' && "line-through")}>
                                                        {appointment.patientName}
                                                    </p>
                                                    {appointment.status === 'Completed' && (
                                                        <CheckCircle2 className="h-3 w-3 text-blue-600 flex-shrink-0" />
                                                    )}
                                                </div>
                                                <p className={cn("flex-shrink-0 leading-tight text-[10px] opacity-90 mt-0.5", appointment.status === 'Cancelled' && "line-through")}>
                                                    {appointment.startTime} - {appointment.endTime}
                                                </p>
                                                {appointment.services && appointment.services.length > 0 && (
                                                    <div className="mt-1 space-y-0.5">
                                                        {appointment.services.slice(0, isShort ? 1 : 2).map((service, index) => (
                                                            <div key={index} className="text-[9px] opacity-80 truncate">
                                                                • {service.serviceName}
                                                                {service.quantity > 1 && ` (x${service.quantity})`}
                                                            </div>
                                                        ))}
                                                        {appointment.services.length > (isShort ? 1 : 2) && (
                                                            <div className="text-[9px] opacity-60">
                                                                +{appointment.services.length - (isShort ? 1 : 2)} dịch vụ khác
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                {/* Debug: Log services data */}
                                                {process.env.NODE_ENV === 'development' && appointment.services && console.log('🔍 Services for appointment', appointment.id, ':', appointment.services)}
                                            </div>
                                            {invoice && (
                                                <div className="flex-shrink-0 mt-1">
                                                    {invoice.status === 'Paid' ? (
                                                        <div className="text-[10px] text-white bg-green-600 px-1.5 py-0.5 rounded-full w-fit leading-none">
                                                            ✓
                                                        </div>
                                                    ) : (
                                                        <Badge
                                                            variant={getInvoiceStatusVariant(invoice.status)}
                                                            className="w-fit text-[9px] px-1 py-0.5 leading-none"
                                                        >
                                                            {translateInvoiceStatus(invoice.status)}
                                                        </Badge>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </DialogTrigger>
                                    <AppointmentDetail 
                                        appointment={appointment} 
                                        staffMember={appointmentStaff} 
                                        invoice={invoice}
                                        onUpdateStatus={onUpdateStatus}
                                        onUpdateInvoiceStatus={onUpdateInvoiceStatus}
                                        onCreateInvoice={onCreateInvoice}
                                        onEditAppointment={onEditAppointment}
                                    />
                                </Dialog>
                            )
                        })}
                    </div>
                ))}
            </div>
        </CardContent>
    </Card>
  );
}
