'use client';

import { useState, useRef } from 'react';
import type { Patient, PatientDocument, Appointment, Invoice, MedicalRecord } from '@/lib/types';
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Cake,
  Phone,
  MapPin,
  HeartPulse,
  Upload,
  FileText,
  Download,
  Pencil,
  Trash2,
  Paperclip,
  History,
  Loader2,
} from 'lucide-react';
import { calculateAge, formatDate, formatCurrency } from '@/lib/utils';
import { PatientForm } from './patient-form';
import { useToast } from '@/hooks/use-toast';
import { getSignedURL } from '@/app/actions/r2';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExaminationHistory } from './examination-history';

interface PatientDetailProps {
  patient: Patient;
  appointments: Appointment[];
  invoices: Invoice[];
  medicalRecords: MedicalRecord[];
  onUpdatePatient: (patient: Patient) => void;
  onClose: () => void;
}

const translateGender = (gender: Patient['gender']) => {
  switch (gender) {
    case 'Male':
      return 'Nam';
    case 'Female':
      return 'Nữ';
    case 'Other':
      return 'Khác';
    default:
      return gender;
  }
};

export function PatientDetail({ patient, appointments, invoices, medicalRecords, onUpdatePatient, onClose }: PatientDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const patientHistory = appointments
    .filter(
      (app) => app.patientName === patient.name && app.status === 'Completed'
    )
    .map((app) => ({
      ...app,
      invoice: invoices.find(
        (inv) => inv.patientName === app.patientName && inv.date === app.date
      ),
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleSavePatientInfo = (formData: Omit<Patient, 'id' | 'lastVisit' | 'avatarUrl' | 'documents'>) => {
    const updatedPatient = { ...patient, ...formData };
    onUpdatePatient(updatedPatient);
    setIsEditing(false);
    toast({
      title: "Đã lưu thành công",
      description: `Thông tin cho bệnh nhân ${updatedPatient.name} đã được cập nhật.`,
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileToUpload(file);
    }
  };
  
  const handleUploadFile = async () => {
    if (!fileToUpload) return;
    setIsUploading(true);

    try {
      const signedUrlResult = await getSignedURL({
        fileType: fileToUpload.type,
        fileSize: fileToUpload.size,
        patientId: patient.id,
      });

      if (signedUrlResult.failure) {
        throw new Error(signedUrlResult.failure);
      }
      
      const { url, key } = signedUrlResult.success;

      const response = await fetch(url, {
        method: 'PUT',
        body: fileToUpload,
        headers: { 'Content-Type': fileToUpload.type },
      });

      if (!response.ok) {
        throw new Error(`Tải lên R2 thất bại. Trạng thái: ${response.status}.`);
      }

      if (!process.env.NEXT_PUBLIC_R2_PUBLIC_URL) {
          throw new Error('Cấu hình phía máy khách bị thiếu.');
      }

      const newDocument: PatientDocument = {
        id: key,
        name: fileToUpload.name,
        type: 'Tài liệu',
        uploadDate: new Date().toISOString().split('T')[0],
        url: `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${key}`,
      };
      
      const updatedDocuments = [...(patient.documents || []), newDocument];
      onUpdatePatient({ ...patient, documents: updatedDocuments });

      toast({
        title: "Tải lên thành công",
        description: `Tài liệu "${newDocument.name}" đã được thêm vào hồ sơ.`,
      });

    } catch (error) {
      console.error("Upload failed:", error);
      toast({
        variant: "destructive",
        title: "Tải lên thất bại",
        description: (error as Error).message || "Đã có lỗi xảy ra khi tải tệp lên.",
      });
    } finally {
      setIsUploading(false);
      setFileToUpload(null);
    }
  };

  const handleDeleteDocument = (documentId: string) => {
    const updatedDocuments = patient.documents?.filter(doc => doc.id !== documentId);
    onUpdatePatient({ ...patient, documents: updatedDocuments });
    toast({
      title: "Đã xóa tài liệu",
      description: "Tài liệu đã được xóa thành công.",
    });
  };

  if (isEditing) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Chỉnh sửa thông tin bệnh nhân</DialogTitle>
          <DialogDescription>Cập nhật thông tin chi tiết cho {patient.name}.</DialogDescription>
        </DialogHeader>
        <div className="py-4 max-h-[60vh] overflow-y-auto pr-4">
          <PatientForm 
            initialData={patient} 
            onSave={handleSavePatientInfo} 
            onClose={() => setIsEditing(false)}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <DialogHeader>
        <div className="flex items-start gap-4">
          <Avatar className="h-20 w-20 border">
            <AvatarImage src={patient.avatarUrl} alt={patient.name} data-ai-hint="person portrait" />
            <AvatarFallback>{patient.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <DialogTitle className="text-2xl font-headline">{patient.name}</DialogTitle>
            <DialogDescription className="text-base">
              Mã bệnh nhân: {patient.id}
            </DialogDescription>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                <span>{translateGender(patient.gender)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Cake className="h-4 w-4" />
                <span>{calculateAge(patient.birthYear)} tuổi (Năm sinh: {patient.birthYear})</span>
              </div>
            </div>
          </div>
        </div>
      </DialogHeader>

      <div className="py-4">
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="personal">Thông tin cá nhân</TabsTrigger>
            <TabsTrigger value="examination">Lịch sử khám bệnh</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="mt-4 space-y-6 max-h-[60vh] overflow-y-auto pr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Phone className="h-5 w-5 text-primary" />
                <span>{patient.phone}</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <MapPin className="h-5 w-5 text-primary" />
                <span>{patient.address}</span>
              </div>
            </div>

            {patient.medicalHistory && (
              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-2 text-base">
                  <HeartPulse className="h-5 w-5 text-primary" />
                  Tiền sử bệnh
                </h4>
                <p className="text-sm text-foreground bg-muted/50 p-3 rounded-lg whitespace-pre-wrap">{patient.medicalHistory}</p>
              </div>
            )}

            <Separator />

            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold flex items-center gap-2 text-base">
                  <FileText className="h-5 w-5 text-primary" />
                  Tài liệu & Kết quả khám
                </h4>
                <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="mr-2 h-4 w-4" />
                  Tải lên
                </Button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
              </div>

              {fileToUpload && (
                <div className="flex items-center justify-between p-2 pl-3 mb-3 border rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 overflow-hidden">
                      <Paperclip className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm font-medium truncate">{fileToUpload.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <Button size="sm" onClick={handleUploadFile} disabled={isUploading}>
                        {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                        Lưu tài liệu
                     </Button>
                     <Button size="sm" variant="ghost" onClick={() => setFileToUpload(null)} disabled={isUploading}>Hủy</Button>
                  </div>
                </div>
              )}

              {(patient.documents && patient.documents.length > 0) ? (
                <ul className="space-y-2">
                  {patient.documents.map(doc => (
                    <li key={doc.id} className="flex items-center justify-between p-2 border rounded-md hover:bg-muted/50">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <Paperclip className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="font-medium text-sm truncate text-primary hover:underline">
                            {doc.name}
                        </a>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className="text-xs text-muted-foreground">Tải lên: {formatDate(doc.uploadDate)}</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <a href={doc.url} download={doc.name} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive/90" onClick={() => handleDeleteDocument(doc.id)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                 !fileToUpload && (
                    <div className="text-center text-sm text-muted-foreground py-6 border-2 border-dashed rounded-lg">
                      <p>Chưa có tài liệu nào được tải lên.</p>
                    </div>
                )
              )}
            </div>
          </TabsContent>

          <TabsContent value="examination" className="mt-4 max-h-[60vh] overflow-y-auto pr-4">
            <ExaminationHistory
              patientId={patient.id}
              patientName={patient.name}
              medicalRecords={medicalRecords}
              invoices={invoices}
            />
          </TabsContent>
        </Tabs>
      </div>

      <DialogFooter className="pt-2 sm:justify-between">
        <Button type="button" onClick={() => setIsEditing(true)}>
          <Pencil className="mr-2 h-4 w-4" />
          Sửa
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>Đóng</Button>
      </DialogFooter>
    </>
  );
}
