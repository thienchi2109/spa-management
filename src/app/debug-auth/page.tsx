'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getCollectionData } from '@/lib/sheets-utils';
import type { Staff } from '@/lib/types';

export default function DebugAuthPage() {
  const [staffData, setStaffData] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStaffData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Loading staff data...');
      const data = await getCollectionData<Staff>('staff');
      console.log('Staff data loaded:', data);
      setStaffData(data);
    } catch (err) {
      console.error('Error loading staff data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaffData();
  }, []);

  const testLogin = (email: string, password: string) => {
    console.log('Testing login with:', { email, password });
    const user = staffData.find(staff => 
      staff.email === email && staff.password === password
    );
    console.log('Found user:', user);
    return user;
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Debug Authentication</h1>
      
      <div className="grid gap-6">
        {/* Staff Data */}
        <Card>
          <CardHeader>
            <CardTitle>Staff Data from Google Sheets</CardTitle>
            <CardDescription>
              Current staff data loaded from Google Sheets
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && <p>Loading...</p>}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
                <p className="text-red-600">Error: {error}</p>
              </div>
            )}
            
            <Button onClick={loadStaffData} className="mb-4">
              Reload Staff Data
            </Button>
            
            <div className="space-y-2">
              <p><strong>Total staff:</strong> {staffData.length}</p>
              {staffData.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 p-2 text-left">ID</th>
                        <th className="border border-gray-300 p-2 text-left">Name</th>
                        <th className="border border-gray-300 p-2 text-left">Email</th>
                        <th className="border border-gray-300 p-2 text-left">Password</th>
                        <th className="border border-gray-300 p-2 text-left">Role</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffData.map((staff) => (
                        <tr key={staff.id}>
                          <td className="border border-gray-300 p-2">{staff.id}</td>
                          <td className="border border-gray-300 p-2">{staff.name}</td>
                          <td className="border border-gray-300 p-2">{staff.email}</td>
                          <td className="border border-gray-300 p-2">{staff.password}</td>
                          <td className="border border-gray-300 p-2">{staff.role}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Test Login */}
        <Card>
          <CardHeader>
            <CardTitle>Test Login Function</CardTitle>
            <CardDescription>
              Test the login function with sample credentials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { email: 'minh.bs@clinic.com', password: 'minh123' },
                { email: 'hai.bs@clinic.com', password: 'hai123' },
                { email: 'hoai.bs@clinic.com', password: 'hoai123' },
                { email: 'wrong@email.com', password: 'wrong123' }
              ].map((cred, index) => (
                <div key={index} className="flex items-center gap-4 p-3 border rounded">
                  <div className="flex-1">
                    <p><strong>Email:</strong> {cred.email}</p>
                    <p><strong>Password:</strong> {cred.password}</p>
                  </div>
                  <Button
                    onClick={() => {
                      const result = testLogin(cred.email, cred.password);
                      alert(result ? `Login successful: ${result.name}` : 'Login failed');
                    }}
                    variant={cred.email.includes('wrong') ? 'destructive' : 'default'}
                  >
                    Test Login
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Environment Check */}
        <Card>
          <CardHeader>
            <CardTitle>Environment Check</CardTitle>
            <CardDescription>
              Check if Google Sheets environment variables are configured
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>
                <strong>GOOGLE_SHEETS_SPREADSHEET_ID:</strong>{' '}
                {process.env.NEXT_PUBLIC_GOOGLE_SHEETS_SPREADSHEET_ID ? '✅ Set' : '❌ Not set'}
              </p>
              <p>
                <strong>Google Sheets API:</strong>{' '}
                {typeof window !== 'undefined' ? 'Client-side check' : 'Server-side available'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Available Credentials */}
        <Card>
          <CardHeader>
            <CardTitle>Available Login Credentials</CardTitle>
            <CardDescription>
              Use these credentials to test login (from mock data)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {[
                { email: 'minh.bs@clinic.com', password: 'minh123', name: 'Bs. Minh', role: 'Bác sĩ' },
                { email: 'hai.bs@clinic.com', password: 'hai123', name: 'Bs. Hải', role: 'Bác sĩ' },
                { email: 'hoai.bs@clinic.com', password: 'hoai123', name: 'Bs. Hoài', role: 'Bác sĩ' },
                { email: 'hanh.dd@clinic.com', password: 'hanh123', name: 'Đd. Hạnh', role: 'Điều dưỡng' },
                { email: 'hoa.dd@clinic.com', password: 'hoa123', name: 'Đd. Hoa', role: 'Điều dưỡng' }
              ].map((cred, index) => (
                <div key={index} className="p-3 border rounded-lg bg-muted/50">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><strong>Name:</strong> {cred.name}</div>
                    <div><strong>Role:</strong> {cred.role}</div>
                    <div><strong>Email:</strong> {cred.email}</div>
                    <div><strong>Password:</strong> {cred.password}</div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Lưu ý:</strong> Nếu login không hoạt động, có thể dữ liệu chưa được setup trong Google Sheets. 
                Hãy truy cập <a href="/setup" className="underline font-medium">/setup</a> để khởi tạo database trước.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}