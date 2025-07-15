
'use client';
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { invoices as mockInvoices } from '@/lib/mock-data';
import { Printer, Pencil, CreditCard, Loader2 } from 'lucide-react';
import type { Invoice, InvoiceItem } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { formatDate } from '@/lib/utils';
import { InvoiceForm } from './components/invoice-form';
import { seedAndFetchCollection } from '@/lib/firestore-utils';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

const getStatusVariant = (status: Invoice['status']) => {
  switch (status) {
    case 'Paid':
      return 'accent';
    case 'Pending':
      return 'secondary';
    case 'Overdue':
      return 'destructive';
    default:
      return 'outline';
  }
};

const translateStatus = (status: Invoice['status']) => {
    switch (status) {
        case 'Paid': return 'Đã thanh toán';
        case 'Pending': return 'Chờ thanh toán';
        case 'Overdue': return 'Quá hạn';
        default: return status;
    }
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

const InvoiceDialog = ({ invoice }: { invoice: Invoice }) => (
    <DialogContent className="sm:max-w-[625px]">
      <DialogHeader>
        <DialogTitle className="font-headline">Hóa đơn #{invoice.id}</DialogTitle>
        <DialogDescription>
          Ngày: {formatDate(invoice.date)} | Trạng thái: {translateStatus(invoice.status)}
        </DialogDescription>
      </DialogHeader>
      <div className="py-4 space-y-4">
        <div className="p-4 border rounded-lg">
            <h3 className="font-semibold">Bệnh nhân: {invoice.patientName}</h3>
        </div>
        <div>
            <h4 className="font-semibold mb-2">Các mục:</h4>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Dịch vụ</TableHead>
                        <TableHead className="text-right">Thành tiền</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {invoice.items.map(item => (
                         <TableRow key={item.id}>
                            <TableCell>{item.description}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
        <div className="flex justify-end pt-4 border-t">
            <div className="text-right">
                <p className="text-muted-foreground">Tổng cộng</p>
                <p className="text-2xl font-bold">{formatCurrency(invoice.amount)}</p>
            </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            In hóa đơn
        </Button>
      </DialogFooter>
    </DialogContent>
)


export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        async function loadData() {
            try {
                const invoicesData = await seedAndFetchCollection('invoices', mockInvoices);
                setInvoices(invoicesData);
            } catch (error) {
                console.error("Failed to load invoices from Firestore", error);
                toast({
                    variant: 'destructive',
                    title: 'Lỗi tải dữ liệu',
                    description: 'Không thể tải hóa đơn từ máy chủ.',
                });
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [toast]);

    const handleUpdateInvoiceStatus = async (invoiceId: string, newStatus: Invoice['status']) => {
        try {
            const invoiceRef = doc(db, 'invoices', invoiceId);
            await updateDoc(invoiceRef, { status: newStatus });
            const updatedInvoices = invoices.map(inv =>
                inv.id === invoiceId ? { ...inv, status: newStatus } : inv
            );
            setInvoices(updatedInvoices);
            toast({
                title: 'Cập nhật thành công',
                description: 'Trạng thái hóa đơn đã được thay đổi.',
            });
        } catch (error) {
            console.error("Error updating invoice status:", error);
            toast({
                variant: 'destructive',
                title: 'Lỗi',
                description: 'Không thể cập nhật trạng thái hóa đơn.',
            });
        }
    };
    
    const handleSaveInvoice = async (invoiceData: { items: InvoiceItem[] }, status: 'Paid' | 'Pending') => {
        if (!editingInvoice) return;

        try {
            const totalAmount = invoiceData.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
            
            const updatedInvoice: Invoice = {
                ...editingInvoice,
                items: invoiceData.items,
                amount: totalAmount,
                status: status,
            };
            
            const invoiceRef = doc(db, 'invoices', editingInvoice.id);
            await updateDoc(invoiceRef, updatedInvoice);

            const updatedInvoices = invoices.map(inv => inv.id === editingInvoice.id ? updatedInvoice : inv);
            setInvoices(updatedInvoices);

            setEditingInvoice(null);
            toast({
                title: 'Lưu thành công',
                description: 'Hóa đơn đã được cập nhật.',
            });
        } catch (error) {
            console.error("Error saving invoice:", error);
            toast({
                variant: 'destructive',
                title: 'Lỗi',
                description: 'Không thể lưu hóa đơn.',
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-headline font-bold">Lịch sử Hóa đơn</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tất cả hóa đơn</CardTitle>
          <CardDescription>
            Xem lại và quản lý lịch sử thanh toán của bệnh nhân.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã hóa đơn</TableHead>
                <TableHead>Bệnh nhân</TableHead>
                <TableHead>Ngày</TableHead>
                <TableHead>Số tiền</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.id}</TableCell>
                  <TableCell>{invoice.patientName}</TableCell>
                  <TableCell>{formatDate(invoice.date)}</TableCell>
                  <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(invoice.status)}>
                      {translateStatus(invoice.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">Xem</Button>
                        </DialogTrigger>
                        <InvoiceDialog invoice={invoice} />
                    </Dialog>
                    <Button variant="ghost" size="sm" onClick={() => setEditingInvoice(invoice)}>
                        <Pencil className="mr-1 h-3 w-3" />Sửa
                    </Button>
                    {invoice.status !== 'Paid' && (
                        <Button variant="ghost" size="sm" onClick={() => handleUpdateInvoiceStatus(invoice.id, 'Paid')}>
                             <CreditCard className="mr-1 h-3 w-3" />Thanh toán
                        </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {editingInvoice && (
        <Dialog open={!!editingInvoice} onOpenChange={(open) => !open && setEditingInvoice(null)}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Sửa hóa đơn #{editingInvoice.id}</DialogTitle>
                    <DialogDescription>Cập nhật chi tiết hóa đơn.</DialogDescription>
                </DialogHeader>
                <InvoiceForm
                    patientName={editingInvoice.patientName}
                    date={editingInvoice.date}
                    initialData={{ items: editingInvoice.items }}
                    onSave={handleSaveInvoice}
                    onClose={() => setEditingInvoice(null)}
                />
            </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
