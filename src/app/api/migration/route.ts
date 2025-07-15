// src/app/api/migration/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { writeSheetData, ensureSheetsExist, SHEET_CONFIG } from '@/lib/google-sheets';

// Define headers for each collection
const COLLECTION_HEADERS = {
  patients: ['id', 'name', 'birthYear', 'gender', 'address', 'phone', 'citizenId', 'weight', 'lastVisit', 'avatarUrl', 'medicalHistory', 'documents'],
  appointments: ['id', 'patientName', 'doctorName', 'date', 'startTime', 'endTime', 'status', 'notes'],
  medications: ['id', 'name', 'activeIngredient', 'concentration', 'dosageForm', 'unit', 'manufacturer', 'manufacturerCountry', 'registrationNumber', 'supplier', 'importPrice', 'sellPrice', 'storageLocation', 'minStockThreshold', 'batchNo', 'expiryDate', 'stock', 'status'],
  invoices: ['id', 'patientName', 'date', 'items', 'amount', 'status'],
  staff: ['id', 'name', 'role', 'avatarUrl', 'phone', 'email', 'password', 'licenseNumber', 'licenseIssueDate', 'licenseIssuePlace', 'licenseExpiryDate'],
  medicalRecords: ['id', 'patientId', 'patientName', 'appointmentId', 'date', 'doctorName', 'symptoms', 'diagnosis', 'treatment', 'prescription', 'nextAppointment', 'notes'],
  prescriptions: ['id', 'patientId', 'patientName', 'patientAge', 'patientGender', 'patientWeight', 'patientAddress', 'doctorId', 'doctorName', 'doctorLicense', 'medicalRecordId', 'appointmentId', 'date', 'diagnosis', 'symptoms', 'items', 'totalCost', 'doctorNotes', 'nextAppointment', 'status', 'validUntil', 'clinicInfo', 'createdAt', 'updatedAt']
};

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

// Function to migrate a single collection from Firestore to Google Sheets
async function migrateCollection<T extends { id: string }>(
  collectionName: string,
  sheetName: string,
  headers: string[]
): Promise<MigrationResult> {
  try {
    console.log(`Starting migration for collection: ${collectionName}`);
    
    // Get data from Firestore
    const collectionRef = collection(db, collectionName);
    const snapshot = await getDocs(collectionRef);
    
    if (snapshot.empty) {
      console.log(`Collection ${collectionName} is empty, skipping...`);
      return {
        success: true,
        collectionName,
        recordCount: 0
      };
    }
    
    // Convert Firestore documents to plain objects
    const documents = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as T[];
    
    console.log(`Found ${documents.length} documents in ${collectionName}`);
    
    // Write to Google Sheets
    await writeSheetData(sheetName, documents, headers);
    
    console.log(`Successfully migrated ${documents.length} records from ${collectionName} to ${sheetName}`);
    
    return {
      success: true,
      collectionName,
      recordCount: documents.length
    };
    
  } catch (error) {
    console.error(`Error migrating collection ${collectionName}:`, error);
    return {
      success: false,
      collectionName,
      recordCount: 0,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// POST - Run migration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type = 'all', collection } = body;
    
    console.log('Starting migration from Firestore to Google Sheets...');
    
    // Ensure all required sheets exist
    await ensureSheetsExist();
    console.log('Google Sheets setup completed');
    
    if (type === 'single' && collection) {
      // Migrate single collection
      const sheetName = SHEET_CONFIG.SHEETS[collection as keyof typeof SHEET_CONFIG.SHEETS];
      const headers = COLLECTION_HEADERS[collection as keyof typeof COLLECTION_HEADERS];
      
      if (!sheetName || !headers) {
        return NextResponse.json({ error: 'Invalid collection name' }, { status: 400 });
      }
      
      const result = await migrateCollection(collection, sheetName, headers);
      return NextResponse.json({ result });
    } else {
      // Migrate all collections
      const collections = [
        { firestore: 'patients', sheet: SHEET_CONFIG.SHEETS.patients, headers: COLLECTION_HEADERS.patients },
        { firestore: 'appointments', sheet: SHEET_CONFIG.SHEETS.appointments, headers: COLLECTION_HEADERS.appointments },
        { firestore: 'medications', sheet: SHEET_CONFIG.SHEETS.medications, headers: COLLECTION_HEADERS.medications },
        { firestore: 'invoices', sheet: SHEET_CONFIG.SHEETS.invoices, headers: COLLECTION_HEADERS.invoices },
        { firestore: 'staff', sheet: SHEET_CONFIG.SHEETS.staff, headers: COLLECTION_HEADERS.staff },
        { firestore: 'medicalRecords', sheet: SHEET_CONFIG.SHEETS.medicalRecords, headers: COLLECTION_HEADERS.medicalRecords },
        { firestore: 'prescriptions', sheet: SHEET_CONFIG.SHEETS.prescriptions, headers: COLLECTION_HEADERS.prescriptions }
      ];
      
      const summary: MigrationSummary = {
        totalCollections: collections.length,
        successfulMigrations: 0,
        failedMigrations: 0,
        totalRecords: 0,
        results: [],
        errors: []
      };
      
      // Migrate each collection
      for (const { firestore, sheet, headers } of collections) {
        const result = await migrateCollection(firestore, sheet, headers);
        summary.results.push(result);
        
        if (result.success) {
          summary.successfulMigrations++;
          summary.totalRecords += result.recordCount;
        } else {
          summary.failedMigrations++;
          if (result.error) {
            summary.errors.push(`${firestore}: ${result.error}`);
          }
        }
        
        // Add a small delay between migrations to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      console.log('Migration completed!');
      console.log(`Successfully migrated ${summary.successfulMigrations}/${summary.totalCollections} collections`);
      console.log(`Total records migrated: ${summary.totalRecords}`);
      
      return NextResponse.json({ summary });
    }
  } catch (error) {
    console.error('Migration failed:', error);
    return NextResponse.json(
      { error: 'Migration failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// GET - Get migration status or backup data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    if (action === 'backup') {
      // Create backup of Firestore data
      console.log('Creating backup of Firestore data...');
      
      const collections = Object.keys(COLLECTION_HEADERS);
      const backup: Record<string, any[]> = {};
      
      for (const collectionName of collections) {
        const collectionRef = collection(db, collectionName);
        const snapshot = await getDocs(collectionRef);
        
        backup[collectionName] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }
      
      return NextResponse.json({ backup });
    }
    
    return NextResponse.json({ message: 'Migration API ready' });
  } catch (error) {
    console.error('Error in migration API:', error);
    return NextResponse.json(
      { error: 'Failed to process request', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}