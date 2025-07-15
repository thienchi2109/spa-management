// src/app/api/sheets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { 
  getSheetData, 
  writeSheetData, 
  appendSheetData, 
  updateSheetRow, 
  deleteSheetRow,
  ensureSheetsExist,
  SHEET_CONFIG 
} from '@/lib/google-sheets';

// Define headers for each data type
const HEADERS_MAP: Record<string, string[]> = {
  patients: ['id', 'name', 'birthYear', 'gender', 'address', 'phone', 'citizenId', 'weight', 'lastVisit', 'avatarUrl', 'medicalHistory', 'documents'],
  appointments: ['id', 'patientName', 'doctorName', 'date', 'startTime', 'endTime', 'status', 'notes'],
  medications: ['id', 'name', 'activeIngredient', 'concentration', 'dosageForm', 'unit', 'manufacturer', 'manufacturerCountry', 'registrationNumber', 'supplier', 'importPrice', 'sellPrice', 'storageLocation', 'minStockThreshold', 'batchNo', 'expiryDate', 'stock', 'status'],
  invoices: ['id', 'patientName', 'date', 'items', 'amount', 'status'],
  staff: ['id', 'name', 'role', 'avatarUrl', 'phone', 'email', 'password', 'licenseNumber', 'licenseIssueDate', 'licenseIssuePlace', 'licenseExpiryDate'],
  medicalRecords: ['id', 'patientId', 'patientName', 'appointmentId', 'date', 'doctorName', 'symptoms', 'diagnosis', 'treatment', 'prescription', 'nextAppointment', 'notes'],
  prescriptions: ['id', 'patientId', 'patientName', 'patientAge', 'patientGender', 'patientWeight', 'patientAddress', 'doctorId', 'doctorName', 'doctorLicense', 'medicalRecordId', 'appointmentId', 'date', 'diagnosis', 'symptoms', 'items', 'totalCost', 'doctorNotes', 'nextAppointment', 'status', 'validUntil', 'clinicInfo', 'createdAt', 'updatedAt']
};

function getSheetName(collectionName: string): string {
  const sheetMap: Record<string, string> = {
    'patients': SHEET_CONFIG.SHEETS.patients,
    'appointments': SHEET_CONFIG.SHEETS.appointments,
    'medications': SHEET_CONFIG.SHEETS.medications,
    'invoices': SHEET_CONFIG.SHEETS.invoices,
    'staff': SHEET_CONFIG.SHEETS.staff,
    'medicalRecords': SHEET_CONFIG.SHEETS.medicalRecords,
    'prescriptions': SHEET_CONFIG.SHEETS.prescriptions,
  };
  
  return sheetMap[collectionName] || collectionName;
}

// GET - Fetch data from a sheet
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const collection = searchParams.get('collection');
    
    if (!collection) {
      return NextResponse.json({ error: 'Collection parameter is required' }, { status: 400 });
    }

    const sheetName = getSheetName(collection);
    const headers = HEADERS_MAP[collection];
    
    if (!headers) {
      return NextResponse.json({ error: 'Invalid collection name' }, { status: 400 });
    }

    await ensureSheetsExist();
    const data = await getSheetData(sheetName, headers);
    
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// POST - Add new data to a sheet
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { collection, data, operation = 'append' } = body;
    
    if (!collection || !data) {
      return NextResponse.json({ error: 'Collection and data are required' }, { status: 400 });
    }

    const sheetName = getSheetName(collection);
    const headers = HEADERS_MAP[collection];
    
    if (!headers) {
      return NextResponse.json({ error: 'Invalid collection name' }, { status: 400 });
    }

    await ensureSheetsExist();

    if (operation === 'write') {
      // Overwrite entire sheet
      await writeSheetData(sheetName, Array.isArray(data) ? data : [data], headers);
    } else {
      // Append to sheet
      await appendSheetData(sheetName, Array.isArray(data) ? data : [data], headers);
    }
    
    return NextResponse.json({ success: true, message: 'Data added successfully' });
  } catch (error) {
    console.error('Error adding sheet data:', error);
    return NextResponse.json(
      { error: 'Failed to add data', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// PUT - Update existing data in a sheet
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { collection, data, id } = body;
    
    if (!collection || !data || !id) {
      return NextResponse.json({ error: 'Collection, data, and id are required' }, { status: 400 });
    }

    const sheetName = getSheetName(collection);
    const headers = HEADERS_MAP[collection];
    
    if (!headers) {
      return NextResponse.json({ error: 'Invalid collection name' }, { status: 400 });
    }

    // First, get all data to find the row index
    const existingData = await getSheetData(sheetName, headers);
    const rowIndex = existingData.findIndex((item: any) => item.id === id);
    
    if (rowIndex === -1) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    await updateSheetRow(sheetName, rowIndex + 1, data, headers); // +1 for header row
    
    return NextResponse.json({ success: true, message: 'Data updated successfully' });
  } catch (error) {
    console.error('Error updating sheet data:', error);
    return NextResponse.json(
      { error: 'Failed to update data', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// DELETE - Remove data from a sheet
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const collection = searchParams.get('collection');
    const id = searchParams.get('id');
    
    if (!collection || !id) {
      return NextResponse.json({ error: 'Collection and id parameters are required' }, { status: 400 });
    }

    const sheetName = getSheetName(collection);
    const headers = HEADERS_MAP[collection];
    
    if (!headers) {
      return NextResponse.json({ error: 'Invalid collection name' }, { status: 400 });
    }

    // First, get all data to find the row index
    const existingData = await getSheetData(sheetName, headers);
    const rowIndex = existingData.findIndex((item: any) => item.id === id);
    
    if (rowIndex === -1) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    await deleteSheetRow(sheetName, rowIndex + 1); // +1 for header row
    
    return NextResponse.json({ success: true, message: 'Data deleted successfully' });
  } catch (error) {
    console.error('Error deleting sheet data:', error);
    return NextResponse.json(
      { error: 'Failed to delete data', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}