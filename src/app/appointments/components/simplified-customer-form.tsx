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
  gender: z.enum(['Nam', 'Nữ', 'Khác'], { required_error: 'Vui lòng chọn giới tính.' }),
  birthYear: z.preprocess(
    (arg) => (arg === '' || arg === null ? undefined : arg),
    z.coerce.number({ invalid_type_error: 'Năm sinh phải là số.' })
      .min(1900, 'Năm sinh phải sau năm 1900.')
      .max(new Date().getFullYear(), 'Năm sinh không hợp lệ.')
      .optional()
  ),
  address: z.string().optional(),
  phone: z.string({ required_error: 'Vui lòng nhập số điện thoại.' }).regex(/^\d{10}$/, { message: 'Số điện thoại phải có 10 chữ số.' }),
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
            gender: initialData.gender === 'Male' ? 'Nam' : initialData.gender === 'Female' ? 'Nữ' : 'Khác',
            birthYear: initialData.birthYear || undefined,
            address: initialData.address || '',
            phone: initialData.phone,
        } : {
            name: '',
            address: '',
            phone: '',
            birthYear: undefined,
            gender: 'Nam',
        },
    });

    async function onSubmit(data: SimplifiedCustomerFormValues) {
        setIsSaving(true);
        console.log('📋 SimplifiedCustomerForm submitting:', data);
        try {
            const result = await onSave(data);
            console.log('✅ SimplifiedCustomerForm save result:', result);
            // Don't auto-close - let parent component handle dialog management
            // onClose();
        } catch (error) {
            console.error('❌ SimplifiedCustomerForm save error:', error);
            // Error is handled by the caller component's toast
            setIsSaving(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 lg:space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-sm">Họ và tên</FormLabel>
                        <FormControl><Input placeholder="Nguyễn Văn A" {...field} className="text-sm" /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                    <FormField control={form.control} name="birthYear" render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-sm">Năm sinh</FormLabel>
                            <FormControl><Input type="number" placeholder="1990" {...field} className="text-sm" /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="gender" render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-sm">Giới tính</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger className="text-sm">
                                        <SelectValue placeholder="Chọn giới tính" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="Nam">Nam</SelectItem>
                                    <SelectItem value="Nữ">Nữ</SelectItem>
                                    <SelectItem value="Khác">Khác</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
                
                <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-sm">Số điện thoại *</FormLabel>
                        <FormControl><Input placeholder="0901234567" {...field} className="text-sm" /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                
                <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-sm">Địa chỉ</FormLabel>
                        <FormControl><Input placeholder="123 Đường Chính, Quận 1, TP.HCM" {...field} className="text-sm" /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                <DialogFooter className="pt-4 flex-col sm:flex-row gap-2 sm:gap-0">
                    <Button type="button" variant="outline" onClick={onClose} disabled={isSaving} className="w-full sm:w-auto text-sm">
                        Hủy
                    </Button>
                    <Button type="submit" disabled={isSaving} className="w-full sm:w-auto text-sm">
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isSaving ? 'Đang lưu...' : (initialData ? 'Lưu thay đổi' : 'Thêm khách hàng')}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}