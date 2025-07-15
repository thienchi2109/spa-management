'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Printer, 
  Calendar,
  User,
  Stethoscope,
  Clock
} from 'lucide-react';

import type { Prescription } from '@/lib/types';
import { 
  formatDate, 
  formatCurrency, 
  formatPrescriptionStatus,
  getPrescriptionStatusVariant,
  isPrescriptionValid
} from '@/lib/utils';
import { PRESCRIPTION_STATUSES } from '@/lib/prescription-constants';

interface PrescriptionListProps {
  prescriptions: Prescription[];
  onView?: (prescription: Prescription) => void;
  onEdit?: (prescription: Prescription) => void;
  onPrint?: (prescription: Prescription) => void;
  loading?: boolean;
}

export default function PrescriptionList({
  prescriptions,
  onView,
  onEdit,
  onPrint,
  loading = false
}: PrescriptionListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [doctorFilter, setDoctorFilter] = useState<string>('all');

  // Filter prescriptions
  const filteredPrescriptions = prescriptions.filter(prescription => {
    const matchesSearch = 
      prescription.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.diagnosis.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || prescription.status === statusFilter;
    const matchesDoctor = doctorFilter === 'all' || prescription.doctorName === doctorFilter;

    return matchesSearch && matchesStatus && matchesDoctor;
  });

  // Get unique doctors for filter
  const uniqueDoctors = Array.from(new Set(prescriptions.map(p => p.doctorName)));

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Bộ lọc và tìm kiếm
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm theo tên bệnh nhân, mã đơn, chẩn đoán..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Lọc theo trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  {Object.values(PRESCRIPTION_STATUSES).map(status => (
                    <SelectItem key={status} value={status}>
                      {formatPrescriptionStatus(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={doctorFilter} onValueChange={setDoctorFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Lọc theo bác sĩ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả bác sĩ</SelectItem>
                  {uniqueDoctors.map(doctor => (
                    <SelectItem key={doctor} value={doctor}>
                      {doctor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Hiển thị {filteredPrescriptions.length} / {prescriptions.length} đơn thuốc
        </p>
      </div>

      {/* Prescription Cards */}
      <div className="space-y-4">
        {filteredPrescriptions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Không tìm thấy đơn thuốc
              </h3>
              <p className="text-gray-600">
                Thử điều chỉnh bộ lọc hoặc tìm kiếm với từ khóa khác.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredPrescriptions.map(prescription => (
            <Card key={prescription.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{prescription.id}</h3>
                      <Badge variant={getPrescriptionStatusVariant(prescription.status)}>
                        {formatPrescriptionStatus(prescription.status)}
                      </Badge>
                      {!isPrescriptionValid(prescription.validUntil) && (
                        <Badge variant="destructive">Hết hạn</Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">Bệnh nhân:</span>
                        <span>{prescription.patientName}</span>
                        {prescription.patientAge && (
                          <span className="text-gray-500">({prescription.patientAge} tuổi)</span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Stethoscope className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">Bác sĩ:</span>
                        <span>{prescription.doctorName}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">Ngày kê:</span>
                        <span>{formatDate(prescription.date)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">Hiệu lực đến:</span>
                        <span className={!isPrescriptionValid(prescription.validUntil) ? 'text-red-500' : ''}>
                          {prescription.validUntil ? formatDate(prescription.validUntil) : 'Không giới hạn'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <p className="text-sm">
                        <span className="font-medium">Chẩn đoán:</span> {prescription.diagnosis}
                      </p>
                    </div>
                    
                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        {prescription.items.length} loại thuốc
                      </div>
                      <div className="text-lg font-semibold text-green-600">
                        {formatCurrency(prescription.totalCost)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onView?.(prescription)}
                      className="flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Xem
                    </Button>
                    
                    {prescription.status === PRESCRIPTION_STATUSES.DRAFT && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit?.(prescription)}
                        className="flex items-center gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Sửa
                      </Button>
                    )}
                    
                    {prescription.status === PRESCRIPTION_STATUSES.FINALIZED && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPrint?.(prescription)}
                        className="flex items-center gap-2"
                      >
                        <Printer className="h-4 w-4" />
                        In
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
