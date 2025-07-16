'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Trash2, Search, ShoppingCart, Calculator } from 'lucide-react';
import type { SpaService } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { useData } from '@/contexts/data-context';

const invoiceItemSchema = z.object({
  serviceId: z.string().min(1, 'Vui lòng chọn dịch vụ.'),
  serviceName: z.string().min(1, 'Tên dịch vụ không được để trống.'),
  quantity: z.coerce.number().min(1, 'Số lượng phải lớn hơn 0.'),
  unitPrice: z.coerce.number().min(0, 'Giá đơn vị phải lớn hơn hoặc bằng 0.'),
  totalPrice: z.coerce.number().min(0, 'Tổng giá phải lớn hơn hoặc bằng 0.'),
  discount: z.coerce.number().min(0).max(100, 'Giảm giá phải từ 0-100%.').optional().default(0),
});

const posInvoiceFormSchema = z.object({
  items: z.array(invoiceItemSchema).min(1, 'Hóa đơn phải có ít nhất một dịch vụ.'),
  customerDiscount: z.coerce.number().min(0).max(100, 'Giảm giá khách hàng phải từ 0-100%.').optional().default(0),
  notes: z.string().optional(),
});

type POSInvoiceFormValues = z.infer<typeof posInvoiceFormSchema>;

