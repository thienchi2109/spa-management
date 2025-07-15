'use client';

import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileText, 
  Download, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Loader2,
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  parseCSVContent,
  validateAndTransformCSVData,
  generateCSVTemplate,
  type CSVParseResult
} from '@/lib/csv-parser';
import { downloadMedicationExcelTemplate } from '@/lib/excel-template';
import { 
  batchImportMedications, 
  checkForDuplicateMedications,
  type BatchImportResult 
} from '@/lib/firestore-utils';
import type { Medication } from '@/lib/types';

interface CSVUploadDialogProps {
  onImportComplete?: (result: BatchImportResult) => void;
}

type UploadStep = 'select' | 'preview' | 'importing' | 'complete';

export function CSVUploadDialog({ onImportComplete }: CSVUploadDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<UploadStep>('select');
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<CSVParseResult | null>(null);
  const [importResult, setImportResult] = useState<BatchImportResult | null>(null);
  const [duplicateCheck, setDuplicateCheck] = useState<{
    duplicates: Array<{ medication: Medication; existingId: string }>;
    unique: Medication[];
  } | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  
  const { toast } = useToast();

  const resetDialog = useCallback(() => {
    setStep('select');
    setFile(null);
    setParseResult(null);
    setImportResult(null);
    setDuplicateCheck(null);
    setImportProgress(0);
    setIsDragOver(false);
  }, []);

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    console.log('🔍 File selected:', selectedFile.name, selectedFile.size, selectedFile.type);

    if (!selectedFile.name.endsWith('.csv')) {
      toast({
        variant: 'destructive',
        title: 'File không hợp lệ',
        description: 'Vui lòng chọn file CSV (.csv)'
      });
      return;
    }

    setFile(selectedFile);

    try {
      console.log('📖 Reading file content...');
      const content = await selectedFile.text();
      console.log('📄 File content preview:', content.substring(0, 200) + '...');

      console.log('🔧 Parsing CSV...');
      const csvData = parseCSVContent(content);
      console.log('📊 Parsed CSV data:', csvData.length, 'rows');
      console.log('📋 First row:', csvData[0]);

      console.log('✅ Validating data...');
      const result = validateAndTransformCSVData(csvData);
      console.log('🎯 Validation result:', result);

      setParseResult(result);

      if (result.success && result.data.length > 0) {
        console.log('🔍 Checking for duplicates...');
        // Check for duplicates
        const duplicateResult = await checkForDuplicateMedications(result.data);
        console.log('📝 Duplicate check result:', duplicateResult);
        setDuplicateCheck(duplicateResult);
        setStep('preview');
      } else {
        console.error('❌ Validation failed:', result.errors);
        toast({
          variant: 'destructive',
          title: 'Lỗi xử lý file',
          description: `File CSV có lỗi: ${result.errors.slice(0, 3).join(', ')}${result.errors.length > 3 ? '...' : ''}`
        });
      }
    } catch (error) {
      console.error('💥 Error processing CSV:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi đọc file',
        description: 'Không thể đọc file CSV. Vui lòng kiểm tra định dạng file.'
      });
    }
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleImport = useCallback(async () => {
    if (!duplicateCheck) return;
    
    setStep('importing');
    setImportProgress(0);
    
    try {
      // Import only unique medications (skip duplicates)
      const medicationsToImport = duplicateCheck.unique;
      
      if (medicationsToImport.length === 0) {
        toast({
          variant: 'destructive',
          title: 'Không có dữ liệu mới',
          description: 'Tất cả thuốc trong file đã tồn tại trong hệ thống.'
        });
        setStep('preview');
        return;
      }

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setImportProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await batchImportMedications(medicationsToImport);
      
      clearInterval(progressInterval);
      setImportProgress(100);
      setImportResult(result);
      setStep('complete');
      
      if (result.success) {
        toast({
          title: 'Import thành công',
          description: `Đã import ${result.successfulRecords} thuốc vào hệ thống.`
        });
        onImportComplete?.(result);
      } else {
        toast({
          variant: 'destructive',
          title: 'Import có lỗi',
          description: `${result.successfulRecords}/${result.totalRecords} thành công. Có ${result.errors.length} lỗi.`
        });
      }
      
    } catch (error) {
      console.error('Import failed:', error);
      toast({
        variant: 'destructive',
        title: 'Import thất bại',
        description: 'Có lỗi xảy ra trong quá trình import dữ liệu.'
      });
      setStep('preview');
    }
  }, [duplicateCheck, toast, onImportComplete]);

  const downloadCSVTemplate = useCallback(() => {
    const template = generateCSVTemplate();
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'medication_template.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  }, []);

  const downloadExcelTemplate = useCallback(() => {
    try {
      downloadMedicationExcelTemplate({
        includeExamples: true,
        includeInstructions: true
      });
      toast({
        title: 'Tải thành công',
        description: 'File Excel template đã được tải về. Hãy điền dữ liệu và lưu thành CSV để upload.'
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Lỗi tải file',
        description: 'Không thể tạo file Excel template.'
      });
    }
  }, [toast]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetDialog();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Import CSV
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import dữ liệu thuốc từ CSV</DialogTitle>
          <DialogDescription>
            Upload file CSV để import dữ liệu thuốc hàng loạt vào hệ thống
          </DialogDescription>
        </DialogHeader>

        {step === 'select' && (
          <div className="space-y-6">
            {/* Download template */}
            <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg border">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold mb-2">📊 Tải File Mẫu</h3>
                <p className="text-sm text-muted-foreground">
                  Khuyến nghị: Tải file Excel để nhập liệu dễ dàng, sau đó lưu thành CSV để upload
                </p>
              </div>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={downloadExcelTemplate}
                  className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                >
                  <Download className="h-4 w-4 mr-2" />
                  📊 Excel Template
                </Button>
                <Button
                  variant="outline"
                  onClick={downloadCSVTemplate}
                  className="text-muted-foreground"
                >
                  <Download className="h-4 w-4 mr-2" />
                  CSV Template
                </Button>
              </div>
              <div className="mt-3 text-xs text-center text-muted-foreground">
                💡 Excel template có hướng dẫn chi tiết và ví dụ mẫu
              </div>
            </div>

            {/* File upload area */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragOver 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">
                Kéo thả file CSV vào đây hoặc click để chọn
              </h3>
              <p className="text-muted-foreground mb-4">
                Hỗ trợ file .csv với encoding UTF-8
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileInputChange}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload">
                <Button variant="outline" asChild>
                  <span>Chọn file CSV</span>
                </Button>
              </label>
            </div>
          </div>
        )}

        {step === 'preview' && parseResult && duplicateCheck && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{parseResult.totalRows}</div>
                <div className="text-sm text-muted-foreground">Tổng số dòng</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{duplicateCheck.unique.length}</div>
                <div className="text-sm text-muted-foreground">Dữ liệu mới</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-amber-600">{duplicateCheck.duplicates.length}</div>
                <div className="text-sm text-muted-foreground">Trùng lặp</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{parseResult.errors.length}</div>
                <div className="text-sm text-muted-foreground">Lỗi</div>
              </div>
            </div>

            {/* Errors */}
            {parseResult.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-2">Có {parseResult.errors.length} lỗi trong file:</div>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {parseResult.errors.slice(0, 5).map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                    {parseResult.errors.length > 5 && (
                      <li>... và {parseResult.errors.length - 5} lỗi khác</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Duplicates warning */}
            {duplicateCheck.duplicates.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-2">
                    Tìm thấy {duplicateCheck.duplicates.length} thuốc trùng lặp (sẽ bỏ qua):
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {duplicateCheck.duplicates.slice(0, 5).map((dup, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {dup.medication.name} - {dup.medication.batchNo}
                      </Badge>
                    ))}
                    {duplicateCheck.duplicates.length > 5 && (
                      <Badge variant="secondary" className="text-xs">
                        +{duplicateCheck.duplicates.length - 5} khác
                      </Badge>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Actions */}
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('select')}>
                Chọn file khác
              </Button>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  disabled={duplicateCheck.unique.length === 0}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Xem trước dữ liệu
                </Button>
                <Button 
                  onClick={handleImport}
                  disabled={duplicateCheck.unique.length === 0}
                >
                  Import {duplicateCheck.unique.length} thuốc
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 'importing' && (
          <div className="space-y-6 text-center py-8">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <div>
              <h3 className="text-lg font-medium mb-2">Đang import dữ liệu...</h3>
              <p className="text-muted-foreground mb-4">
                Vui lòng đợi trong khi hệ thống xử lý dữ liệu
              </p>
              <Progress value={importProgress} className="w-full max-w-md mx-auto" />
              <p className="text-sm text-muted-foreground mt-2">{importProgress}%</p>
            </div>
          </div>
        )}

        {step === 'complete' && importResult && (
          <div className="space-y-6 text-center py-8">
            {importResult.success ? (
              <CheckCircle className="h-12 w-12 mx-auto text-green-600" />
            ) : (
              <XCircle className="h-12 w-12 mx-auto text-red-600" />
            )}
            
            <div>
              <h3 className="text-lg font-medium mb-2">
                {importResult.success ? 'Import thành công!' : 'Import hoàn tất với lỗi'}
              </h3>
              <p className="text-muted-foreground">
                {importResult.successfulRecords}/{importResult.totalRecords} thuốc đã được import thành công
              </p>
            </div>

            {importResult.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-2">Có {importResult.errors.length} lỗi:</div>
                  <ul className="list-disc list-inside space-y-1 text-sm text-left">
                    {importResult.errors.slice(0, 3).map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                    {importResult.errors.length > 3 && (
                      <li>... và {importResult.errors.length - 3} lỗi khác</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <Button onClick={() => setIsOpen(false)}>
              Đóng
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
