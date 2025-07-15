'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PlusCircle, Trash2 } from 'lucide-react';
import type { InvoiceItem } from '@/lib/types';
import { formatDate } from '@/lib/utils';

const invoiceItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, 'Mô tả không được để trống.'),
  amount: z.coerce.number().min(0, 'Số tiền phải lớn hơn hoặc bằng 0.'),
});

const invoiceFormSchema = z.object({
  items: z.array(invoiceItemSchema).min(1, 'Hóa đơn phải có ít nhất một mục.'),
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

interface InvoiceFormProps {
  patientName: string;
  date: string;
  initialData?: { items: InvoiceItem[] };
  onSave: (invoiceData: InvoiceFormValues, status: 'Paid' | 'Pending') => void;
  onClose: () => void;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}


export function InvoiceForm({ patientName, date, initialData, onSave, onClose }: InvoiceFormProps) {
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      items: initialData?.items || [{ description: 'Phí khám bệnh', amount: 100000 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });
  
  const watchedItems = form.watch('items');
  const totalAmount = watchedItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  function onSubmit(data: InvoiceFormValues, status: 'Paid' | 'Pending') {
    onSave(data, status);
  }

  return (
    <Form {...form}>
      <div className="space-y-4 py-2 pb-4">
        <div className="p-4 border rounded-lg bg-secondary/50 space-y-1">
            <h3 className="font-semibold">Bệnh nhân: {patientName}</h3>
            <p className="text-sm text-muted-foreground">Ngày hẹn: {formatDate(date)}</p>
        </div>

        <h4 className="font-semibold">Chi tiết hóa đơn</h4>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Mô tả</TableHead>
                    <TableHead className="w-[150px]">Số tiền</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {fields.map((field, index) => (
                    <TableRow key={field.id}>
                        <TableCell className="p-1">
                             <FormField
                                control={form.control}
                                name={`items.${index}.description`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage className="text-xs" />
                                    </FormItem>
                                )}
                            />
                        </TableCell>
                         <TableCell className="p-1">
                             <FormField
                                control={form.control}
                                name={`items.${index}.amount`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl><Input type="number" {...field} /></FormControl>
                                         <FormMessage className="text-xs" />
                                    </FormItem>
                                )}
                            />
                        </TableCell>
                        <TableCell className="p-1">
                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ id: new Date().toISOString() , description: '', amount: 0 })}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Thêm mục
        </Button>

        <div className="flex justify-end pt-4 border-t">
            <div className="text-right space-y-1">
                <p className="text-muted-foreground font-semibold">Tổng cộng</p>
                <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
            </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Hủy</Button>
            <Button type="button" onClick={form.handleSubmit(data => onSubmit(data, 'Pending'))}>Lưu và chờ thanh toán</Button>
            <Button type="button" onClick={form.handleSubmit(data => onSubmit(data, 'Paid'))}>Lưu và đánh dấu đã thanh toán</Button>
        </div>
      </div>
    </Form>
  );
}
