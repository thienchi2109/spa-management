// src/app/api/setup-database/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ensureSheetsExist } from '@/lib/google-sheets';

// POST - Setup initial database structure
export async function POST(request: NextRequest) {
  try {
    console.log('Setting up Google Sheets database structure...');
    
    // Ensure all required sheets exist
    await ensureSheetsExist();
    
    console.log('Database setup completed successfully!');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database structure created successfully',
      sheets: [
        'Patients',
        'Appointments', 
        'Medications',
        'Invoices',
        'Staff',
        'MedicalRecords',
        'Prescriptions'
      ]
    });
  } catch (error) {
    console.error('Database setup failed:', error);
    return NextResponse.json(
      { 
        error: 'Failed to setup database', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

// GET - Check database status
export async function GET(request: NextRequest) {
  try {
    // This would check if sheets exist and return status
    // For now, just return a simple status
    return NextResponse.json({ 
      status: 'ready',
      message: 'Database setup API is ready',
      endpoint: '/api/setup-database'
    });
  } catch (error) {
    console.error('Error checking database status:', error);
    return NextResponse.json(
      { error: 'Failed to check database status' },
      { status: 500 }
    );
  }
}