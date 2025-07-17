// src/lib/sheets-utils.ts
import type { 
  Patient, 
  Customer,
  Appointment, 
  Medication, 
  Invoice, 
  Staff, 
  MedicalRecord,
  SpaService
} from './types';

// API client functions to interact with our API routes
async function apiRequest(url: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

async function getSheetData<T>(collection: string): Promise<T[]> {
  const result = await apiRequest(`/api/sheets?collection=${collection}`);
  return result.data;
}

async function addSheetData<T>(collection: string, data: T | T[]): Promise<void> {
  await apiRequest('/api/sheets', {
    method: 'POST',
    body: JSON.stringify({
      collection,
      data,
      operation: 'append'
    }),
  });
}

async function updateSheetData<T extends { id: string }>(collection: string, data: T): Promise<void> {
  await apiRequest('/api/sheets', {
    method: 'PUT',
    body: JSON.stringify({
      collection,
      data,
      id: data.id
    }),
  });
}

async function deleteSheetData(collection: string, id: string): Promise<void> {
  await apiRequest(`/api/sheets?collection=${collection}&id=${id}`, {
    method: 'DELETE',
  });
}

async function writeSheetData<T>(collection: string, data: T[]): Promise<void> {
  await apiRequest('/api/sheets', {
    method: 'POST',
    body: JSON.stringify({
      collection,
      data,
      operation: 'write'
    }),
  });
}

// Define headers for each data type
const PATIENT_HEADERS: (keyof Patient)[] = [
  'id', 'name', 'birthYear', 'gender', 'address', 'phone', 'citizenId', 
  'weight', 'lastVisit', 'avatarUrl', 'medicalHistory', 'documents'
];

const APPOINTMENT_HEADERS: (keyof Appointment)[] = [
  'id', 'patientName', 'doctorName', 'schedulerName', 'date', 'startTime', 'endTime', 'status', 'services', 'notes'
];

const MEDICATION_HEADERS: (keyof Medication)[] = [
  'id', 'name', 'activeIngredient', 'concentration', 'dosageForm', 'unit',
  'manufacturer', 'manufacturerCountry', 'registrationNumber', 'supplier',
  'importPrice', 'sellPrice', 'storageLocation', 'minStockThreshold',
  'batchNo', 'expiryDate', 'stock', 'status'
];

const INVOICE_HEADERS: (keyof Invoice)[] = [
  'id', 'patientName', 'date', 'items', 'amount', 'status'
];

const STAFF_HEADERS: (keyof Staff)[] = [
  'id', 'name', 'role', 'avatarUrl', 'phone', 'email', 'password',
  'licenseNumber', 'licenseIssueDate', 'licenseIssuePlace', 'licenseExpiryDate'
];

const MEDICAL_RECORD_HEADERS: (keyof MedicalRecord)[] = [
  'id', 'patientId', 'patientName', 'appointmentId', 'date', 'doctorName',
  'symptoms', 'diagnosis', 'treatment', 'products', 'nextAppointment', 'notes'
];



const SERVICE_HEADERS: (keyof SpaService)[] = [
  'id', 'name', 'category', 'description', 'duration', 'price', 'discountPrice',
  'requiredStaff', 'equipment', 'roomType', 'preparationTime', 'cleanupTime',
  'maxCapacity', 'ageRestriction', 'contraindications', 'benefits',
  'aftercareInstructions', 'isActive'
];

const CUSTOMER_HEADERS: (keyof Customer)[] = [
  'id', 'name', 'birthYear', 'gender', 'address', 'phone', 'lastVisit', 'avatarUrl', 'tongChiTieu'
];

// Function to get collection data from Google Sheets (no more seeding with mock data)
export async function getCollectionData<T extends { id: string }>(
  collectionName: string
): Promise<T[]> {
  try {
    // Get existing data from Google Sheets
    const existingData = await getSheetData<T>(collectionName);
    return existingData;
  } catch (error) {
    console.error(`Error in getCollectionData for ${collectionName}:`, error);
    // Return empty array on error instead of mock data
    return [];
  }
}

// Helper function to get sheet name from collection name
function getSheetName(collectionName: string): string {
  // Since we're using API routes, we can just return the collection name
  return collectionName;
}

// Helper function to get headers for a collection
function getHeaders<T>(collectionName: string): (keyof T)[] {
  const headerMap: Record<string, any[]> = {
    'patients': PATIENT_HEADERS,
    'customers': CUSTOMER_HEADERS,
    'appointments': APPOINTMENT_HEADERS,
    'services': SERVICE_HEADERS,
    'SpaServices': SERVICE_HEADERS,
    'invoices': INVOICE_HEADERS,
    'staff': STAFF_HEADERS,
    'medicalRecords': MEDICAL_RECORD_HEADERS,
  };
  
  return headerMap[collectionName] || [];
}

// Medication-specific functions
export interface BatchImportResult {
  success: boolean;
  totalRecords: number;
  successfulRecords: number;
  failedRecords: number;
  errors: string[];
  importedIds: string[];
}

export async function batchImportMedications(medications: Medication[]): Promise<BatchImportResult> {
  const result: BatchImportResult = {
    success: true,
    totalRecords: medications.length,
    successfulRecords: 0,
    failedRecords: 0,
    errors: [],
    importedIds: []
  };

  try {
    // Generate IDs for medications that don't have them
    const medicationsWithIds = medications.map((med, index) => ({
      ...med,
      id: med.id || `med_${Date.now()}_${index}`
    }));
    
    // Get existing medications to avoid duplicates
    const existingMedications = await getSheetData<Medication>('medications');
    
    // Filter out duplicates
    const newMedications = medicationsWithIds.filter(med => 
      !existingMedications.some(existing => 
        existing.name === med.name && existing.batchNo === med.batchNo
      )
    );
    
    if (newMedications.length === 0) {
      result.errors.push('All medications already exist in the database');
      result.failedRecords = medications.length;
      result.success = false;
      return result;
    }
    
    // Append new medications
    await addSheetData('medications', newMedications);
    
    result.successfulRecords = newMedications.length;
    result.importedIds = newMedications.map(med => med.id);
    
    console.log(`Successfully imported ${result.successfulRecords} medications`);
    
  } catch (error) {
    console.error('Batch import failed:', error);
    result.success = false;
    result.errors.push(`Import failed: ${error}`);
    result.failedRecords = medications.length;
  }

  return result;
}

export async function checkForDuplicateMedications(medications: Medication[]): Promise<{
  duplicates: Array<{ medication: Medication; existingId: string }>;
  unique: Medication[];
}> {
  try {
    const existingMedications = await getSheetData<Medication>('medications');

    const duplicates: Array<{ medication: Medication; existingId: string }> = [];
    const unique: Medication[] = [];

    for (const medication of medications) {
      const existing = existingMedications.find(existing =>
        existing.name === medication.name &&
        existing.batchNo === medication.batchNo
      );

      if (existing) {
        duplicates.push({ medication, existingId: existing.id });
      } else {
        unique.push(medication);
      }
    }

    return { duplicates, unique };

  } catch (error) {
    console.error('Error checking for duplicates:', error);
    throw error;
  }
}

export async function updateMedication(medication: Medication): Promise<void> {
  if (!medication.id) {
    throw new Error("Medication ID is required to update.");
  }
  
  try {
    await updateSheetData('medications', medication);
  } catch (error) {
    console.error('Error updating medication:', error);
    throw error;
  }
}

export async function deleteMedication(medicationId: string): Promise<void> {
  if (!medicationId) {
    throw new Error("Medication ID is required to delete.");
  }
  
  try {
    await deleteSheetData('medications', medicationId);
  } catch (error) {
    console.error('Error deleting medication:', error);
    throw error;
  }
}

// Service CRUD operations
export async function updateService(service: SpaService): Promise<void> {
  if (!service.id) {
    throw new Error("Service ID is required to update.");
  }
  
  try {
    await updateSheetData('services', service);
  } catch (error) {
    console.error('Error updating service:', error);
    throw error;
  }
}

export async function deleteService(serviceId: string): Promise<void> {
  if (!serviceId) {
    throw new Error("Service ID is required to delete.");
  }
  
  try {
    await deleteSheetData('services', serviceId);
  } catch (error) {
    console.error('Error deleting service:', error);
    throw error;
  }
}

// Generic CRUD operations for other entities
export async function addDocument<T extends { id: string }>(
  collectionName: string,
  document: Omit<T, 'id'> & { id?: string }
): Promise<T> {
  try {
    // Generate ID if not provided
    const documentWithId = {
      ...document,
      id: document.id || `${collectionName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    } as T;
    
    await addSheetData(collectionName, documentWithId);
    return documentWithId;
  } catch (error) {
    console.error(`Error adding document to ${collectionName}:`, error);
    throw error;
  }
}

export async function updateDocument<T extends { id: string }>(
  collectionName: string,
  document: T
): Promise<void> {
  if (!document.id) {
    throw new Error("Document ID is required to update.");
  }
  
  try {
    await updateSheetData(collectionName, document);
  } catch (error) {
    console.error(`Error updating document in ${collectionName}:`, error);
    throw error;
  }
}

export async function deleteDocument(
  collectionName: string,
  documentId: string
): Promise<void> {
  if (!documentId) {
    throw new Error("Document ID is required to delete.");
  }
  
  try {
    await deleteSheetData(collectionName, documentId);
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}:`, error);
    throw error;
  }
}

// Specific functions for each entity type
export async function addPatient(patient: Omit<Patient, 'id'> & { id?: string }): Promise<Patient> {
  return addDocument<Patient>('patients', patient);
}

export async function updatePatient(patient: Patient): Promise<void> {
  return updateDocument<Patient>('patients', patient);
}

export async function deletePatient(patientId: string): Promise<void> {
  return deleteDocument('patients', patientId);
}

export async function addAppointment(appointment: Omit<Appointment, 'id'> & { id?: string }): Promise<Appointment> {
  return addDocument<Appointment>('appointments', appointment);
}

export async function updateAppointment(appointment: Appointment): Promise<void> {
  return updateDocument<Appointment>('appointments', appointment);
}

export async function deleteAppointment(appointmentId: string): Promise<void> {
  return deleteDocument('appointments', appointmentId);
}

export async function addInvoice(invoice: Omit<Invoice, 'id'> & { id?: string }): Promise<Invoice> {
  return addDocument<Invoice>('invoices', invoice);
}

export async function updateInvoice(invoice: Invoice): Promise<void> {
  return updateDocument<Invoice>('invoices', invoice);
}

export async function deleteInvoice(invoiceId: string): Promise<void> {
  return deleteDocument('invoices', invoiceId);
}

export async function addMedicalRecord(record: Omit<MedicalRecord, 'id'> & { id?: string }): Promise<MedicalRecord> {
  return addDocument<MedicalRecord>('medicalRecords', record);
}

export async function updateMedicalRecord(record: MedicalRecord): Promise<void> {
  return updateDocument<MedicalRecord>('medicalRecords', record);
}

export async function deleteMedicalRecord(recordId: string): Promise<void> {
  return deleteDocument('medicalRecords', recordId);
}

// Customer CRUD operations
export async function addCustomer(customer: Omit<Customer, 'id'> & { id?: string }): Promise<Customer> {
  return addDocument<Customer>('customers', customer);
}

export async function updateCustomer(customer: Customer): Promise<void> {
  return updateDocument<Customer>('customers', customer);
}

export async function deleteCustomer(customerId: string): Promise<void> {
  return deleteDocument('customers', customerId);
}