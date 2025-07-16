'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DialogFooter } from '@/components/ui/dialog';
import type { Customer } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import React from 'react';

// Simplified schema without citizenId, weight, and medicalHistory
const simplifiedCustomerFormSchema = z.object({
  name: z.string().min(2, { message: 'Tên khách hàng phải có ít nhất 2 ký tự.' }),
  gender: z.enum(['Nam', 'Nữ', 'Male', 'Female', 'Other'], { required_error: 'Vui lòng chọn giới tính.' }),
  birthYear: z.coerce.number().min(1900, 'Năm sinh không hợp lệ.').max(new Date().getFullYear(), 'Năm sinh không hợp lệ.'),
  address: z.string().min(5, { message: 'Địa chỉ phải có ít nhất 5 ký tự.' }),
  phone: z.string().regex(/^\d{10}$/, { message: 'Số điện thoại phải có 10 chữ số.' }),
});

type SimplifiedCustomerFormValues = z.infer<typeof simplifiedCustomerFormSchema>;

interface SimplifiedCustomerFormProps {
    initialData?: Customer;
    onSave: (customer: SimplifiedCustomerFormValues) => Promise<any>;
    onClose: () => void;
}

export function SimplifiedCustomerForm({ initialData, onSave, onClose }: SimplifiedCustomerFormProps) {
    const [isSaving, setIsSaving] = React.useState(false);
    
    const form = useForm<SimplifiedCustomerFormValues>({
        resolver: zodResolver(simplifiedCustomerFormSchema),
        defaultValues: initialData ? {
            name: initialData.name,
            gender: initialData.gender,
            birthYear: initialData.birthYear,
            address: initialData.address,
            phone: initialData.phone,
        } : {
            name: '',
            address: '',
            phone: '',
            birthYear: '' as any,
            gender: undefined,
        },
    });

    async function onSubmit(data: SimplifiedCustomerFormValues) {
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
                                    <SelectItem value="Nam">Nam</SelectItem>
                                    <SelectItem value="Nữ">Nữ</SelectItem>
                                    <SelectItem value="Male">Nam</SelectItem>
                                    <SelectItem value="Female">Nữ</SelectItem>
                                    <SelectItem value="Other">Khác</SelectItem>
                                </SelectContent>
                            </Select>
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

                <DialogFooter className="pt-4">
                    <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>Hủy</Button>
                    <Button type="submit" disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isSaving ? 'Đang lưu...' : (initialData ? 'Lưu thay đổi' : 'Thêm khách hàng')}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}