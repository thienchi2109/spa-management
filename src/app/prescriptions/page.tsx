'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, FileText, Search, Filter, Eye, Edit, Printer, Calendar, User, Stethoscope } from 'lucide-react';
import { formatDate, formatCurrency, printPrescription } from '@/lib/utils';
import { PRESCRIPTION_STATUS_LABELS, PRESCRIPTION_STATUS_VARIANTS } from '@/lib/prescription-constants';
import { useToast } from '@/hooks/use-toast';

import {
  PrescriptionDialog,
  PrescriptionDetailDialog,
  type Prescription
} from '@/components/prescriptions';

// Mock data for testing
import { prescriptions as mockPrescriptions, patients, medications } from '@/lib/mock-data';

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(mockPrescriptions);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<Prescription[]>(mockPrescriptions);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [editingPrescription, setEditingPrescription] = useState<Prescription | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const { toast } = useToast();

  // Mock doctor info
  const currentDoctor = {
    id: 'DOC001',
    name: 'Bs. Minh',
    license: '001234/BYT-CCHN'
  };

  useEffect(() => {
    let filtered = prescriptions;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.doctorName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    setFilteredPrescriptions(filtered);
  }, [prescriptions, searchTerm, statusFilter]);

  const handleCreatePrescription = (prescription: Prescription) => {
    setPrescriptions(prev => [prescription, ...prev]);
    toast({
      title: 'Thành công',
      description: 'Đã tạo đơn thuốc thành công'
    });
  };

  const handleUpdatePrescription = (updatedPrescription: Prescription) => {
    setPrescriptions(prev => 
      prev.map(p => p.id === updatedPrescription.id ? updatedPrescription : p)
    );
    setEditingPrescription(null);
    toast({
      title: 'Thành công',
      description: 'Đã cập nhật đơn thuốc thành công'
    });
  };

  const handleViewPrescription = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setShowDetailDialog(true);
  };

  const handleEditPrescription = (prescription: Prescription) => {
    setEditingPrescription(prescription);
    setShowCreateDialog(true);
  };

  const handlePrintPrescription = (prescription: Prescription) => {
    printPrescription(prescription);
    toast({
      title: 'Thành công',
      description: 'Đã mở cửa sổ in đơn thuốc'
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    return PRESCRIPTION_STATUS_VARIANTS[status as keyof typeof PRESCRIPTION_STATUS_VARIANTS] || 'outline';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản lý đơn thuốc</h1>
          <p className="text-gray-600 mt-2">
            Tạo, quản lý và theo dõi đơn thuốc cho bệnh nhân
          </p>
        </div>
        <Button 
          onClick={() => {
            setEditingPrescription(null);
            setShowCreateDialog(true);
          }}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Tạo đơn thuốc mới
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tổng đơn thuốc</p>
                <p className="text-2xl font-bold">{prescriptions.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Bản nháp</p>
                <p className="text-2xl font-bold text-orange-600">
                  {prescriptions.filter(p => p.status === 'Draft').length}
                </p>
              </div>
              <FileText className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Đã hoàn thành</p>
                <p className="text-2xl font-bold text-green-600">
                  {prescriptions.filter(p => p.status === 'Finalized').length}
                </p>
              </div>
              <FileText className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Đã cấp thuốc</p>
                <p className="text-2xl font-bold text-blue-600">
                  {prescriptions.filter(p => p.status === 'Dispensed').length}
                </p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Search className="h-4 w-4 text-gray-500" />
          <Input
            placeholder="Tìm kiếm theo tên bệnh nhân, chẩn đoán..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Lọc theo trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="Draft">Bản nháp</SelectItem>
              <SelectItem value="Finalized">Đã hoàn thành</SelectItem>
              <SelectItem value="Dispensed">Đã cấp thuốc</SelectItem>
              <SelectItem value="Cancelled">Đã hủy</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Prescription Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPrescriptions.map((prescription) => (
          <Card key={prescription.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold truncate">
                  {prescription.patientName}
                </CardTitle>
                <Badge variant={getStatusBadgeVariant(prescription.status)}>
                  {PRESCRIPTION_STATUS_LABELS[prescription.status as keyof typeof PRESCRIPTION_STATUS_LABELS]}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(prescription.date)}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Bác sĩ:</span>
                <span>{prescription.doctorName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Stethoscope className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Chẩn đoán:</span>
                <span className="truncate" title={prescription.diagnosis}>
                  {prescription.diagnosis}
                </span>
              </div>
              <div className="text-sm">
                <span className="font-medium">Số loại thuốc:</span>
                <span className="ml-2">{prescription.items.length}</span>
              </div>
              <div className="text-sm">
                <span className="font-medium">Tổng chi phí:</span>
                <span className="ml-2 font-semibold text-green-600">
                  {formatCurrency(prescription.totalCost)}
                </span>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewPrescription(prescription)}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Xem
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditPrescription(prescription)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Sửa
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePrintPrescription(prescription)}
                  className="flex-1"
                >
                  <Printer className="h-4 w-4 mr-1" />
                  In
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPrescriptions.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600">Không tìm thấy đơn thuốc</h3>
          <p className="text-gray-500 mt-2">
            {searchTerm || statusFilter !== 'all' 
              ? 'Thử thay đổi bộ lọc để xem thêm kết quả' 
              : 'Chưa có đơn thuốc nào được tạo'
            }
          </p>
        </div>
      )}

      {/* Create/Edit Prescription Dialog */}
      <PrescriptionDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        patient={patients[0]} // Mock patient for testing
        doctorName={currentDoctor.name}
        doctorId={currentDoctor.id}
        doctorLicense={currentDoctor.license}
        diagnosis="Viêm họng cấp tính"
        symptoms="Đau họng, khó nuốt"
        onSave={editingPrescription ? handleUpdatePrescription : handleCreatePrescription}
        initialData={editingPrescription || undefined}
        mode={editingPrescription ? 'edit' : 'create'}
        title={editingPrescription ? 'Chỉnh sửa đơn thuốc' : 'Tạo đơn thuốc mới'}
      />

      {/* Prescription Detail Dialog */}
      <PrescriptionDetailDialog
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
        prescription={selectedPrescription}
        onEdit={handleEditPrescription}
        onPrint={handlePrintPrescription}
      />
    </div>
  );
}
