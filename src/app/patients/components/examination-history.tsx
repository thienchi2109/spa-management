'use client';

import { useState } from 'react';
import type { MedicalRecord, Invoice } from '@/lib/types';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Stethoscope, 
  FileText, 
  Pill, 
  Calendar, 
  User, 
  ClipboardList,
  CreditCard,
  AlertCircle
} from 'lucide-react';

interface ExaminationHistoryProps {
  patientId: string;
  patientName: string;
  medicalRecords: MedicalRecord[];
  invoices: Invoice[];
}

export function ExaminationHistory({ patientId, patientName, medicalRecords, invoices }: ExaminationHistoryProps) {
  // Filter medical records for this patient and sort by date (newest first)
  const patientMedicalRecords = medicalRecords
    .filter(record => record.patientId === patientId || record.patientName === patientName)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (patientMedicalRecords.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Chưa có lịch sử khám bệnh</h3>
        <p className="text-muted-foreground">
          Bệnh nhân chưa có kết quả khám bệnh chi tiết nào được ghi nhận.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Stethoscope className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Lịch sử khám bệnh chi tiết</h3>
        <Badge variant="secondary" className="ml-auto">
          {patientMedicalRecords.length} lần khám
        </Badge>
      </div>

      <Accordion type="single" collapsible className="w-full">
        {patientMedicalRecords.map((record) => {
          // Find corresponding invoice for this examination
          const relatedInvoice = invoices.find(
            inv => inv.patientName === record.patientName && inv.date === record.date
          );

          return (
            <AccordionItem value={record.id} key={record.id}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex justify-between items-center w-full pr-4">
                  <div className="flex flex-col items-start gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{formatDate(record.date)}</span>
                      {relatedInvoice && (
                        <Badge 
                          variant={relatedInvoice.status === 'Paid' ? 'default' : 
                                  relatedInvoice.status === 'Pending' ? 'secondary' : 'destructive'}
                          className="text-xs"
                        >
                          {relatedInvoice.status === 'Paid' ? 'Đã thanh toán' :
                           relatedInvoice.status === 'Pending' ? 'Chờ thanh toán' : 'Quá hạn'}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>Bác sĩ: {record.doctorName}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-primary">
                      {record.diagnosis}
                    </div>
                    {relatedInvoice && (
                      <div className="text-xs text-muted-foreground">
                        {formatCurrency(relatedInvoice.amount)}
                      </div>
                    )}
                  </div>
                </div>
              </AccordionTrigger>
              
              <AccordionContent className="space-y-4 pt-2">
                {/* Symptoms */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                    <h5 className="font-semibold text-sm">Triệu chứng</h5>
                  </div>
                  <p className="text-sm bg-orange-50 dark:bg-orange-950/20 p-3 rounded-lg border-l-4 border-orange-200 dark:border-orange-800">
                    {record.symptoms}
                  </p>
                </div>

                {/* Diagnosis */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-blue-500" />
                    <h5 className="font-semibold text-sm">Chẩn đoán</h5>
                  </div>
                  <p className="text-sm bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border-l-4 border-blue-200 dark:border-blue-800">
                    {record.diagnosis}
                  </p>
                </div>

                {/* Treatment */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-green-500" />
                    <h5 className="font-semibold text-sm">Phương pháp điều trị</h5>
                  </div>
                  <p className="text-sm bg-green-50 dark:bg-green-950/20 p-3 rounded-lg border-l-4 border-green-200 dark:border-green-800">
                    {record.treatment}
                  </p>
                </div>

                {/* Prescription */}
                {record.prescription && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Pill className="h-4 w-4 text-purple-500" />
                      <h5 className="font-semibold text-sm">Đơn thuốc</h5>
                    </div>
                    <p className="text-sm bg-purple-50 dark:bg-purple-950/20 p-3 rounded-lg border-l-4 border-purple-200 dark:border-purple-800 whitespace-pre-wrap">
                      {record.prescription}
                    </p>
                  </div>
                )}

                {/* Next Appointment */}
                {record.nextAppointment && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-indigo-500" />
                      <h5 className="font-semibold text-sm">Lịch hẹn tái khám</h5>
                    </div>
                    <p className="text-sm bg-indigo-50 dark:bg-indigo-950/20 p-3 rounded-lg border-l-4 border-indigo-200 dark:border-indigo-800">
                      {formatDate(record.nextAppointment)}
                    </p>
                  </div>
                )}

                {/* Additional Notes */}
                {record.notes && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <h5 className="font-semibold text-sm">Ghi chú thêm</h5>
                    </div>
                    <p className="text-sm bg-gray-50 dark:bg-gray-950/20 p-3 rounded-lg border-l-4 border-gray-200 dark:border-gray-800 whitespace-pre-wrap">
                      {record.notes}
                    </p>
                  </div>
                )}

                {/* Payment Information */}
                {relatedInvoice && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-emerald-500" />
                        <h5 className="font-semibold text-sm">Thông tin thanh toán</h5>
                      </div>
                      <div className="bg-emerald-50 dark:bg-emerald-950/20 p-3 rounded-lg border-l-4 border-emerald-200 dark:border-emerald-800">
                        <div className="space-y-1 text-sm">
                          {relatedInvoice.items.map((item) => (
                            <div key={item.id} className="flex justify-between">
                              <span>{item.description}</span>
                              <span className="font-medium">{formatCurrency(item.amount)}</span>
                            </div>
                          ))}
                          <Separator className="my-2" />
                          <div className="flex justify-between font-semibold">
                            <span>Tổng cộng:</span>
                            <span>{formatCurrency(relatedInvoice.amount)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
