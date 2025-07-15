'use client';

import { useState, useMemo } from 'react';
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
import { Calendar as CalendarIcon, UserPlus, Loader2 } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import type { Appointment, Staff, Patient } from '@/lib/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PatientForm } from '@/app/patients/components/patient-form';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';

const baseAppointmentFormSchema = z.object({
  patientName: z.string({ required_error: 'Vui lòng chọn bệnh nhân.' }).min(1, 'Vui lòng chọn bệnh nhân.'),
  doctorName: z.string({ required_error: 'Vui lòng chọn bác sĩ.' }),
  date: z.date({ required_error: 'Vui lòng chọn ngày.' }),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Thời gian không hợp lệ (HH:mm).' }),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Thời gian không hợp lệ (HH:mm).' }),
}).refine(data => data.endTime > data.startTime, {
    message: "Thời gian kết thúc phải sau thời gian bắt đầu.",
    path: ["endTime"],
});

type AppointmentFormValues = z.infer<typeof baseAppointmentFormSchema>;

interface AppointmentFormProps {
    selectedDate?: Date;
    staff: Staff[];
    appointments: Appointment[];
    patients: Patient[];
    onSave: (appointment: Omit<Appointment, 'id' | 'status'>) => Promise<void>;
    onSavePatient: (patientData: Omit<Patient, 'id' | 'lastVisit' | 'avatarUrl' | 'documents'>) => Promise<Patient>;
    onClose: () => void;
}

export function AppointmentForm({ selectedDate, staff, appointments, patients, onSave, onSavePatient, onClose }: AppointmentFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isPatientFormOpen, setIsPatientFormOpen] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [isPatientListVisible, setIsPatientListVisible] = useState(false);
  const [isPatientSaved, setIsPatientSaved] = useState(false);
  
  const filteredPatients = useMemo(() => {
    if (!patientSearch) {
      return [];
    }
    return patients.filter((patient) =>
      patient.name.toLowerCase().includes(patientSearch.toLowerCase())
    );
  }, [patientSearch, patients]);

  const appointmentFormSchema = useMemo(() => {
    return baseAppointmentFormSchema.refine(
      (data) => {
        if (!data.date || !data.doctorName) return true;
        const hasConflict = appointments.some(app =>
            app.doctorName === data.doctorName &&
            app.date === format(data.date, 'yyyy-MM-dd') &&
            app.status === 'Scheduled' &&
            data.startTime < app.endTime &&
            data.endTime > app.startTime
        );
        return !hasConflict;
      },
      {
        message: "Bác sĩ đã có lịch hẹn khác trong khung giờ này.",
        path: ["startTime"],
      }
    );
  }, [appointments]);

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      date: selectedDate,
      startTime: '',
      endTime: '',
    },
  });

  async function handleSaveNewPatient(patientData: Omit<Patient, 'id' | 'lastVisit' | 'avatarUrl' | 'documents'>) {
    const newPatient = await onSavePatient(patientData);
    form.setValue('patientName', newPatient.name, { shouldValidate: true });
    setPatientSearch(newPatient.name);
    setIsPatientSaved(true);
  }

  async function onSubmit(data: AppointmentFormValues) {
    setIsSaving(true);
    const newAppointment = {
        patientName: data.patientName,
        doctorName: data.doctorName,
        date: format(data.date, 'yyyy-MM-dd'),
        startTime: data.startTime,
        endTime: data.endTime,
    };
    await onSave(newAppointment);
    setIsSaving(false);
    onClose();
  }

  return (
    <div className={cn("flex gap-6", isPatientFormOpen ? "min-w-[800px]" : "")}>
      {/* Main Appointment Form */}
      <div className="flex-1 min-w-[400px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="patientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên bệnh nhân</FormLabel>
                  <div className="flex gap-2">
                    <div className="relative w-full">
                      <FormControl>
                        <Input
                          placeholder="Nhập để tìm kiếm bệnh nhân..."
                          value={patientSearch}
                          onChange={(e) => {
                            setPatientSearch(e.target.value);
                            if (field.value) {
                              field.onChange(undefined);
                            }
                            if (!isPatientListVisible) setIsPatientListVisible(true);
                          }}
                          onFocus={() => setIsPatientListVisible(true)}
                          onBlur={() => {
                            setTimeout(() => {
                              setIsPatientListVisible(false);
                            }, 150);
                          }}
                        />
                      </FormControl>
                      {isPatientListVisible && patientSearch && (
                        <div className="absolute top-full mt-1 w-full z-10">
                          <Card>
                            <ScrollArea className="h-auto max-h-48 p-1">
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
                                    {p.name}
                                  </div>
                                ))
                              ) : (
                                <p className="p-2 text-center text-sm text-muted-foreground">
                                  Không tìm thấy bệnh nhân.
                                </p>
                              )}
                            </ScrollArea>
                          </Card>
                        </div>
                      )}
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="icon" 
                          className="flex-shrink-0"
                          onClick={() => {
                            setIsPatientFormOpen(!isPatientFormOpen);
                            setIsPatientSaved(false);
                          }}
                        >
                          <UserPlus className="h-4 w-4" />
                          <span className="sr-only">Thêm bệnh nhân mới</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{isPatientFormOpen ? 'Đóng form thêm bệnh nhân' : 'Thêm bệnh nhân mới'}</p>
                      </TooltipContent>
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
                    <FormLabel>Bác sĩ/Điều dưỡng</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Chọn một nhân viên y tế" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {staff.map((staffMember) => (
                            <SelectItem key={staffMember.id} value={staffMember.name}>
                            {staffMember.name} ({staffMember.role})
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Ngày khám</FormLabel>
                  <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            formatDate(format(field.value, 'yyyy-MM-dd'))
                          ) : (
                            <span>Chọn ngày</span>
                          )}
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
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0, 0, 0, 0))
                        }
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
                    <FormControl>
                        <Input type="time" {...field} />
                    </FormControl>
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
                    <FormControl>
                        <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <Button type="submit" className="w-full" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSaving ? 'Đang lưu...' : 'Lưu lịch hẹn'}
            </Button>
          </form>
        </Form>
      </div>

      {/* Side Patient Form */}
      {isPatientFormOpen && (
        <div className="flex-1 min-w-[400px] border-l pl-6">
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Thêm hồ sơ bệnh nhân mới</h3>
                <p className="text-sm text-muted-foreground">Nhập thông tin chi tiết cho bệnh nhân.</p>
              </div>
              <div className={cn("transition-opacity duration-200", isPatientSaved && "opacity-50 pointer-events-none")}>
                <PatientForm
                  onSave={handleSaveNewPatient}
                  onClose={() => setIsPatientFormOpen(false)}
                />
              </div>
              {isPatientSaved && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800 font-medium">
                    ✓ Bệnh nhân đã được thêm thành công!
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Thông tin đã được điền vào form lịch hẹn.
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
