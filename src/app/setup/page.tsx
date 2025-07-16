'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  FileSpreadsheet,
  Settings,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SetupPage() {
  const [setupStatus, setSetupStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');
  const [setupResult, setSetupResult] = useState<any>(null);
  const { toast } = useToast();

  const handleSetupDatabase = async () => {
    setSetupStatus('running');

    try {
      const response = await fetch('/api/setup-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Setup request failed');
      }

      const result = await response.json();
      setSetupResult(result);
      setSetupStatus('completed');
      
      toast({
        title: 'Setup thành công!',
        description: 'Cấu trúc database đã được tạo trong Google Sheets.',
      });
    } catch (error) {
      console.error('Setup failed:', error);
      setSetupStatus('error');
      toast({
        variant: 'destructive',
        title: 'Setup thất bại',
        description: 'Đã có lỗi xảy ra trong quá trình setup database.',
      });
    }
  };

  const checkEnvironmentVariables = () => {
    const requiredVars = [
      'GOOGLE_SHEETS_SPREADSHEET_ID',
      'GOOGLE_SERVICE_ACCOUNT_CREDENTIALS'
    ];

    const missingVars = requiredVars.filter(varName => {
      // Check if environment variable exists (this is a simplified check)
      return !process.env[`NEXT_PUBLIC_${varName}`];
    });

    return {
      isComplete: missingVars.length === 0,
      missingVars
    };
  };

  const envCheck = checkEnvironmentVariables();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-headline font-bold">Database Setup</h1>
        <Badge variant="outline" className="text-sm">
          Google Sheets Integration
        </Badge>
      </div>

      {/* Environment Check */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Environment Configuration
          </CardTitle>
          <CardDescription>
            Kiểm tra cấu hình environment variables
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded">
              <div>
                <p className="font-medium">GOOGLE_SHEETS_SPREADSHEET_ID</p>
                <p className="text-sm text-muted-foreground">ID của Google Spreadsheet</p>
              </div>
              {process.env.NEXT_PUBLIC_GOOGLE_SHEETS_SPREADSHEET_ID ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded">
              <div>
                <p className="font-medium">GOOGLE_SERVICE_ACCOUNT_CREDENTIALS</p>
                <p className="text-sm text-muted-foreground">Service Account JSON credentials</p>
              </div>
              {process.env.NEXT_PUBLIC_GOOGLE_SERVICE_ACCOUNT_CREDENTIALS ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
            </div>

            {!envCheck.isComplete && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Cấu hình chưa hoàn tất</AlertTitle>
                <AlertDescription>
                  Vui lòng cấu hình các environment variables trong file .env.local trước khi tiếp tục.
                  Xem hướng dẫn chi tiết trong file GOOGLE_SHEETS_QUICK_START.md
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Setup Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Database Setup
          </CardTitle>
          <CardDescription>
            Tạo cấu trúc database trong Google Sheets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold">Các sheet sẽ được tạo:</h4>
            <div className="grid gap-2 md:grid-cols-2">
              {[
                { name: 'Patients', desc: 'Thông tin khách hàng' },
                { name: 'Appointments', desc: 'Lịch hẹn dịch vụ' },
                { name: 'Medications', desc: 'Dịch vụ spa' },
                { name: 'Invoices', desc: 'Hóa đơn' },
                { name: 'Staff', desc: 'Nhân viên' },
                { name: 'MedicalRecords', desc: 'Hồ sơ y tế' },

              ].map((sheet) => (
                <div key={sheet.name} className="flex items-center gap-2 p-2 border rounded text-sm">
                  <FileSpreadsheet className="h-4 w-4 text-primary" />
                  <div>
                    <span className="font-medium">{sheet.name}</span>
                    <p className="text-muted-foreground text-xs">{sheet.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button 
            onClick={handleSetupDatabase}
            disabled={setupStatus === 'running' || !envCheck.isComplete}
            className="w-full"
            size="lg"
          >
            {setupStatus === 'running' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang setup database...
              </>
            ) : (
              <>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Setup Database Structure
              </>
            )}
          </Button>

          {setupResult && setupStatus === 'completed' && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Setup thành công!</AlertTitle>
              <AlertDescription>
                Đã tạo {setupResult.sheets?.length || 0} sheets trong Google Spreadsheet.
                Bạn có thể bắt đầu sử dụng ứng dụng hoặc chạy migration từ Firestore.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Các bước tiếp theo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                1
              </div>
              <div>
                <p className="font-medium">Kiểm tra Google Spreadsheet</p>
                <p className="text-sm text-muted-foreground">
                  Mở Google Spreadsheet để xác nhận các sheet đã được tạo
                </p>
                <Button variant="outline" size="sm" className="mt-2">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Mở Google Sheets
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                2
              </div>
              <div>
                <p className="font-medium">Migration từ Firestore (nếu có)</p>
                <p className="text-sm text-muted-foreground">
                  Nếu bạn có dữ liệu trong Firestore, hãy chạy migration
                </p>
                <Button variant="outline" size="sm" className="mt-2" asChild>
                  <a href="/migration">
                    Chạy Migration
                  </a>
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                3
              </div>
              <div>
                <p className="font-medium">Bắt đầu sử dụng ứng dụng</p>
                <p className="text-sm text-muted-foreground">
                  Tất cả tính năng đã sẵn sàng để sử dụng
                </p>
                <div className="flex gap-2 mt-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href="/patients">Quản lý khách hàng</a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href="/appointments">Lịch hẹn</a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href="/inventory">Dịch vụ</a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Help */}
      <Card>
        <CardHeader>
          <CardTitle>Cần hỗ trợ?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Nếu gặp vấn đề trong quá trình setup, hãy tham khảo:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>GOOGLE_SHEETS_QUICK_START.md - Hướng dẫn nhanh</li>
              <li>MIGRATION_GUIDE.md - Hướng dẫn chi tiết</li>
              <li>Browser console để xem error logs</li>
              <li>Google Cloud Console để kiểm tra API settings</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}