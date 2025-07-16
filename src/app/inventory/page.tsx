
'use client';

import React, { useState, useMemo, useCallback } from 'react';
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

import { PlusCircle, Loader2, Search, Filter, Grid, List, Package } from 'lucide-react';
import type { SpaService } from '@/lib/types';
import { updateService, deleteService } from '@/lib/sheets-utils';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/contexts/data-context';
import { ServiceCard } from './components/service-card';
import { CSVUploadDialog } from './components/csv-upload-dialog';
import { ServiceDetailDialog } from './components/service-detail-dialog';
import { ServiceEditDialog } from './components/service-edit-dialog';
import { LazyCard } from '@/components/ui/lazy-loader';
import type { BatchImportResult } from '@/lib/sheets-utils';

const getServiceStatus = (service: SpaService) => {
  if (!service.isActive) {
    return { text: 'Ngưng hoạt động', variant: 'destructive' as const };
  }
  if (service.discountPrice && service.discountPrice < service.price) {
    return { text: 'Khuyến mãi', variant: 'secondary' as const };
  }
  return { text: 'Hoạt động', variant: 'default' as const };
};

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { toast } = useToast();

  // Use cached data from context
  const {
    services,
    isLoadingServices: loading,
    refetchServices,
    updateServiceOptimistic,
    deleteServiceOptimistic
  } = useData();

  // State for dialogs
  const [selectedService, setSelectedService] = useState<SpaService | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<SpaService | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deletingService, setDeletingService] = useState<SpaService | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);


  // Filtered and searched services
  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      // Search filter
      const matchesSearch = searchTerm === '' ||
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (service.requiredStaff && service.requiredStaff.some(staff => 
          staff.toLowerCase().includes(searchTerm.toLowerCase())
        ));

      // Status filter
      let matchesStatus = true;
      if (statusFilter !== 'all') {
        const serviceStatus = getServiceStatus(service);
        
        if (statusFilter === 'active') {
          matchesStatus = service.isActive;
        } else if (statusFilter === 'inactive') {
          matchesStatus = !service.isActive;
        } else if (statusFilter === 'promotion') {
          matchesStatus = !!(service.discountPrice && service.discountPrice < service.price);
        }
      }

      // Category filter
      const matchesCategory = categoryFilter === 'all' || service.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [services, searchTerm, statusFilter, categoryFilter]);

  // Get unique categories for filter
  const categories = useMemo(() => {
    const cats = [...new Set(services.map(service => service.category))];
    return cats.sort();
  }, [services]);

  const handleImportComplete = useCallback((result: BatchImportResult) => {
    if (result.success && result.successfulRecords > 0) {
      refetchServices();
    }
  }, [refetchServices]);

  // Handlers for viewing details
  const handleViewDetails = (service: SpaService) => {
    setSelectedService(service);
    setIsDetailDialogOpen(true);
  };

  // Handlers for editing
  const handleEdit = (service: SpaService) => {
    setEditingService(service);
    setIsEditDialogOpen(true);
  };

  const handleUpdateService = async (updatedService: SpaService) => {
    try {
      await updateServiceOptimistic(updatedService, async () => {
        return await updateService(updatedService);
      });
      toast({ title: 'Thành công', description: 'Thông tin dịch vụ đã được cập nhật.' });
    } catch (error) {
      console.error("Failed to update service:", error);
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Không thể cập nhật thông tin dịch vụ.' });
    }
  };

  // Handlers for deleting
  const handleDelete = (service: SpaService) => {
    setDeletingService(service);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingService || !deletingService.id) return;
    try {
      await deleteServiceOptimistic(deletingService.id, async () => {
        return await deleteService(deletingService.id);
      });
      toast({ title: 'Thành công', description: `Dịch vụ ${deletingService.name} đã được xóa.` });
      setDeletingService(null);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Failed to delete service:", error);
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Không thể xóa dịch vụ.' });
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
          <h1 className="text-2xl font-headline font-bold">Dịch vụ</h1>
          <div className="flex gap-2">
            <CSVUploadDialog onImportComplete={handleImportComplete} />
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Thêm dịch vụ
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Tìm kiếm và lọc</CardTitle>
            <CardDescription>
              Tìm kiếm theo tên dịch vụ, danh mục, mô tả hoặc kỹ thuật viên
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {/* Search bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Tìm kiếm dịch vụ..."
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
                    <SelectItem value="active">Hoạt động</SelectItem>
                    <SelectItem value="inactive">Ngưng hoạt động</SelectItem>
                    <SelectItem value="promotion">Khuyến mãi</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả danh mục</SelectItem>
                    {categories.map((category, index) => (
                      <SelectItem key={`${category}-${index}`} value={category}>
                        {category}
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
            <CardTitle>Danh sách dịch vụ ({filteredServices.length})</CardTitle>
            <CardDescription>
              Quản lý thông tin chi tiết về các dịch vụ spa
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredServices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Không tìm thấy dịch vụ nào phù hợp với tiêu chí tìm kiếm</p>
              </div>
            ) : (
              <div className={`grid gap-4 ${
                viewMode === 'grid'
                  ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                  : 'grid-cols-1'
              }`}>
                {filteredServices.map((service, index) => (
                  <LazyCard key={service.id} delay={index * 50}>
                    <ServiceCard
                      service={service}
                      onView={handleViewDetails}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  </LazyCard>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <ServiceDetailDialog
        isOpen={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
        service={selectedService}
      />
      <ServiceEditDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        service={editingService}
        onServiceUpdate={handleUpdateService}
      />
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể được hoàn tác. Thao tác này sẽ xóa vĩnh viễn dịch vụ 
              <strong>{deletingService?.name}</strong> khỏi cơ sở dữ liệu.
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
