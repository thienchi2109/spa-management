// src/lib/sheets-data-setup.ts
import { writeSheetData, SHEET_CONFIG } from './google-sheets';
import { 
  patients as mockPatients,
  appointments as mockAppointments,
  medications as mockMedications,
  invoices as mockInvoices,
  staff as mockStaff,
  medicalRecords as mockMedicalRecords
} from './mock-data';

// Headers for each sheet
const HEADERS = {
  patients: ['id', 'name', 'birthYear', 'gender', 'address', 'phone', 'citizenId', 'weight', 'lastVisit', 'avatarUrl', 'medicalHistory', 'documents'],
  appointments: ['id', 'patientName', 'doctorName', 'date', 'startTime', 'endTime', 'status', 'notes'],
  medications: ['id', 'name', 'activeIngredient', 'concentration', 'dosageForm', 'unit', 'manufacturer', 'manufacturerCountry', 'registrationNumber', 'supplier', 'importPrice', 'sellPrice', 'storageLocation', 'minStockThreshold', 'batchNo', 'expiryDate', 'stock', 'status'],
  invoices: ['id', 'patientName', 'date', 'items', 'amount', 'status'],
  staff: ['id', 'name', 'role', 'avatarUrl', 'phone', 'email', 'password', 'licenseNumber', 'licenseIssueDate', 'licenseIssuePlace', 'licenseExpiryDate'],
  medicalRecords: ['id', 'patientId', 'patientName', 'appointmentId', 'date', 'doctorName', 'symptoms', 'diagnosis', 'treatment', 'products', 'nextAppointment', 'notes']
};

export async function seedGoogleSheetsWithMockData(): Promise<void> {
  try {
    console.log('Seeding Google Sheets with mock data...');

    // Seed patients
    await writeSheetData(SHEET_CONFIG.SHEETS.patients, mockPatients, HEADERS.patients);
    console.log('✅ Seeded patients data');

    // Seed appointments
    await writeSheetData(SHEET_CONFIG.SHEETS.appointments, mockAppointments, HEADERS.appointments);
    console.log('✅ Seeded appointments data');

    // Seed medications
    await writeSheetData(SHEET_CONFIG.SHEETS.medications, mockMedications, HEADERS.medications);
    console.log('✅ Seeded medications data');

    // Seed invoices
    await writeSheetData(SHEET_CONFIG.SHEETS.invoices, mockInvoices, HEADERS.invoices);
    console.log('✅ Seeded invoices data');

    // Seed staff
    await writeSheetData(SHEET_CONFIG.SHEETS.staff, mockStaff, HEADERS.staff);
    console.log('✅ Seeded staff data');

    // Seed medical records
    await writeSheetData(SHEET_CONFIG.SHEETS.medicalRecords, mockMedicalRecords, HEADERS.medicalRecords);
    console.log('✅ Seeded medical records data');

    console.log('🎉 All mock data seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding mock data:', error);
    throw error;
  }
}