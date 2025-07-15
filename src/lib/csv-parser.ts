import type { Medication } from './types';

export interface CSVParseResult {
  success: boolean;
  data: Medication[];
  errors: string[];
  warnings: string[];
  totalRows: number;
  validRows: number;
}

export interface CSVValidationError {
  row: number;
  field: string;
  value: any;
  message: string;
}

// Expected CSV column mapping
export const CSV_COLUMN_MAPPING = {
  // Standard format (Vietnamese with spaces)
  'Tên thuốc': 'name',
  'Hoạt chất': 'activeIngredient',
  'Hàm lượng': 'concentration',
  'Dạng bào chế': 'dosageForm',
  'Đơn vị tính': 'unit',
  'Nhà sản xuất': 'manufacturer',
  'Nước sản xuất': 'manufacturerCountry',
  'Số đăng ký': 'registrationNumber',
  'Nhà cung cấp': 'supplier',
  'Giá nhập': 'importPrice',
  'Giá bán': 'sellPrice',
  'Vị trí kho': 'storageLocation',
  'Ngưỡng tồn kho': 'minStockThreshold',
  'Số lô': 'batchNo',
  'Ngày hết hạn': 'expiryDate',
  'Tồn kho': 'stock',

  // Alternative format (Vietnamese without spaces - user's format)
  'TenThuoc': 'name',
  'HoatChat': 'activeIngredient',
  'SoLo': 'batchNo',
  'HanDung': 'expiryDate',
  'TonKho': 'stock',
  'DonViTinh': 'unit',
  'TonToiThieu': 'minStockThreshold',
  'NhaCungCap': 'supplier',
  'NhaSanXuat': 'manufacturer',
  'NuocSanXuat': 'manufacturerCountry',
  'SoDangKy': 'registrationNumber',
  'GiaNhap': 'importPrice',
  'GiaBan': 'sellPrice',
  'ViTri': 'storageLocation',
  'TrangThai': 'status' // Additional field
} as const;

// Required fields that must be present
export const REQUIRED_FIELDS = [
  'name', 'activeIngredient', 'unit', 'manufacturer', 'batchNo', 'expiryDate', 'stock'
] as const;

// Fields that should be numbers
export const NUMERIC_FIELDS = [
  'importPrice', 'sellPrice', 'minStockThreshold', 'stock'
] as const;

/**
 * Parse CSV text content into array of objects
 */
export function parseCSVContent(csvContent: string): any[] {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV file must have at least a header row and one data row');
  }

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const rows: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length !== headers.length) {
      console.warn(`Row ${i + 1}: Column count mismatch. Expected ${headers.length}, got ${values.length}`);
    }
    
    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    rows.push(row);
  }

  return rows;
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

/**
 * Validate and transform CSV data to Medication objects
 */