interface POSInvoiceFormProps {
  patientName: string;
  date: string;
  onSave: (invoiceData: {
    items: Array<{
      name: string;
      quantity: number;
      price: number;
    }>;
    totalAmount: number;
    discount: number;
    notes?: string;
  }, status: 'Paid' | 'Pending') => void;
  onClose: () => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

export function POSInvoiceForm({ patientName, date, onSave, onClose }: POSInvoiceFormProps) {
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { services, isLoadingServices } = useData();

  const form = useForm<POSInvoiceFormValues>({
    resolver: zodResolver(posInvoiceFormSchema),
    defaultValues: {
      items: [],
      customerDiscount: 0,
      notes: '',
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  // Filter active services
  const activeServices = useMemo(() => {
    return services.filter(service => service.isActive);
  }, [services]);

  // Filter services based on search
  const filteredServices = useMemo(() => {
    if (!searchTerm) return activeServices;
    return activeServices.filter(service =>
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [activeServices, searchTerm]);

  // Group services by category
  const servicesByCategory = useMemo(() => {
    const grouped = filteredServices.reduce((acc, service) => {
      if (!acc[service.category]) {
        acc[service.category] = [];
      }
      acc[service.category].push(service);
      return acc;
    }, {} as Record<string, SpaService[]>);
    return grouped;
  }, [filteredServices]);

  const watchedItems = form.watch('items');
  const customerDiscount = form.watch('customerDiscount') || 0;

  // Calculate totals
  const subtotal = watchedItems.reduce((sum, item) => {
    const itemTotal = item.quantity * item.unitPrice;
    const itemDiscount = (itemTotal * (item.discount || 0)) / 100;
    return sum + (itemTotal - itemDiscount);
  }, 0);

  const customerDiscountAmount = (subtotal * customerDiscount) / 100;
  const totalAmount = subtotal - customerDiscountAmount;

  const handleAddService = (service: SpaService) => {
    // Check if service already exists in cart
    const existingIndex = fields.findIndex(field => field.serviceId === service.id);
    
    if (existingIndex >= 0) {
      // Increase quantity if service already exists
      const existingItem = watchedItems[existingIndex];
      update(existingIndex, {
        ...existingItem,
        quantity: existingItem.quantity + 1,
        totalPrice: (existingItem.quantity + 1) * existingItem.unitPrice,
      });
    } else {
      // Add new service
      const effectivePrice = service.discountPrice && service.discountPrice < service.price 
        ? service.discountPrice 
        : service.price;
      
      append({
        serviceId: service.id,
        serviceName: service.name,
        quantity: 1,
        unitPrice: effectivePrice,
        totalPrice: effectivePrice,
        discount: 0,
      });
    }
    
    setIsServiceDialogOpen(false);
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const item = watchedItems[index];
    const newTotalPrice = quantity * item.unitPrice;
    update(index, {
      ...item,
      quantity,
      totalPrice: newTotalPrice,
    });
  };

  const handleDiscountChange = (index: number, discount: number) => {
    const item = watchedItems[index];
    update(index, {
      ...item,
      discount,
    });
  };

  function onSubmit(data: POSInvoiceFormValues, status: 'Paid' | 'Pending') {
    const invoiceItems = data.items.map(item => ({
      name: item.serviceName,
      quantity: item.quantity,
      price: item.totalPrice - ((item.totalPrice * (item.discount || 0)) / 100),
    }));

    onSave({
      items: invoiceItems,
      totalAmount,
      discount: customerDiscount,
      notes: data.notes,
    }, status);
  }

  if (isLoadingServices) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Calculator className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Đang tải dịch vụ...</p>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <div className="space-y-6 py-2 pb-4 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="p-4 border rounded-lg bg-secondary/50 space-y-1">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Hóa đơn dịch vụ</h3>
          </div>
          <p className="text-sm text-muted-foreground">Khách hàng: <strong>{patientName}</strong></p>
          <p className="text-sm text-muted-foreground">Ngày: {formatDate(date)}</p>
        </div>

        {/* Service Selection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Dịch vụ đã chọn</h4>
            <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Thêm dịch vụ
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Chọn dịch vụ</DialogTitle>
                  <DialogDescription>
                    Chọn các dịch vụ để thêm vào hóa đơn
                  </DialogDescription>
                </DialogHeader>
                
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm kiếm dịch vụ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Services Grid */}
                <div className="max-h-[60vh] overflow-y-auto space-y-6">
                  {Object.entries(servicesByCategory).map(([category, categoryServices]) => (
                    <div key={category} className="space-y-3">
                      <h3 className="font-semibold text-lg border-b pb-2">{category}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {categoryServices.map((service) => (
                          <Card key={service.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleAddService(service)}>
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <CardTitle className="text-base">{service.name}</CardTitle>
                                <div className="text-right">
                                  {service.discountPrice && service.discountPrice < service.price ? (
                                    <div className="space-y-1">
                                      <p className="text-sm text-muted-foreground line-through">
                                        {formatCurrency(service.price)}
                                      </p>
                                      <p className="font-bold text-green-600">
                                        {formatCurrency(service.discountPrice)}
                                      </p>
                                      <Badge variant="secondary" className="text-xs">
                                        Giảm {Math.round(((service.price - service.discountPrice) / service.price) * 100)}%
                                      </Badge>
                                    </div>
                                  ) : (
                                    <p className="font-bold">{formatCurrency(service.price)}</p>
                                  )}
                                </div>
                              </div>
                              <CardDescription className="text-sm">
                                {service.description}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <span>Thời gian: {service.duration} phút</span>
                                <Button size="sm" variant="outline">
                                  <PlusCircle className="h-4 w-4 mr-1" />
                                  Thêm
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Cart Items */}
          {fields.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dịch vụ</TableHead>
                  <TableHead className="w-[100px]">SL</TableHead>
                  <TableHead className="w-[120px]">Đơn giá</TableHead>
                  <TableHead className="w-[100px]">Giảm giá (%)</TableHead>
                  <TableHead className="w-[120px]">Thành tiền</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => {
                  const item = watchedItems[index];
                  const itemSubtotal = item.quantity * item.unitPrice;
                  const itemDiscount = (itemSubtotal * (item.discount || 0)) / 100;
                  const itemTotal = itemSubtotal - itemDiscount;
                  
                  return (
                    <TableRow key={field.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.serviceName}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 1)}
                          className="w-full"
                        />
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{formatCurrency(item.unitPrice)}</p>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discount || 0}
                          onChange={(e) => handleDiscountChange(index, parseFloat(e.target.value) || 0)}
                          className="w-full"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="text-right">
                          {item.discount && item.discount > 0 && (
                            <p className="text-xs text-muted-foreground line-through">
                              {formatCurrency(itemSubtotal)}
                            </p>
                          )}
                          <p className="font-medium">{formatCurrency(itemTotal)}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-semibold">Chưa có dịch vụ nào</p>
              <p className="text-sm">Nhấn "Thêm dịch vụ" để bắt đầu tạo hóa đơn</p>
            </div>
          )}
        </div>

        {/* Customer Discount */}
        {fields.length > 0 && (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="customerDiscount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Giảm giá khách hàng (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="0"
                      {...field}
                      className="w-32"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ghi chú</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ghi chú thêm cho hóa đơn..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Total Summary */}
        {fields.length > 0 && (
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Tạm tính:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {customerDiscount > 0 && (
              <div className="flex justify-between text-sm text-red-600">
                <span>Giảm giá khách hàng ({customerDiscount}%):</span>
                <span>-{formatCurrency(customerDiscountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Tổng cộng:</span>
              <span className="text-primary">{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Hủy
          </Button>
          {fields.length > 0 && (
            <>
              <Button
                type="button"
                variant="secondary"
                onClick={form.handleSubmit(data => onSubmit(data, 'Pending'))}
              >
                Lưu và chờ thanh toán
              </Button>
              <Button
                type="button"
                onClick={form.handleSubmit(data => onSubmit(data, 'Paid'))}
              >
                Thanh toán ngay
              </Button>
            </>
          )}
        </div>
      </div>
    </Form>
  );
}