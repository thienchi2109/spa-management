'use client';

import { useState, useMemo } from 'react';
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  PlusCircle, 
  Trash2, 
  Search, 
  ShoppingCart, 
  Calculator,
  Star,
  Clock,
  Tag,
  Zap,
  Receipt
} from 'lucide-react';
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

const enhancedPOSFormSchema = z.object({
  items: z.array(invoiceItemSchema).min(1, 'Hóa đơn phải có ít nhất một dịch vụ.'),
  customerDiscount: z.coerce.number().min(0).max(100, 'Giảm giá khách hàng phải từ 0-100%.').optional().default(0),
  notes: z.string().optional(),
  paymentMethod: z.enum(['cash', 'card', 'transfer']).default('cash'),
});

type EnhancedPOSFormValues = z.infer<typeof enhancedPOSFormSchema>;

interface EnhancedPOSFormProps {
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
    paymentMethod: string;
  }, status: 'Paid' | 'Pending') => void;
  onClose: () => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

export function EnhancedPOSForm({ patientName, date, onSave, onClose }: EnhancedPOSFormProps) {
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('popular');
  const { services, isLoadingServices } = useData();

  const form = useForm<EnhancedPOSFormValues>({
    resolver: zodResolver(enhancedPOSFormSchema),
    defaultValues: {
      items: [],
      customerDiscount: 0,
      notes: '',
      paymentMethod: 'cash',
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

  // Get popular services (top 6 by price or most commonly used)
  const popularServices = useMemo(() => {
    return activeServices
      .filter(service => service.price > 0)
      .sort((a, b) => {
        // Prioritize services with discounts, then by price
        const aHasDiscount = a.discountPrice && a.discountPrice < a.price;
        const bHasDiscount = b.discountPrice && b.discountPrice < b.price;
        if (aHasDiscount && !bHasDiscount) return -1;
        if (!aHasDiscount && bHasDiscount) return 1;
        return b.price - a.price;
      })
      .slice(0, 6);
  }, [activeServices]);

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
  const paymentMethod = form.watch('paymentMethod');

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
      const newQuantity = existingItem.quantity + 1;
      
      update(existingIndex, {
        ...existingItem,
        quantity: newQuantity,
        totalPrice: newQuantity * existingItem.unitPrice,
      });
    } else {
      // Add new service
      const effectivePrice = service.discountPrice && service.discountPrice < service.price 
        ? service.discountPrice 
        : service.price;
      
      const newItem = {
        serviceId: service.id,
        serviceName: service.name,
        quantity: 1,
        unitPrice: Number(effectivePrice) || 0,
        totalPrice: Number(effectivePrice) || 0,
        discount: 0,
      };
      
      append(newItem);
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

  function onSubmit(data: EnhancedPOSFormValues, status: 'Paid' | 'Pending') {
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
      paymentMethod: data.paymentMethod,
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
      <div className="space-y-6 py-2 pb-4 max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="p-4 border rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 space-y-1">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Hóa đơn dịch vụ spa</h3>
          </div>
          <p className="text-sm text-muted-foreground">Khách hàng: <strong>{patientName}</strong></p>
          <p className="text-sm text-muted-foreground">Ngày: {formatDate(date)}</p>
        </div>

        {/* Service Selection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Dịch vụ đã chọn ({fields.length})
            </h4>
            <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Thêm dịch vụ
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-5xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Chọn dịch vụ
                  </DialogTitle>
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

                {/* Service Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="popular" className="flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      Phổ biến
                    </TabsTrigger>
                    <TabsTrigger value="categories" className="flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Danh mục
                    </TabsTrigger>
                    <TabsTrigger value="all" className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Tất cả
                    </TabsTrigger>
                  </TabsList>

                  {/* Popular Services Tab */}
                  <TabsContent value="popular" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {popularServices.map((service) => (
                        <ServiceCard 
                          key={service.id} 
                          service={service} 
                          onAdd={handleAddService}
                          isPopular={true}
                        />
                      ))}
                    </div>
                  </TabsContent>

                  {/* Categories Tab */}
                  <TabsContent value="categories" className="space-y-6">
                    <div className="max-h-[50vh] overflow-y-auto space-y-6">
                      {Object.entries(servicesByCategory).map(([category, categoryServices]) => (
                        <div key={category} className="space-y-3">
                          <h3 className="font-semibold text-lg border-b pb-2 flex items-center gap-2">
                            <Tag className="h-4 w-4" />
                            {category}
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {categoryServices.map((service) => (
                              <ServiceCard 
                                key={service.id} 
                                service={service} 
                                onAdd={handleAddService}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  {/* All Services Tab */}
                  <TabsContent value="all" className="space-y-4">
                    <div className="max-h-[50vh] overflow-y-auto">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredServices.map((service) => (
                          <ServiceCard 
                            key={service.id} 
                            service={service} 
                            onAdd={handleAddService}
                          />
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>

          {/* Cart Items */}
          {fields.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
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
                    if (!item) return null;
                    
                    const itemSubtotal = (item.quantity || 0) * (item.unitPrice || 0);
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
                          <p className="text-sm font-medium">{formatCurrency(item.unitPrice)}</p>
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
                            <p className="font-medium text-primary">{formatCurrency(itemTotal)}</p>
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
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
              <ShoppingCart className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="font-semibold text-lg">Giỏ hàng trống</p>
              <p className="text-sm">Nhấn "Thêm dịch vụ" để bắt đầu tạo hóa đơn</p>
            </div>
          )}
        </div>

        {/* Additional Options */}
        {fields.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phương thức thanh toán</FormLabel>
                    <FormControl>
                      <select {...field} className="w-full p-2 border rounded-md">
                        <option value="cash">Tiền mặt</option>
                        <option value="card">Thẻ</option>
                        <option value="transfer">Chuyển khoản</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ghi chú</FormLabel>
                    <FormControl>
                      <textarea
                        {...field}
                        placeholder="Ghi chú thêm cho hóa đơn..."
                        className="w-full p-2 border rounded-md min-h-[80px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}

        {/* Total Summary */}
        {fields.length > 0 && (
          <div className="border-t pt-6">
            <div className="bg-muted/30 rounded-lg p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span>Tạm tính:</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              {customerDiscount > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Giảm giá khách hàng ({customerDiscount}%):</span>
                  <span className="font-medium">-{formatCurrency(customerDiscountAmount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-xl font-bold">
                <span>Tổng cộng:</span>
                <span className="text-primary">{formatCurrency(totalAmount)}</span>
              </div>
              <div className="text-xs text-muted-foreground text-center">
                Phương thức: {paymentMethod === 'cash' ? 'Tiền mặt' : paymentMethod === 'card' ? 'Thẻ' : 'Chuyển khoản'}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
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

// Service Card Component
interface ServiceCardProps {
  service: SpaService;
  onAdd: (service: SpaService) => void;
  isPopular?: boolean;
}

function ServiceCard({ service, onAdd, isPopular = false }: ServiceCardProps) {
  const hasDiscount = service.discountPrice && service.discountPrice < service.price;
  const discountPercent = hasDiscount 
    ? Math.round(((service.price - service.discountPrice!) / service.price) * 100)
    : 0;

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] relative" 
      onClick={() => onAdd(service)}
    >
      {isPopular && (
        <div className="absolute -top-2 -right-2 z-10">
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">
            <Star className="h-3 w-3 mr-1" />
            Phổ biến
          </Badge>
        </div>
      )}
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base leading-tight">{service.name}</CardTitle>
          <div className="text-right ml-2">
            {hasDiscount ? (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground line-through">
                  {formatCurrency(service.price)}
                </p>
                <p className="font-bold text-green-600">
                  {formatCurrency(service.discountPrice!)}
                </p>
                <Badge variant="destructive" className="text-xs">
                  -{discountPercent}%
                </Badge>
              </div>
            ) : (
              <p className="font-bold text-lg">{formatCurrency(service.price)}</p>
            )}
          </div>
        </div>
        <CardDescription className="text-sm line-clamp-2">
          {service.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{service.duration} phút</span>
          </div>
          <Button size="sm" variant="outline" className="hover:bg-primary hover:text-primary-foreground">
            <PlusCircle className="h-4 w-4 mr-1" />
            Thêm
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}