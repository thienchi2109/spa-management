'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import PrescriptionForm from './prescription-form';
import type { Prescription, Patient } from '@/lib/types';

interface PrescriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient?: Patient;
  doctorName: string;
  doctorId?: string;
  doctorLicense?: string;
  medicalRecordId?: string;
  appointmentId?: string;
  diagnosis?: string;
  symptoms?: string;
  onSave?: (prescription: Prescription) => void;
  initialData?: Partial<Prescription>;
  mode?: 'create' | 'edit';
  title?: string;
}

export default function PrescriptionDialog({
  open,
  onOpenChange,
  patient,
  doctorName,
  doctorId,
  doctorLicense,
  medicalRecordId,
  appointmentId,
  diagnosis,
  symptoms,
  onSave,
  initialData,
  mode = 'create',
  title
}: PrescriptionDialogProps) {
  const handleSave = (prescription: Prescription) => {
    onSave?.(prescription);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const dialogTitle = title || (mode === 'create' ? 'Tạo đơn thuốc mới' : 'Chỉnh sửa đơn thuốc');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] p-0 flex flex-col">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle className="text-xl font-semibold">
            {dialogTitle}
          </DialogTitle>
          {patient && (
            <p className="text-sm text-gray-600">
              Khách hàng: <span className="font-medium">{patient.name}</span>
              {patient.id && (
                <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                  {patient.id}
                </span>
              )}
            </p>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <PrescriptionForm
              patient={patient}
              doctorName={doctorName}
              doctorId={doctorId}
              doctorLicense={doctorLicense}
              medicalRecordId={medicalRecordId}
              appointmentId={appointmentId}
              diagnosis={diagnosis}
              symptoms={symptoms}
              onSave={handleSave}
              onCancel={handleCancel}
              initialData={initialData}
              mode={mode}
            />
        </div>
      </DialogContent>
    </Dialog>
  );
}
