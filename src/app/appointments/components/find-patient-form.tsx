
'use client';

import * as React from 'react';
import { UserPlus } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { PatientForm } from '@/app/patients/components/patient-form';
import type { Patient } from '@/lib/types';
import { Card } from '@/components/ui/card';

interface FindPatientFormProps {
  patients: Patient[];
  walkInQueue: Patient[];
  onAddToQueue: (patient: Patient) => void;
  onSaveNewPatient: (patientData: Omit<Patient, 'id' | 'lastVisit' | 'avatarUrl' | 'documents'>) => Promise<Patient>;
  onClose: () => void;
}

export function FindPatientForm({ patients, walkInQueue, onAddToQueue, onSaveNewPatient, onClose }: FindPatientFormProps) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedPatient, setSelectedPatient] = React.useState<Patient | undefined>();
  const [isNewPatientDialogOpen, setIsNewPatientDialogOpen] = React.useState(false);
  const [isPatientListVisible, setIsPatientListVisible] = React.useState(false);
  const [error, setError] = React.useState('');

  const availablePatients = patients.filter(p => !walkInQueue.some(q => q.id === p.id));
  
  const filteredPatients = React.useMemo(() => {
    if (!searchTerm) {
      return [];
    }
    return availablePatients.filter(patient =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, availablePatients]);

  const handleAddToQueue = () => {
    if (selectedPatient) {
      if (walkInQueue.some(p => p.id === selectedPatient.id)) {
        setError('Bệnh nhân này đã có trong hàng chờ.');
        return;
      }
      setError('');
      onAddToQueue(selectedPatient);
      onClose();
    }
  };
  
  const handleSaveNewPatient = async (patientData: Omit<Patient, 'id' | 'lastVisit' | 'avatarUrl' | 'documents'>) => {
    const newPatient = await onSaveNewPatient(patientData);
    onAddToQueue(newPatient);
    setIsNewPatientDialogOpen(false);
    onClose();
  };

  return (
    <div className="py-4 space-y-4">
      <div className="grid gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="patient-search">Tìm bệnh nhân hiện có</Label>
           <div className="relative w-full">
              <Input
                id="patient-search"
                placeholder="Nhập để tìm kiếm bệnh nhân..."
                value={searchTerm}
                onChange={(e) => {
                    setSearchTerm(e.target.value);
                    if (selectedPatient) {
                        setSelectedPatient(undefined);
                    }
                    if (!isPatientListVisible) setIsPatientListVisible(true);
                }}
                onFocus={() => setIsPatientListVisible(true)}
                onBlur={() => {
                    setTimeout(() => {
                        setIsPatientListVisible(false);
                    }, 150);
                }}
                autoComplete="off"
              />
              {isPatientListVisible && searchTerm && (
                <div className="absolute top-full mt-1 w-full z-10">
                    <Card>
                        <ScrollArea className="h-auto max-h-48 p-1">
                        {filteredPatients.length > 0 ? (
                            filteredPatients.map((p) => (
                            <div
                                key={p.id}
                                className="p-2 text-sm hover:bg-accent rounded-md cursor-pointer"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    setSelectedPatient(p);
                                    setSearchTerm(p.name);
                                    setIsPatientListVisible(false);
                                    setError('');
                                }}
                            >
                                {p.name}
                            </div>
                            ))
                        ) : (
                            <p className="p-2 text-center text-sm text-muted-foreground">
                            Không tìm thấy bệnh nhân.
                            </p>
                        )}
                        </ScrollArea>
                    </Card>
                </div>
              )}
            </div>
        </div>
        
        {error && <p className="text-sm font-medium text-destructive">{error}</p>}
        
        <Button onClick={handleAddToQueue} disabled={!selectedPatient}>
          Thêm bệnh nhân đã chọn vào hàng chờ
        </Button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Hoặc</span>
        </div>
      </div>

      <Dialog open={isNewPatientDialogOpen} onOpenChange={setIsNewPatientDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="secondary" className="w-full">
            <UserPlus className="mr-2 h-4 w-4" />
            Tạo hồ sơ bệnh nhân mới
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm hồ sơ bệnh nhân mới</DialogTitle>
          </DialogHeader>
          <PatientForm
            onSave={handleSaveNewPatient}
            onClose={() => setIsNewPatientDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
