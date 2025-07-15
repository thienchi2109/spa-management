'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Database, 
  FileSpreadsheet,
  ArrowRight,
  Download,
  Upload,
  Loader2
} from 'lucide-react';
// Types for migration results
interface MigrationResult {
  success: boolean;
  collectionName: string;
  recordCount: number;
  error?: string;
}

interface MigrationSummary {
  totalCollections: number;
  successfulMigrations: number;
  failedMigrations: number;
  totalRecords: number;
  results: MigrationResult[];
  errors: string[];
}
import { useToast } from '@/hooks/use-toast';

export default function MigrationPage() {
  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');
  const [migrationSummary, setMigrationSummary] = useState<MigrationSummary | null>(null);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const handleFullMigration = async () => {
    setMigrationStatus('running');
    setProgress(0);
    setCurrentStep('Khởi tạo migration...');

    try {
      // Step 1: Backup data
      setCurrentStep('Đang sao lưu dữ liệu Firestore...');
      setProgress(10);
      
      const backupResponse = await fetch('/api/migration?action=backup');
      if (!backupResponse.ok) {
        throw new Error('Failed to backup data');
      }

      // Step 2: Run migration
      setCurrentStep('Đang chuyển đổi dữ liệu sang Google Sheets...');
      setProgress(30);
      
      const migrationResponse = await fetch('/api/migration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'all' }),
      });

      if (!migrationResponse.ok) {
        throw new Error('Migration request failed');
      }

      const { summary } = await migrationResponse.json();
      
      setProgress(100);
      setMigrationSummary(summary);
      
      if (summary.failedMigrations === 0) {
        setMigrationStatus('completed');
        toast({
          title: 'Migration thành công!',
          description: `Đã chuyển đổi ${summary.totalRecords} bản ghi từ ${summary.successfulMigrations} collection.`,
        });
      } else {
        setMigrationStatus('error');
        toast({
          variant: 'destructive',
          title: 'Migration hoàn thành với lỗi',
          description: `${summary.failedMigrations} collection gặp lỗi trong quá trình chuyển đổi.`,
        });
      }
    } catch (error) {
      console.error('Migration failed:', error);
      setMigrationStatus('error');
      toast({
        variant: 'destructive',
        title: 'Migration thất bại',
        description: 'Đã có lỗi xảy ra trong quá trình chuyển đổi dữ liệu.',
      });
    }
  };

  const handleSingleMigration = async (collectionName: string) => {
    setMigrationStatus('running');
    setCurrentStep(`Đang chuyển đổi collection ${collectionName}...`);

    try {
      const migrationResponse = await fetch('/api/migration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          type: 'single', 
          collection: collectionName 
        }),
      });

      if (!migrationResponse.ok) {
        throw new Error('Migration request failed');
      }

      const { result } = await migrationResponse.json();
      
      if (result.success) {
        toast({
          title: 'Migration thành công!',
          description: `Đã chuyển đổi ${result.recordCount} bản ghi từ collection ${collectionName}.`,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Migration thất bại',
          description: result.error || 'Đã có lỗi xảy ra.',
        });
      }
    } catch (error) {
      console.error('Single migration failed:', error);
      toast({
        variant: 'destructive',
        title: 'Migration thất bại',
        description: 'Đã có lỗi xảy ra trong quá trình chuyển đổi.',
      });
    } finally {
      setMigrationStatus('idle');
    }
  };

  const collections = [
    { name: 'patients', displayName: 'Bệnh nhân', icon: '👥' },
    { name: 'appointments', displayName: 'Lịch hẹn', icon: '📅' },
    { name: 'medications', displayName: 'Thuốc', icon: '💊' },
    { name: 'invoices', displayName: 'Hóa đơn', icon: '🧾' },
    { name: 'staff', displayName: 'Nhân viên', icon: '👨‍⚕️' },
    { name: 'medicalRecords', displayName: 'Hồ sơ y tế', icon: '📋' },
    { name: 'prescriptions', displayName: 'Đơn thuốc', icon: '📝' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-headline font-bold">Migration Database</h1>
        <Badge variant="outline" className="text-sm">
          Firestore → Google Sheets
        </Badge>
      </div>

      {/* Warning Alert */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Cảnh báo quan trọng</AlertTitle>
        <AlertDescription>
          Quá trình migration sẽ chuyển đổi toàn bộ dữ liệu từ Firestore sang Google Sheets. 
          Hãy đảm bảo bạn đã cấu hình đúng Google Sheets API và có quyền truy cập vào spreadsheet.
          Dữ liệu sẽ được sao lưu trước khi migration.
        </AlertDescription>
      </Alert>

      {/* Migration Overview */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Firestore (Nguồn)
            </CardTitle>
            <CardDescription>
              Database hiện tại đang sử dụng
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                • Dữ liệu bệnh nhân, lịch hẹn, thuốc
              </p>
              <p className="text-sm text-muted-foreground">
                • Hóa đơn, nhân viên, hồ sơ y tế
              </p>
              <p className="text-sm text-muted-foreground">
                • Đơn thuốc và các dữ liệu khác
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Google Sheets (Đích)
            </CardTitle>
            <CardDescription>
              Database mới sẽ chuyển sang
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                • Dễ dàng truy cập và chỉnh sửa
              </p>
              <p className="text-sm text-muted-foreground">
                • Chia sẻ và cộng tác trực tuyến
              </p>
              <p className="text-sm text-muted-foreground">
                • Tích hợp với Google Workspace
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Migration Progress */}
      {migrationStatus === 'running' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Đang thực hiện Migration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{currentStep}</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Migration Results */}
      {migrationSummary && migrationStatus !== 'running' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {migrationStatus === 'completed' ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              Kết quả Migration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {migrationSummary.successfulMigrations}
                </div>
                <div className="text-sm text-muted-foreground">Collections thành công</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {migrationSummary.failedMigrations}
                </div>
                <div className="text-sm text-muted-foreground">Collections thất bại</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {migrationSummary.totalRecords}
                </div>
                <div className="text-sm text-muted-foreground">Tổng bản ghi</div>
              </div>
            </div>

            {/* Detailed Results */}
            <div className="space-y-2">
              <h4 className="font-semibold">Chi tiết từng Collection:</h4>
              {migrationSummary.results.map((result) => (
                <div key={result.collectionName} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="font-medium">{result.collectionName}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {result.success ? `${result.recordCount} bản ghi` : result.error}
                  </div>
                </div>
              ))}
            </div>

            {migrationSummary.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-red-600">Lỗi gặp phải:</h4>
                {migrationSummary.errors.map((error, index) => (
                  <p key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    {error}
                  </p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Migration Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Migration toàn bộ</CardTitle>
            <CardDescription>
              Chuyển đổi tất cả dữ liệu từ Firestore sang Google Sheets
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleFullMigration}
              disabled={migrationStatus === 'running'}
              className="w-full"
              size="lg"
            >
              {migrationStatus === 'running' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang migration...
                </>
              ) : (
                <>
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Bắt đầu Migration toàn bộ
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Migration từng phần</CardTitle>
            <CardDescription>
              Chuyển đổi từng collection riêng biệt
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {collections.map((collection) => (
                <Button
                  key={collection.name}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSingleMigration(collection.name)}
                  disabled={migrationStatus === 'running'}
                  className="justify-start"
                >
                  <span className="mr-2">{collection.icon}</span>
                  {collection.displayName}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Hướng dẫn chuẩn bị</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold">1. Cấu hình Google Sheets API:</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>Tạo project trên Google Cloud Console</li>
              <li>Bật Google Sheets API</li>
              <li>Tạo Service Account và tải xuống key file</li>
              <li>Cấu hình biến môi trường GOOGLE_SERVICE_ACCOUNT_CREDENTIALS</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold">2. Tạo Google Spreadsheet:</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>Tạo spreadsheet mới trên Google Sheets</li>
              <li>Chia sẻ với Service Account email</li>
              <li>Cấu hình biến môi trường GOOGLE_SHEETS_SPREADSHEET_ID</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">3. Biến môi trường cần thiết:</h4>
            <div className="bg-muted p-3 rounded text-sm font-mono">
              <div>GOOGLE_SERVICE_ACCOUNT_CREDENTIALS={"{"}"type": "service_account", ...{"}"}</div>
              <div>GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}