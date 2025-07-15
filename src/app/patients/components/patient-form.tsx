
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DialogFooter } from '@/components/ui/dialog';
import type { Patient } from '@/lib/types';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import React from 'react';

const patientFormSchema = z.object({
  name: z.string().min(2, { message: 'Tên bệnh nhân phải có ít nhất 2 ký tự.' }),
  gender: z.enum(['Male', 'Female', 'Other'], { required_error: 'Vui lòng chọn giới tính.' }),
  birthYear: z.coerce.number().min(1900, 'Năm sinh không hợp lệ.').max(new Date().getFullYear(), 'Năm sinh không hợp lệ.'),
  address: z.string().min(5, { message: 'Địa chỉ phải có ít nhất 5 ký tự.' }),
  phone: z.string().regex(/^\d{10}$/, { message: 'Số điện thoại phải có 10 chữ số.' }),
  citizenId: z.string().regex(/^\d{12}$/, { message: 'Số CCCD/Số ĐDCN phải có 12 chữ số.' }),
  weight: z.coerce.number().positive({ message: 'Cân nặng phải là số dương.' }),
  medicalHistory: z.string().optional(),
});

type PatientFormValues = z.infer<typeof patientFormSchema>;

interface PatientFormProps {
    initialData?: Patient;
    onSave: (patient: PatientFormValues) => Promise<any>;
    onClose: () => void;
}

export function PatientForm({ initialData, onSave, onClose }: PatientFormProps) {
    const [isSaving, setIsSaving] = React.useState(false);
    
    const form = useForm<PatientFormValues>({
        resolver: zodResolver(patientFormSchema),
        defaultValues: initialData ? {
            name: initialData.name,
            gender: initialData.gender,
            birthYear: initialData.birthYear,
            address: initialData.address,
            phone: initialData.phone,
            citizenId: initialData.citizenId,
            weight: initialData.weight,
            medicalHistory: initialData.medicalHistory || '',
        } : {
            name: '',
            address: '',
            phone: '',
            citizenId: '',
            weight: '' as any,
            birthYear: '' as any,
            gender: undefined,
            medicalHistory: '',
        },
    });

    async function onSubmit(data: PatientFormValues) {
        setIsSaving(true);
        try {
            await onSave(data);
        } catch (error) {
            // Error is handled by the caller component's toast
        } finally {
            // Only set isSaving to false if the component is still mounted.
            // If onSave closes the dialog, this could cause a memory leak warning.
            if (form.formState.isSubmitting) {
               setIsSaving(false);
            }
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Họ và tên</FormLabel>
                        <FormControl><Input placeholder="Nguyễn Văn A" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="birthYear" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Năm sinh</FormLabel>
                            <FormControl><Input type="number" placeholder="1990" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="gender" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Giới tính</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Chọn giới tính" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="Male">Nam</SelectItem>
                                    <SelectItem value="Female">Nữ</SelectItem>
                                    <SelectItem value="Other">Khác</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="citizenId" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Số CCCD/Số ĐDCN</FormLabel>
                            <FormControl><Input placeholder="012345678901" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="weight" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Cân nặng (kg)</FormLabel>
                            <FormControl><Input type="number" placeholder="50" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
                 <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Số điện thoại</FormLabel>
                        <FormControl><Input placeholder="0901234567" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                 <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Địa chỉ</FormLabel>
                        <FormControl><Input placeholder="123 Đường Chính, Quận 1, TP.HCM" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                 <FormField control={form.control} name="medicalHistory" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Tiền sử bệnh</FormLabel>
                        <FormControl><Textarea placeholder="VD: có tiền sử hen suyễn, không hút thuốc, không dị ứng." rows={3} {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                <DialogFooter className="pt-4">
                    <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>Hủy</Button>
                    <Button type="submit" disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isSaving ? 'Đang lưu...' : (initialData ? 'Lưu thay đổi' : 'Thêm bệnh nhân')}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}
