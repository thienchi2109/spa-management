
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserPlus, Phone, MapPin, CreditCard, Loader2, Search, X, Trash2 } from 'lucide-react';
import type { Customer, Appointment, Invoice } from '@/lib/types';
import { formatDate, calculateAge, generateCustomerId } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { CustomerForm } from './components/customer-form';
import { CustomerDetail } from './components/customer-detail';
import { getCollectionData, addCustomer, updateCustomer, deleteCustomer } from '@/lib/sheets-utils';
import { useToast } from '@/hooks/use-toast';

const translateGender = (gender: Customer['gender']) => {
    switch(gender) {
        case 'Male': return 'Nam';
        case 'Female': return 'Nữ';
        case 'Other': return 'Khác';
        case 'Nam': return 'Nam';
        case 'Nữ': return 'Nữ';
        default: return gender;
    }
}

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        async function loadData() {
            try {
                const [customersData, appointmentsData, invoicesData] = await Promise.all([
                    getCollectionData<Customer>('customers'),
                    getCollectionData<Appointment>('appointments'),
                    getCollectionData<Invoice>('invoices'),
                ]);
                setCustomers(customersData);
                setAppointments(appointmentsData);
                setInvoices(invoicesData);
            } catch (error) {
                console.error("Failed to load data from Google Sheets", error);
                toast({
                    variant: 'destructive',
                    title: 'Lỗi tải dữ liệu',
                    description: 'Không thể tải dữ liệu khách hàng từ Google Sheets.'
                });
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [toast]);

    // Utility function to normalize Vietnamese text for search
    const normalizeVietnameseText = useCallback((text: string): string => {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
            .replace(/đ/g, 'd')
            .replace(/Đ/g, 'd');
    }, []);

    // Get customers with appointments or in walk-in queue for today
    const getTodayRelevantCustomers = useCallback(() => {
        // Use actual today date instead of static date
        const actualToday = new Date().toISOString().split('T')[0];

        console.log('=== DEBUG getTodayRelevantCustomers ===');
        console.log('Total appointments loaded:', appointments.length);
        console.log('actualToday (using this):', actualToday);

        const todayAppointments = appointments.filter(app => {
            console.log(`Comparing: "${app.date}" === "${actualToday}"`, app.date === actualToday);
            return app.date === actualToday;
        });

        const relevantCustomerNames = new Set(todayAppointments.map(app => app.patientName));
        const relevantCustomers = customers.filter(customer => relevantCustomerNames.has(customer.name));

        return relevantCustomers;
    }, [customers, appointments]);

    // Search function across multiple fields
    const searchCustomers = useCallback((searchTerm: string, allCustomers: Customer[]): Customer[] => {
        try {
            if (!searchTerm.trim()) {
                console.log('No search term - showing relevant customers for today');
                const todayRelevant = getTodayRelevantCustomers();
                console.log('Today relevant customers:', todayRelevant.length);

                return todayRelevant;
            }

            const normalizedSearch = normalizeVietnameseText(searchTerm.trim());

            return allCustomers.filter(customer => {
                try {
                    const normalizedName = normalizeVietnameseText(customer.name || '');
                    const normalizedAddress = normalizeVietnameseText(customer.address || '');
                    const normalizedPhone = (customer.phone || '').replace(/\s+/g, '');
                    const birthYearStr = (customer.birthYear || '').toString();

                    return (
                        normalizedName.includes(normalizedSearch) ||
                        normalizedAddress.includes(normalizedSearch) ||
                        normalizedPhone.includes(normalizedSearch) ||
                        birthYearStr.includes(normalizedSearch)
                    );
                } catch (error) {
                    console.warn('Error filtering customer:', customer.id, error);
                    return false;
                }
            });
        } catch (error) {
            console.error('Error in searchCustomers:', error);
            toast({
                variant: 'destructive',
                title: 'Lỗi tìm kiếm',
                description: 'Đã có lỗi xảy ra khi tìm kiếm khách hàng.',
            });
            return getTodayRelevantCustomers();
        }
    }, [normalizeVietnameseText, getTodayRelevantCustomers, toast]);

    // Debounced search with loading state
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

    useEffect(() => {
        setIsSearching(true);
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setIsSearching(false);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Filtered customers based on search
    const filteredCustomers = useMemo(() => {
        const result = searchCustomers(debouncedSearchTerm, customers);
        console.log('Total customers in database:', customers.length);
        console.log('Filtered customers result:', result.length);
        console.log('Search term:', debouncedSearchTerm);
        return result;
    }, [searchCustomers, debouncedSearchTerm, customers]);

    const handleSaveCustomer = async (customerData: Omit<Customer, 'id' | 'lastVisit' | 'avatarUrl' | 'tongChiTieu'>) => {
        try {
            // Generate custom customer ID
            const customerId = generateCustomerId(customers);

            const customerToAdd = {
                ...customerData,
                id: customerId,
                lastVisit: new Date().toISOString().split('T')[0],
                avatarUrl: 'https://placehold.co/100x100.png',
                tongChiTieu: 0,
            };

            // Use Google Sheets instead of Firestore
            await addCustomer(customerToAdd);
            setCustomers(prev => [...prev, customerToAdd]);
            setIsCreateDialogOpen(false);
            toast({
                title: 'Thêm thành công',
                description: `Hồ sơ khách hàng ${customerToAdd.name} đã được tạo với mã ${customerId}.`,
            });
        } catch (error) {
            console.error("Error adding customer: ", error);
            toast({
                variant: 'destructive',
                title: 'Thêm thất bại',
                description: 'Đã có lỗi xảy ra khi thêm khách hàng mới.',
            });
        }
    };

    const handleDeleteCustomer = async (customerId: string, customerName: string) => {
        try {
            await deleteCustomer(customerId);
            setCustomers(prev => prev.filter(customer => customer.id !== customerId));
            toast({
                title: 'Xóa thành công',
                description: `Hồ sơ khách hàng ${customerName} đã được xóa.`,
            });
        } catch (error) {
            console.error("Error deleting customer: ", error);
            toast({
                variant: 'destructive',
                title: 'Xóa thất bại',
                description: 'Đã có lỗi xảy ra khi xóa hồ sơ khách hàng.',
            });
        }
    };
    
    const handleUpdateCustomer = async (updatedCustomerData: Customer) => {
        try {
            // Use Google Sheets instead of Firestore
            await updateCustomer(updatedCustomerData);

            setCustomers(prevCustomers => 
                prevCustomers.map(c =>
                    c.id === updatedCustomerData.id ? updatedCustomerData : c
                )
            );
            setSelectedCustomer(updatedCustomerData);
             toast({
                title: "Cập nhật thành công",
                description: `Thông tin khách hàng ${updatedCustomerData.name} đã được lưu.`,
            });
        } catch (e) {
            console.error("Error updating customer: ", e);
            toast({
                variant: 'destructive',
                title: 'Cập nhật thất bại',
                description: 'Đã có lỗi xảy ra khi lưu thông tin khách hàng.',
            });
        }
    };
  
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
  
    return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-headline font-bold">Khách hàng</h1>
        <div className="flex items-center gap-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Tìm theo tên, địa chỉ, số điện thoại, năm sinh..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10 w-80"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setSearchTerm('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Add Customer Button */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                  <Button>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Thêm khách hàng mới
                  </Button>
              </DialogTrigger>
              <DialogContent>
                  <DialogHeader>
                      <DialogTitle>Thêm khách hàng mới</DialogTitle>
                      <DialogDescription>Nhập thông tin chi tiết cho khách hàng.</DialogDescription>
                  </DialogHeader>
                  <CustomerForm
                      onSave={handleSaveCustomer}
                      onClose={() => setIsCreateDialogOpen(false)}
                  />
              </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search Status */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {isSearching && <Loader2 className="h-4 w-4 animate-spin" />}
        <span>
          {searchTerm ? (
            <>Tìm thấy {filteredCustomers.length} khách hàng khớp với "{searchTerm}"</>
          ) : (
            <>Hiển thị {filteredCustomers.length} khách hàng có lịch hẹn hôm nay (ngày {new Date().toLocaleDateString('vi-VN')})</>
          )}
        </span>
      </div>

      {filteredCustomers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-10 text-center text-muted-foreground">
            <Search className="mx-auto h-12 w-12 mb-4" />
            <p className="text-lg font-semibold">
              {searchTerm ? 'Không tìm thấy khách hàng' : 'Không có khách hàng nào'}
            </p>
            <p>
              {searchTerm
                ? `Không có khách hàng nào khớp với tìm kiếm "${searchTerm}".`
                : 'Không có khách hàng nào có lịch hẹn hôm nay.'
              }
            </p>
            {searchTerm && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setSearchTerm('')}
              >
                Xóa tìm kiếm
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCustomers.map((customer) => (
            <Card key={customer.id} className="flex flex-col">
              <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={customer.avatarUrl} alt={customer.name} data-ai-hint="person portrait"/>
                  <AvatarFallback>{customer.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="grid gap-1">
                  <CardTitle className="font-headline">{customer.name}</CardTitle>
                  <CardDescription>
                    {calculateAge(customer.birthYear)} tuổi, {translateGender(customer.gender)}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="flex-grow space-y-4">
                  <div className="text-sm text-muted-foreground space-y-2">
                      <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 flex-shrink-0" />
                          <span>{customer.phone}</span>
                      </div>
                      <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <span>{customer.address}</span>
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                          <CreditCard className="h-4 w-4 flex-shrink-0 text-green-600" />
                          <span className="text-sm font-medium text-green-600">
                            Tổng chi tiêu: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(customer.tongChiTieu)}
                          </span>
                      </div>
                  </div>
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">Lần đến cuối: {formatDate(customer.lastVisit)}</p>
                  <div className="flex items-center gap-2">
                      <AlertDialog>
                          <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                              </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                              <AlertDialogHeader>
                                  <AlertDialogTitle>Xác nhận xóa khách hàng</AlertDialogTitle>
                                  <AlertDialogDescription>
                                      Bạn có chắc chắn muốn xóa khách hàng <strong>{customer.name}</strong>?
                                      Hành động này không thể hoàn tác và sẽ xóa tất cả dữ liệu liên quan.
                                  </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                                  <AlertDialogAction
                                      onClick={() => handleDeleteCustomer(customer.id, customer.name)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                      Xóa khách hàng
                                  </AlertDialogAction>
                              </AlertDialogFooter>
                          </AlertDialogContent>
                      </AlertDialog>
                      <Button variant="outline" size="sm" onClick={() => setSelectedCustomer(customer)}>
                          Xem chi tiết
                      </Button>
                  </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedCustomer} onOpenChange={(open) => !open && setSelectedCustomer(null)}>
        <DialogContent className="sm:max-w-3xl">
          {selectedCustomer && (
            <CustomerDetail
              customer={selectedCustomer}
              appointments={appointments}
              invoices={invoices}
              onUpdateCustomer={handleUpdateCustomer}
              onClose={() => setSelectedCustomer(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
