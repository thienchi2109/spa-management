import { NextRequest, NextResponse } from 'next/server';
import { 
  getSheetData, 
  writeSheetData, 
  appendSheetData, 
  updateSheetRow, 
  deleteSheetRow,
  SHEET_CONFIG,
  ensureSheetsExist
} from '@/lib/google-sheets';
import type { 
  Patient, 
  Customer,
  Appointment, 
  Medication, 
  Invoice, 
  Staff, 
  MedicalRecord,
  SpaService
} from '@/lib/types';

// Define headers for each collection
const COLLECTION_HEADERS = {
  patients: ['id', 'name', 'birthYear', 'gender', 'address', 'phone', 'citizenId', 'weight', 'lastVisit', 'avatarUrl', 'medicalHistory', 'documents'] as (keyof Patient)[],
  customers: ['id', 'name', 'birthYear', 'gender', 'address', 'phone', 'lastVisit', 'avatarUrl', 'tongChiTieu'] as (keyof Customer)[],
  appointments: ['id', 'patientName', 'doctorName', 'schedulerName', 'date', 'startTime', 'endTime', 'status', 'services', 'notes'] as (keyof Appointment)[],
  medications: ['id', 'name', 'activeIngredient', 'concentration', 'dosageForm', 'unit', 'manufacturer', 'manufacturerCountry', 'registrationNumber', 'supplier', 'importPrice', 'sellPrice', 'storageLocation', 'minStockThreshold', 'batchNo', 'expiryDate', 'stock', 'status'] as (keyof Medication)[],
  invoices: ['id', 'patientName', 'date', 'items', 'amount', 'status'] as (keyof Invoice)[],
  staff: ['id', 'name', 'role', 'avatarUrl', 'phone', 'email', 'password', 'licenseNumber', 'licenseIssueDate', 'licenseIssuePlace', 'licenseExpiryDate'] as (keyof Staff)[],
  medicalRecords: ['id', 'patientId', 'patientName', 'appointmentId', 'date', 'doctorName', 'symptoms', 'diagnosis', 'treatment', 'products', 'nextAppointment', 'notes'] as (keyof MedicalRecord)[],
  services: ['id', 'name', 'category', 'description', 'duration', 'price', 'discountPrice', 'requiredStaff', 'equipment', 'roomType', 'preparationTime', 'cleanupTime', 'maxCapacity', 'ageRestriction', 'contraindications', 'benefits', 'aftercareInstructions', 'isActive'] as (keyof SpaService)[]
};

function getSheetName(collection: string): string {
  const sheetMap: Record<string, string> = {
    'patients': SHEET_CONFIG.SHEETS.patients,
    'customers': SHEET_CONFIG.SHEETS.customers,
    'appointments': SHEET_CONFIG.SHEETS.appointments,
    'medications': SHEET_CONFIG.SHEETS.medications,
    'invoices': SHEET_CONFIG.SHEETS.invoices,
    'staff': SHEET_CONFIG.SHEETS.staff,
    'medicalRecords': SHEET_CONFIG.SHEETS.medicalRecords,

    'services': SHEET_CONFIG.SHEETS.services,
  };
  
  return sheetMap[collection] || collection;
}

function getHeaders(collection: string): any[] {
  return (COLLECTION_HEADERS as any)[collection] || [];
}

// Helper function to find row index by ID
async function findRowIndexById<T extends { id: string }>(
  sheetName: string,
  id: string,
  headers: (keyof T)[]
): Promise<number> {
  const data = await getSheetData<T>(sheetName, headers);
  const index = data.findIndex(item => item.id === id);
  return index >= 0 ? index + 1 : -1; // +1 because sheets are 1-indexed (plus header row)
}

// GET - Retrieve data from a collection
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const collection = searchParams.get('collection');

    if (!collection) {
      return NextResponse.json({ error: 'Collection parameter is required' }, { status: 400 });
    }

    // Ensure sheets exist
    await ensureSheetsExist();

    const sheetName = getSheetName(collection);
    const headers = getHeaders(collection);
    
    const data = await getSheetData(sheetName, headers);
    
    console.log(`📊 GET /api/sheets - Collection: ${collection}, Records: ${data.length}`);
    if (collection === 'appointments' && data.length > 0) {
      console.log('🔍 Sample appointment data:', data[0]);
    }
    
    return NextResponse.json({ data });
  } catch (error) {
    console.error('GET /api/sheets error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST - Add or write data to a collection
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { collection, data, operation } = body;

    if (!collection || !data) {
      return NextResponse.json({ error: 'Collection and data are required' }, { status: 400 });
    }

    // Ensure sheets exist
    await ensureSheetsExist();

    const sheetName = getSheetName(collection);
    const headers = getHeaders(collection);

    if (operation === 'write') {
      // Write/overwrite entire sheet
      await writeSheetData(sheetName, Array.isArray(data) ? data : [data], headers);
    } else {
      // Append data (default)
      await appendSheetData(sheetName, Array.isArray(data) ? data : [data], headers);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/sheets error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT - Update a specific record
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { collection, data, id } = body;

    if (!collection || !data || !id) {
      return NextResponse.json({ error: 'Collection, data, and id are required' }, { status: 400 });
    }

    // Ensure sheets exist
    await ensureSheetsExist();

    const sheetName = getSheetName(collection);
    const headers = getHeaders(collection);
    
    const rowIndex = await findRowIndexById(sheetName, id, headers);
    
    if (rowIndex === -1) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }
    
    await updateSheetRow(sheetName, rowIndex, data, headers);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT /api/sheets error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a specific record
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const collection = searchParams.get('collection');
    const id = searchParams.get('id');

    if (!collection || !id) {
      return NextResponse.json({ error: 'Collection and id parameters are required' }, { status: 400 });
    }

    // Ensure sheets exist
    await ensureSheetsExist();

    const sheetName = getSheetName(collection);
    const headers = getHeaders(collection);
    
    const rowIndex = await findRowIndexById(sheetName, id, headers);
    
    if (rowIndex === -1) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }
    
    await deleteSheetRow(sheetName, rowIndex);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/sheets error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}