// src/lib/google-sheets.ts
import { GoogleAuth } from 'google-auth-library';
import { sheets_v4, google } from 'googleapis';

// Google Sheets configuration
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

// Initialize Google Sheets API
let sheetsInstance: sheets_v4.Sheets | null = null;

export async function initializeGoogleSheets() {
  if (sheetsInstance) return sheetsInstance;

  try {
    const auth = new GoogleAuth({
      keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE, // Path to service account key file
      scopes: SCOPES,
    });

    const authClient = await auth.getClient();
    sheetsInstance = google.sheets({ version: 'v4', auth: authClient as any });
    
    return sheetsInstance;
  } catch (error) {
    console.error('Failed to initialize Google Sheets API:', error);
    throw error;
  }
}

// Alternative initialization using service account JSON directly
export async function initializeGoogleSheetsWithCredentials() {
  if (sheetsInstance) return sheetsInstance;

  try {
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS || '{}');
    
    const auth = new GoogleAuth({
      credentials,
      scopes: SCOPES,
    });

    const authClient = await auth.getClient();
    sheetsInstance = google.sheets({ version: 'v4', auth: authClient as any });
    
    return sheetsInstance;
  } catch (error) {
    console.error('Failed to initialize Google Sheets API with credentials:', error);
    throw error;
  }
}

// Configuration for different collections
export const SHEET_CONFIG = {
  SPREADSHEET_ID: process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '',
  SHEETS: {
    patients: 'Patients',
    customers: 'Customers',
    appointments: 'Appointments', 
    medications: 'Medications',
    invoices: 'Invoices',
    staff: 'Staff',
    medicalRecords: 'MedicalRecords',

    services: 'SpaServices'
  }
};

// Helper function to convert array of objects to 2D array for sheets
export function objectsToSheetData<T extends Record<string, any>>(
  objects: T[],
  headers: (keyof T)[]
): any[][] {
  const headerRow = headers.map(header => String(header));
  const dataRows = objects.map(obj => 
    headers.map(header => {
      const value = obj[header];
      // Handle different data types
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value);
    })
  );
  
  return [headerRow, ...dataRows];
}

// Helper function to convert sheet data back to objects
export function sheetDataToObjects<T>(
  data: any[][],
  headers: (keyof T)[]
): T[] {
  if (!data || data.length < 2) return [];
  
  const [headerRow, ...dataRows] = data;
  
  return dataRows.map(row => {
    const obj = {} as T;
    headers.forEach((header, index) => {
      const value = row[index] || '';
      
      // Handle different data types based on field names
      if (typeof value === 'string') {
        // Handle numeric fields
        if (['price', 'discountPrice', 'duration', 'preparationTime', 'cleanupTime', 'maxCapacity', 'birthYear', 'weight', 'amount', 'quantity', 'importPrice', 'sellPrice', 'stock', 'minStockThreshold', 'totalCost', 'unitPrice', 'patientAge', 'patientWeight', 'tongChiTieu'].includes(String(header))) {
          // Remove currency symbols and formatting from Google Sheets
          const cleanValue = value.toString().replace(/[₫đ,\s]/g, '').replace(/[^\d.-]/g, '');
          const numValue = parseFloat(cleanValue);
          
          // If price seems too small (under 10000), multiply by 1000 for price-related fields
          // This handles cases where Google Sheets returns 280 instead of 280000
          if (['price', 'discountPrice', 'amount', 'totalCost', 'tongChiTieu'].includes(String(header)) && numValue > 0 && numValue < 10000) {
            obj[header] = (numValue * 1000) as any;
          } else {
            obj[header] = (isNaN(numValue) ? 0 : numValue) as any;
          }
        }
        // Handle boolean fields
        else if (['isActive'].includes(String(header))) {
          obj[header] = (value === 'true' || value === 'TRUE' || value === '1') as any;
        }
        // Handle array fields (JSON strings)
        else if (value.startsWith('{') || value.startsWith('[')) {
          try {
            obj[header] = JSON.parse(value);
          } catch {
            obj[header] = value as any;
          }
        }
        // Handle string arrays that might be comma-separated
        else if (['requiredStaff', 'equipment', 'contraindications', 'benefits', 'medicalHistory'].includes(String(header)) && value.includes(',')) {
          obj[header] = value.split(',').map(item => item.trim()) as any;
        }
        else {
          obj[header] = value as any;
        }
      } else {
        obj[header] = value as any;
      }
    });
    return obj;
  });
}

