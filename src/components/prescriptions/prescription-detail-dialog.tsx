'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import { 
  FileText, 
  User, 
  Stethoscope, 
  Calendar, 
  Clock, 
  MapPin,
  Phone,
  Printer,
  Edit,
  X
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

interface PrescriptionDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prescription: Prescription | null;
  onEdit?: (prescription: Prescription) => void;
  onPrint?: (prescription: Prescription) => void;
}

export default function PrescriptionDetailDialog({
  open,
  onOpenChange,
  prescription,
  onEdit,
  onPrint
}: PrescriptionDetailDialogProps) {
  if (!prescription) return null;

  const isExpired = !isPrescriptionValid(prescription.validUntil);
  const canEdit = prescription.status === PRESCRIPTION_STATUSES.DRAFT;
  const canPrint = prescription.status === PRESCRIPTION_STATUSES.FINALIZED;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 flex flex-col">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Chi tiết đơn thuốc
              </DialogTitle>
              <p className="text-sm text-gray-600 mt-1">
                Mã đơn: <span className="font-medium">{prescription.id}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={getPrescriptionStatusVariant(prescription.status)}>
                {formatPrescriptionStatus(prescription.status)}
              </Badge>
              {isExpired && (
                <Badge variant="destructive">Hết hạn</Badge>
              )}
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-6">
            {/* Patient Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Thông tin khách hàng
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Họ tên</p>
                    <p className="font-medium">{prescription.patientName}</p>
                  </div>
                  {prescription.patientAge && (
                    <div>
                      <p className="text-sm text-gray-600">Tuổi</p>
                      <p className="font-medium">{prescription.patientAge} tuổi</p>
                    </div>
                  )}
                  {prescription.patientGender && (
                    <div>
                      <p className="text-sm text-gray-600">Giới tính</p>
                      <p className="font-medium">{prescription.patientGender === 'Male' ? 'Nam' : 'Nữ'}</p>
                    </div>
                  )}
                  {prescription.patientWeight && (
                    <div>
                      <p className="text-sm text-gray-600">Cân nặng</p>
                      <p className="font-medium">{prescription.patientWeight} kg</p>
                    </div>
                  )}
                  {prescription.patientAddress && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-600">Địa chỉ</p>
                      <p className="font-medium">{prescription.patientAddress}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Doctor and Medical Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5" />
                  Thông tin y tế
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Bác sĩ kê đơn</p>
                    <p className="font-medium">{prescription.doctorName}</p>
                    {prescription.doctorLicense && (
                      <p className="text-xs text-gray-500">Số CCHN: {prescription.doctorLicense}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Ngày kê đơn</p>
                    <p className="font-medium">{formatDate(prescription.date)}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600">Chẩn đoán</p>
                    <p className="font-medium">{prescription.diagnosis}</p>
                  </div>
                  {prescription.symptoms && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-600">Tình trạng</p>
                      <p className="font-medium">{prescription.symptoms}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Prescription Items */}
            <Card>
              <CardHeader>
                <CardTitle>Danh sách thuốc ({prescription.items.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Scrollable medication list with max height */}
                <div className="max-h-96 overflow-y-auto pr-4">
                  <div className="space-y-4">
                    {prescription.items.map((item, index) => (
                      <div key={item.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-medium text-lg">{item.medicationName}</h4>
                            {item.concentration && (
                              <p className="text-sm text-gray-600">
                                Nồng độ: {item.concentration}
                                {item.dosageForm && ` • Dạng: ${item.dosageForm}`}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{formatCurrency(item.totalCost)}</p>
                            <p className="text-sm text-gray-600">
                              {item.quantity} {item.unit} × {formatCurrency(item.unitPrice)}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Liều dùng:</span> {item.dosage}
                          </div>
                          <div>
                            <span className="font-medium">Số lượng:</span> {item.quantity} {item.unit}
                          </div>
                        </div>

                        <div className="mt-2 text-sm">
                          <span className="font-medium">Cách dùng:</span> {item.instructions}
                        </div>

                        {item.notes && (
                          <div className="mt-2 text-sm text-gray-600">
                            <span className="font-medium">Ghi chú:</span> {item.notes}
                          </div>
                        )}

                        {index < prescription.items.length - 1 && (
                          <Separator className="mt-4" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium">Tổng cộng:</span>
                  <span className="text-xl font-bold text-green-600">
                    {formatCurrency(prescription.totalCost)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Doctor Notes and Additional Info */}
            {(prescription.doctorNotes || prescription.nextAppointment) && (
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin bổ sung</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {prescription.doctorNotes && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Lời dặn của bác sĩ</p>
                      <p className="text-sm bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
                        {prescription.doctorNotes}
                      </p>
                    </div>
                  )}
                  
                  {prescription.nextAppointment && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Ngày hẹn tái khám:</span>
                      <span className="font-medium">{formatDate(prescription.nextAppointment)}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Hiệu lực đến:</span>
                    <span className={`font-medium ${isExpired ? 'text-red-500' : ''}`}>
                      {prescription.validUntil ? formatDate(prescription.validUntil) : 'Không giới hạn'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Clinic Information */}
            {prescription.clinicInfo && (
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin phòng khám</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="font-medium">{prescription.clinicInfo.name}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      {prescription.clinicInfo.address}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      {prescription.clinicInfo.phone}
                    </div>
                    <p className="text-xs text-gray-500">
                      Giấy phép: {prescription.clinicInfo.licenseNumber}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 border-t bg-gray-50">
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4 mr-2" />
              Đóng
            </Button>
            
            <div className="flex gap-2">
              {canEdit && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    onEdit?.(prescription);
                    onOpenChange(false);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Chỉnh sửa
                </Button>
              )}
              
              {canPrint && (
                <Button 
                  onClick={() => {
                    onPrint?.(prescription);
                  }}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  In đơn thuốc
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
