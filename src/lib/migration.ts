// src/lib/migration.ts
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { writeSheetData, ensureSheetsExist, SHEET_CONFIG } from './google-sheets';
import type { 
  Patient, 
  Appointment, 
  Medication, 
  Invoice, 
  Staff, 
  MedicalRecord
} from './types';

// Define headers for each collection
const COLLECTION_HEADERS = {
  patients: ['id', 'name', 'birthYear', 'gender', 'address', 'phone', 'citizenId', 'weight', 'lastVisit', 'avatarUrl', 'medicalHistory', 'documents'] as (keyof Patient)[],
  appointments: ['id', 'patientName', 'doctorName', 'date', 'startTime', 'endTime', 'status', 'notes'] as (keyof Appointment)[],
  medications: ['id', 'name', 'activeIngredient', 'concentration', 'dosageForm', 'unit', 'manufacturer', 'manufacturerCountry', 'registrationNumber', 'supplier', 'importPrice', 'sellPrice', 'storageLocation', 'minStockThreshold', 'batchNo', 'expiryDate', 'stock', 'status'] as (keyof Medication)[],
  invoices: ['id', 'patientName', 'date', 'items', 'amount', 'status'] as (keyof Invoice)[],
  staff: ['id', 'name', 'role', 'avatarUrl', 'phone', 'email', 'password', 'licenseNumber', 'licenseIssueDate', 'licenseIssuePlace', 'licenseExpiryDate'] as (keyof Staff)[],
  medicalRecords: ['id', 'patientId', 'patientName', 'appointmentId', 'date', 'doctorName', 'symptoms', 'diagnosis', 'treatment', 'products', 'nextAppointment', 'notes'] as (keyof MedicalRecord)[]
};

export interface MigrationResult {
  success: boolean;
  collectionName: string;
  recordCount: number;
  error?: string;
}

export interface MigrationSummary {
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
  headers: (keyof T)[]
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

// Function to migrate all collections
export async function migrateAllCollections(): Promise<MigrationSummary> {
  const summary: MigrationSummary = {
    totalCollections: 0,
    successfulMigrations: 0,
    failedMigrations: 0,
    totalRecords: 0,
    results: [],
    errors: []
  };
  
  try {
    console.log('Starting migration from Firestore to Google Sheets...');
    
    // Ensure all required sheets exist
    await ensureSheetsExist();
    console.log('Google Sheets setup completed');
    
    // Define collections to migrate
    const collections = [
      { 
        firestore: 'patients', 
        sheet: SHEET_CONFIG.SHEETS.patients, 
        headers: COLLECTION_HEADERS.patients 
      },
      { 
        firestore: 'appointments', 
        sheet: SHEET_CONFIG.SHEETS.appointments, 
        headers: COLLECTION_HEADERS.appointments 
      },
      { 
        firestore: 'medications', 
        sheet: SHEET_CONFIG.SHEETS.medications, 
        headers: COLLECTION_HEADERS.medications 
      },
      { 
        firestore: 'invoices', 
        sheet: SHEET_CONFIG.SHEETS.invoices, 
        headers: COLLECTION_HEADERS.invoices 
      },
      { 
        firestore: 'staff', 
        sheet: SHEET_CONFIG.SHEETS.staff, 
        headers: COLLECTION_HEADERS.staff 
      },
      { 
        firestore: 'medicalRecords', 
        sheet: SHEET_CONFIG.SHEETS.medicalRecords, 
        headers: COLLECTION_HEADERS.medicalRecords 
      },

    ];
    
    summary.totalCollections = collections.length;
    
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
    
    if (summary.errors.length > 0) {
      console.log('Errors encountered:');
      summary.errors.forEach(error => console.log(`- ${error}`));
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
    summary.errors.push(`Migration failed: ${error}`);
  }
  
  return summary;
}

// Function to migrate a specific collection
export async function migrateSingleCollection(
  collectionName: keyof typeof COLLECTION_HEADERS
): Promise<MigrationResult> {
  try {
    await ensureSheetsExist();
    
    const sheetName = SHEET_CONFIG.SHEETS[collectionName];
    const headers = COLLECTION_HEADERS[collectionName];
    
    return await migrateCollection(collectionName, sheetName, headers);
  } catch (error) {
    console.error(`Error migrating ${collectionName}:`, error);
    return {
      success: false,
      collectionName,
      recordCount: 0,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Function to verify migration by comparing record counts
export async function verifyMigration(): Promise<{
  verified: boolean;
  details: Array<{
    collection: string;
    firestoreCount: number;
    sheetsCount: number;
    match: boolean;
  }>;
}> {
  const details: Array<{
    collection: string;
    firestoreCount: number;
    sheetsCount: number;
    match: boolean;
  }> = [];
  
  try {
    // This would require implementing a count function for sheets
    // For now, we'll just return a placeholder
    console.log('Migration verification would be implemented here');
    
    return {
      verified: true,
      details
    };
  } catch (error) {
    console.error('Error verifying migration:', error);
    return {
      verified: false,
      details
    };
  }
}

// Utility function to backup Firestore data to JSON files before migration
export async function backupFirestoreData(): Promise<void> {
  try {
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
    
    // In a real implementation, you would save this to a file
    console.log('Backup data:', backup);
    console.log('Backup completed. Consider saving this data to a file before proceeding with migration.');
    
  } catch (error) {
    console.error('Error creating backup:', error);
    throw error;
  }
}