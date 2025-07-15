
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { medications as mockMedications } from '@/lib/mock-data';
import { PlusCircle, Loader2, Search, Filter, Grid, List, Package } from 'lucide-react';
import type { Medication } from '@/lib/types';
import { seedAndFetchCollection, updateMedication, deleteMedication } from '@/lib/firestore-utils';
import { useToast } from '@/hooks/use-toast';
import { MedicationCard } from './components/medication-card';
import { CSVUploadDialog } from './components/csv-upload-dialog';
import { MedicationDetailDialog } from './components/medication-detail-dialog';
import { MedicationEditDialog } from './components/medication-edit-dialog';
import type { BatchImportResult } from '@/lib/firestore-utils';

const getExpiryStatus = (expiryDate: string) => {
  const today = new Date('2024-07-30'); // Use static date to prevent hydration errors
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { text: 'Đã hết hạn', variant: 'destructive' as const };
  }
  if (diffDays <= 30) {
    return { text: 'Sắp hết hạn', variant: 'secondary' as const };
  }
  return { text: 'Còn hàng', variant: 'default' as const };
};

export default function InventoryPage() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dosageFormFilter, setDosageFormFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { toast } = useToast();

  // State for dialogs
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deletingMedication, setDeletingMedication] = useState<Medication | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);


  // Filtered and searched medications
  const filteredMedications = useMemo(() => {
    return medications.filter((med) => {
      // Search filter
      const matchesSearch = searchTerm === '' ||
        med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        med.activeIngredient.toLowerCase().includes(searchTerm.toLowerCase()) ||
        med.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        med.batchNo.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      let matchesStatus = true;
      if (statusFilter !== 'all') {
        const expiryStatus = getExpiryStatus(med.expiryDate);
        const stockStatus = med.stock <= med.minStockThreshold ? 'low-stock' : 'normal-stock';

        if (statusFilter === 'expired') {
          matchesStatus = expiryStatus.variant === 'destructive';
        } else if (statusFilter === 'expiring') {
          matchesStatus = expiryStatus.variant === 'secondary';
        } else if (statusFilter === 'low-stock') {
          matchesStatus = stockStatus === 'low-stock';
        } else if (statusFilter === 'normal') {
          matchesStatus = expiryStatus.variant === 'default' && stockStatus === 'normal-stock';
        }
      }

      // Dosage form filter
      const matchesDosageForm = dosageFormFilter === 'all' || med.dosageForm === dosageFormFilter;

      return matchesSearch && matchesStatus && matchesDosageForm;
    });
  }, [medications, searchTerm, statusFilter, dosageFormFilter]);

  // Get unique dosage forms for filter
  const dosageForms = useMemo(() => {
    const forms = [...new Set(medications.map(med => med.dosageForm))];
    return forms.sort();
  }, [medications]);

  const loadData = useCallback(async () => {
    try {
        const medicationsData = await seedAndFetchCollection('medications', mockMedications);
        setMedications(medicationsData);
    } catch (error) {
        console.error("Failed to load medications from Firestore", error);
         toast({
            variant: 'destructive',
            title: 'Lỗi tải dữ liệu',
            description: 'Không thể tải dữ liệu kho thuốc từ máy chủ.'
        });
    } finally {
        setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleImportComplete = useCallback((result: BatchImportResult) => {
    if (result.success && result.successfulRecords > 0) {
      loadData();
    }
  }, [loadData]);

  // Handlers for viewing details
  const handleViewDetails = (medication: Medication) => {
    setSelectedMedication(medication);
    setIsDetailDialogOpen(true);
  };

  // Handlers for editing
  const handleEdit = (medication: Medication) => {
    setEditingMedication(medication);
    setIsEditDialogOpen(true);
  };

  const handleUpdateMedication = async (updatedMedication: Medication) => {
    try {
      await updateMedication(updatedMedication);
      toast({ title: 'Thành công', description: 'Thông tin thuốc đã được cập nhật.' });
      loadData(); // Refresh data
    } catch (error) {
      console.error("Failed to update medication:", error);
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Không thể cập nhật thông tin thuốc.' });
    }
  };

  // Handlers for deleting
  const handleDelete = (medication: Medication) => {
    setDeletingMedication(medication);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingMedication || !deletingMedication.id) return;
    try {
      await deleteMedication(deletingMedication.id);
      toast({ title: 'Thành công', description: `Thuốc ${deletingMedication.name} đã được xóa.` });
      loadData(); // Refresh data
      setDeletingMedication(null);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Failed to delete medication:", error);
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Không thể xóa thuốc.' });
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
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-headline font-bold">Kho thuốc</h1>
          <div className="flex gap-2">
            <CSVUploadDialog onImportComplete={handleImportComplete} />
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Thêm thuốc
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Tìm kiếm và lọc</CardTitle>
            <CardDescription>
              Tìm kiếm theo tên thuốc, hoạt chất, nhà sản xuất hoặc số lô
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {/* Search bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Tìm kiếm thuốc..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Lọc:</span>
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                    <SelectItem value="normal">Bình thường</SelectItem>
                    <SelectItem value="expiring">Sắp hết hạn</SelectItem>
                    <SelectItem value="expired">Đã hết hạn</SelectItem>
                    <SelectItem value="low-stock">Tồn kho thấp</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={dosageFormFilter} onValueChange={setDosageFormFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Dạng bào chế" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả dạng bào chế</SelectItem>
                    {dosageForms.map((form, index) => (
                      <SelectItem key={`${form}-${index}`} value={form}>
                        {form}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-1 ml-auto">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>Danh sách thuốc ({filteredMedications.length})</CardTitle>
            <CardDescription>
              Quản lý thông tin chi tiết về thuốc trong kho
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredMedications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Không tìm thấy thuốc nào phù hợp với tiêu chí tìm kiếm</p>
              </div>
            ) : (
              <div className={`grid gap-4 ${
                viewMode === 'grid'
                  ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                  : 'grid-cols-1'
              }`}>
                {filteredMedications.map((medication) => (
                  <MedicationCard
                    key={medication.id}
                    medication={medication}
                    onView={handleViewDetails}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <MedicationDetailDialog
        isOpen={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
        medication={selectedMedication}
      />
      <MedicationEditDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        medication={editingMedication}
        onMedicationUpdate={handleUpdateMedication}
      />
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể được hoàn tác. Thao tác này sẽ xóa vĩnh viễn thuốc 
              <strong>{deletingMedication?.name}</strong> khỏi cơ sở dữ liệu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Tiếp tục</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