// Generic function to get data from a sheet
export async function getSheetData<T>(
  sheetName: string,
  headers: (keyof T)[]
): Promise<T[]> {
  try {
    const sheets = await initializeGoogleSheetsWithCredentials();
    
    // Calculate the end column based on number of headers
    const endColumn = String.fromCharCode(65 + Math.max(headers.length - 1, 25)); // At least Z
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_CONFIG.SPREADSHEET_ID,
      range: `${sheetName}!A:${endColumn}`,
    });

    const data = response.data.values || [];
    return sheetDataToObjects<T>(data, headers);
  } catch (error) {
    console.error(`Error getting data from sheet ${sheetName}:`, error);
    throw error;
  }
}

// Generic function to write data to a sheet
export async function writeSheetData<T extends Record<string, any>>(
  sheetName: string,
  data: T[],
  headers: (keyof T)[]
): Promise<void> {
  try {
    const sheets = await initializeGoogleSheetsWithCredentials();
    
    const sheetData = objectsToSheetData(data, headers);
    
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_CONFIG.SPREADSHEET_ID,
      range: `${sheetName}!A1`,
      valueInputOption: 'RAW',
      requestBody: {
        values: sheetData,
      },
    });
  } catch (error) {
    console.error(`Error writing data to sheet ${sheetName}:`, error);
    throw error;
  }
}

// Function to append data to a sheet
export async function appendSheetData<T extends Record<string, any>>(
  sheetName: string,
  data: T[],
  headers: (keyof T)[]
): Promise<void> {
  try {
    const sheets = await initializeGoogleSheetsWithCredentials();
    
    const sheetData = objectsToSheetData(data, headers);
    
    // Calculate the end column based on number of headers
    const endColumn = String.fromCharCode(65 + Math.max(headers.length - 1, 25)); // At least Z
    
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_CONFIG.SPREADSHEET_ID,
      range: `${sheetName}!A:${endColumn}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: sheetData.slice(1), // Skip header row when appending
      },
    });
  } catch (error) {
    console.error(`Error appending data to sheet ${sheetName}:`, error);
    throw error;
  }
}

// Function to update a specific row
export async function updateSheetRow<T extends Record<string, any>>(
  sheetName: string,
  rowIndex: number,
  data: T,
  headers: (keyof T)[]
): Promise<void> {
  try {
    const sheets = await initializeGoogleSheetsWithCredentials();
    
    const rowData = headers.map(header => {
      const value = data[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value);
    });
    
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_CONFIG.SPREADSHEET_ID,
      range: `${sheetName}!A${rowIndex + 1}:Z${rowIndex + 1}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [rowData],
      },
    });
  } catch (error) {
    console.error(`Error updating row ${rowIndex} in sheet ${sheetName}:`, error);
    throw error;
  }
}

// Function to delete a row
export async function deleteSheetRow(
  sheetName: string,
  rowIndex: number
): Promise<void> {
  try {
    const sheets = await initializeGoogleSheetsWithCredentials();
    
    // Get sheet ID first
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SHEET_CONFIG.SPREADSHEET_ID,
    });
    
    const sheet = spreadsheet.data.sheets?.find(s => s.properties?.title === sheetName);
    if (!sheet?.properties?.sheetId) {
      throw new Error(`Sheet ${sheetName} not found`);
    }
    
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_CONFIG.SPREADSHEET_ID,
      requestBody: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: sheet.properties.sheetId,
              dimension: 'ROWS',
              startIndex: rowIndex,
              endIndex: rowIndex + 1,
            },
          },
        }],
      },
    });
  } catch (error) {
    console.error(`Error deleting row ${rowIndex} from sheet ${sheetName}:`, error);
    throw error;
  }
}

// Function to create sheets if they don't exist
export async function ensureSheetsExist(): Promise<void> {
  try {
    const sheets = await initializeGoogleSheetsWithCredentials();
    
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SHEET_CONFIG.SPREADSHEET_ID,
    });
    
    const existingSheets = spreadsheet.data.sheets?.map(s => s.properties?.title) || [];
    const requiredSheets = Object.values(SHEET_CONFIG.SHEETS);
    
    const sheetsToCreate = requiredSheets.filter(sheetName => !existingSheets.includes(sheetName));
    
    if (sheetsToCreate.length > 0) {
      const requests = sheetsToCreate.map(sheetName => ({
        addSheet: {
          properties: {
            title: sheetName,
          },
        },
      }));
      
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SHEET_CONFIG.SPREADSHEET_ID,
        requestBody: { requests },
      });
      
      console.log(`Created sheets: ${sheetsToCreate.join(', ')}`);
    }
  } catch (error) {
    console.error('Error ensuring sheets exist:', error);
    throw error;
  }
}