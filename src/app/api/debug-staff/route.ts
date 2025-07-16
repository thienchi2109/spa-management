import { NextRequest, NextResponse } from 'next/server';
import { getCollectionData } from '@/lib/sheets-utils';
import type { Staff } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    console.log('Debug: Loading staff data from Google Sheets...');
    
    // Check environment variables
    const hasSpreadsheetId = !!process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    const hasCredentials = !!process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS;
    
    console.log('Environment check:', {
      hasSpreadsheetId,
      hasCredentials,
      spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID?.substring(0, 10) + '...'
    });

    if (!hasSpreadsheetId || !hasCredentials) {
      return NextResponse.json({
        success: false,
        error: 'Missing environment variables',
        details: {
          hasSpreadsheetId,
          hasCredentials
        },
        staffData: []
      });
    }

    // Try to load staff data from Google Sheets
    const staffData = await getCollectionData<Staff>('staff');
    console.log('Loaded staff data:', staffData.length, 'records');
    
    // Test login function
    const testLogin = (email: string, password: string) => {
      return staffData.find(staff => 
        staff.email === email && staff.password === password
      );
    };

    // Test with actual data from Google Sheets
    const testResults = staffData.length > 0 ? [
      { email: staffData[0]?.email, password: staffData[0]?.password, result: !!testLogin(staffData[0]?.email, staffData[0]?.password) },
      { email: 'wrong@email.com', password: 'wrong', result: !!testLogin('wrong@email.com', 'wrong') }
    ] : [];

    return NextResponse.json({
      success: true,
      environment: {
        hasSpreadsheetId,
        hasCredentials
      },
      staffData,
      testResults,
      summary: {
        totalStaff: staffData.length,
        firstStaffEmail: staffData[0]?.email,
        firstStaffName: staffData[0]?.name,
        firstStaffRole: staffData[0]?.role
      }
    });

  } catch (error) {
    console.error('Debug staff error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      staffData: []
    }, { status: 500 });
  }
}