export function validateAndTransformCSVData(csvData: any[]): CSVParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const validMedications: Medication[] = [];
  
  // Check if required columns exist
  const firstRow = csvData[0] || {};
  const availableColumns = Object.keys(firstRow);
  const mappedColumns = availableColumns.filter(col => col in CSV_COLUMN_MAPPING);
  
  if (mappedColumns.length === 0) {
    errors.push('No recognized columns found. Please check column headers.');
    return {
      success: false,
      data: [],
      errors,
      warnings,
      totalRows: csvData.length,
      validRows: 0
    };
  }

  // Validate each row
  csvData.forEach((row, index) => {
    const rowNumber = index + 1;
    console.log(`🔍 Processing row ${rowNumber}:`, row);

    const medication: Partial<Medication> = {
      id: `MED${Date.now()}_${index}` // Generate temporary ID
    };

    let hasErrors = false;

    // Map and validate each field - only process columns that exist in CSV
    mappedColumns.forEach((csvColumn) => {
      const fieldName = CSV_COLUMN_MAPPING[csvColumn as keyof typeof CSV_COLUMN_MAPPING];
      const value = row[csvColumn];
      console.log(`  📋 Field "${csvColumn}" -> "${fieldName}": "${value}"`);

      // Check required fields
      if (REQUIRED_FIELDS.includes(fieldName as any) && (!value || value.toString().trim() === '')) {
        console.log(`  ❌ Missing required field: ${csvColumn}`);
        errors.push(`Row ${rowNumber}: Missing required field "${csvColumn}"`);
        hasErrors = true;
        return;
      }

      // Transform and validate data types
      try {
        if (NUMERIC_FIELDS.includes(fieldName as any)) {
          const numValue = parseFloat(value?.toString().replace(/[,\s]/g, '') || '0');
          if (isNaN(numValue)) {
            errors.push(`Row ${rowNumber}: Invalid number format for "${csvColumn}": ${value}`);
            hasErrors = true;
          } else {
            (medication as any)[fieldName] = numValue;
          }
        } else if (fieldName === 'expiryDate') {
          const dateValue = validateAndFormatDate(value);
          if (!dateValue) {
            errors.push(`Row ${rowNumber}: Invalid date format for "${csvColumn}": ${value}. Expected format: YYYY-MM-DD or DD/MM/YYYY`);
            hasErrors = true;
          } else {
            (medication as any)[fieldName] = dateValue;
          }
        } else {
          // String fields
          (medication as any)[fieldName] = value?.toString().trim() || '';
        }
      } catch (error) {
        errors.push(`Row ${rowNumber}: Error processing "${csvColumn}": ${error}`);
        hasErrors = true;
      }
    });

    // Set default values for optional fields
    if (!hasErrors) {
      // Handle missing fields with defaults
      medication.concentration = medication.concentration || 'N/A';
      medication.dosageForm = medication.dosageForm || 'Không xác định';
      medication.importPrice = medication.importPrice || 0;
      medication.sellPrice = medication.sellPrice || 0;
      medication.minStockThreshold = medication.minStockThreshold || 10;
      medication.manufacturerCountry = medication.manufacturerCountry || 'Việt Nam';
      medication.supplier = medication.supplier || medication.manufacturer;
      medication.registrationNumber = medication.registrationNumber || 'N/A';
      medication.storageLocation = medication.storageLocation || 'Chưa xác định';

      validMedications.push(medication as Medication);
    }
  });

  return {
    success: errors.length === 0,
    data: validMedications,
    errors,
    warnings,
    totalRows: csvData.length,
    validRows: validMedications.length
  };
}

/**
 * Validate and format date string
 */
function validateAndFormatDate(dateStr: string): string | null {
  if (!dateStr) return null;
  
  const str = dateStr.toString().trim();
  
  // Try different date formats
  const formats = [
    /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY
    /^\d{2}-\d{2}-\d{4}$/, // DD-MM-YYYY
    /^\d{1,2}\/\d{1,2}\/\d{4}$/, // D/M/YYYY or DD/M/YYYY
  ];

  for (const format of formats) {
    if (format.test(str)) {
      let date: Date;

      if (str.includes('/')) {
        // DD/MM/YYYY or D/M/YYYY format
        const [day, month, year] = str.split('/');
        const dayNum = parseInt(day);
        const monthNum = parseInt(month);
        const yearNum = parseInt(year);

        // Validate ranges
        if (dayNum >= 1 && dayNum <= 31 && monthNum >= 1 && monthNum <= 12 && yearNum >= 1900) {
          date = new Date(yearNum, monthNum - 1, dayNum);
        } else {
          continue;
        }
      } else if (str.includes('-')) {
        if (str.startsWith('20')) {
          // YYYY-MM-DD format
          date = new Date(str);
        } else {
          // DD-MM-YYYY format
          const [day, month, year] = str.split('-');
          const dayNum = parseInt(day);
          const monthNum = parseInt(month);
          const yearNum = parseInt(year);

          if (dayNum >= 1 && dayNum <= 31 && monthNum >= 1 && monthNum <= 12 && yearNum >= 1900) {
            date = new Date(yearNum, monthNum - 1, dayNum);
          } else {
            continue;
          }
        }
      } else {
        continue;
      }

      if (!isNaN(date.getTime())) {
        // Return in YYYY-MM-DD format
        return date.toISOString().split('T')[0];
      }
    }
  }
  
  return null;
}

/**
 * Generate sample CSV template
 */
export function generateCSVTemplate(): string {
  const headers = Object.keys(CSV_COLUMN_MAPPING);
  const sampleRow = [
    'Paracetamol 500mg',
    'Paracetamol', 
    '500mg',
    'Viên nén',
    'Viên',
    'Công ty TNHH Dược phẩm Traphaco',
    'Việt Nam',
    'VD-18533-15',
    'Công ty CP Dược phẩm Hà Tây',
    '1200',
    '1800',
    'Tủ A - Kệ 1 - Ngăn 2',
    '50',
    'B0123',
    '2025-12-31',
    '150'
  ];
  
  return [headers.join(','), sampleRow.join(',')].join('\n');
}
