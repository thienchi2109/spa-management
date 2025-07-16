/**
 * Constants and configurations for Prescription Management System
 */

// Prescription Status Options
export const PRESCRIPTION_STATUSES = {
  DRAFT: 'Draft',
  FINALIZED: 'Finalized', 
  DISPENSED: 'Dispensed',
  CANCELLED: 'Cancelled'
} as const;

// Prescription Status Labels (Vietnamese)
export const PRESCRIPTION_STATUS_LABELS = {
  [PRESCRIPTION_STATUSES.DRAFT]: 'Bản nháp',
  [PRESCRIPTION_STATUSES.FINALIZED]: 'Đã hoàn thành',
  [PRESCRIPTION_STATUSES.DISPENSED]: 'Đã cung cấp',
  [PRESCRIPTION_STATUSES.CANCELLED]: 'Đã hủy'
} as const;

// Prescription Status Badge Variants
export const PRESCRIPTION_STATUS_VARIANTS = {
  [PRESCRIPTION_STATUSES.DRAFT]: 'outline',
  [PRESCRIPTION_STATUSES.FINALIZED]: 'default',
  [PRESCRIPTION_STATUSES.DISPENSED]: 'secondary',
  [PRESCRIPTION_STATUSES.CANCELLED]: 'destructive'
} as const;

// Default Prescription Validity (days)
export const DEFAULT_PRESCRIPTION_VALIDITY_DAYS = 5;

// Clinic Information (can be moved to settings later)
export const DEFAULT_CLINIC_INFO = {
  name: 'SPA CHĂM SÓC SẮC ĐẸP ABC',
  address: 'Số 123, Đường XYZ, Phường Cống Vị, Quận Ba Đình, Hà Nội',
  phone: '(024) 3456 7890',
  licenseNumber: '01234'
} as const;

// Common Dosage Instructions (Vietnamese)
export const COMMON_DOSAGE_INSTRUCTIONS = [
  'Uống sau ăn',
  'Uống trước ăn',
  'Uống khi đói',
  'Uống cùng với thức ăn',
  'Ngậm dưới lưỡi',
  'Bôi ngoài da',
  'Nhỏ mắt',
  'Nhỏ tai',
  'Xịt mũi',
  'Sử dụng khi cần',
  'Uống trước khi ngủ',
  'Uống vào buổi sáng',
  'Chia đều trong ngày'
] as const;

// Common Dosage Frequencies
export const COMMON_DOSAGE_FREQUENCIES = [
  '1 lần/ngày',
  '2 lần/ngày',
  '3 lần/ngày',
  '4 lần/ngày',
  '1 lần/2 ngày',
  '1 lần/3 ngày',
  '1 lần/tuần',
  'Khi cần thiết'
] as const;

// Common Dosage Amounts
export const COMMON_DOSAGE_AMOUNTS = [
  '1/2 viên',
  '1 viên',
  '2 viên',
  '3 viên',
  '1 thìa cà phê',
  '1 thìa canh',
  '5ml',
  '10ml',
  '15ml',
  '1 liều',
  '2 liều'
] as const;

// Medication Units
export const MEDICATION_UNITS = [
  'Viên',
  'Viên nang',
  'Gói',
  'Chai',
  'Lọ',
  'Ống',
  'Tuýp',
  'Hộp',
  'Vỉ',
  'ml',
  'mg',
  'g',
  'liều'
] as const;

// Form validation rules
export const PRESCRIPTION_VALIDATION = {
  MIN_ITEMS: 1,
  MAX_ITEMS: 20,
  MIN_QUANTITY: 0.1,
  MAX_QUANTITY: 9999,
  MIN_UNIT_PRICE: 0,
  MAX_UNIT_PRICE: 10000000, // 10 million VND
  MAX_DOSAGE_LENGTH: 200,
  MAX_INSTRUCTIONS_LENGTH: 500,
  MAX_DOCTOR_NOTES_LENGTH: 1000
} as const;

// Print settings
export const PRINT_SETTINGS = {
  PAGE_SIZE: 'A5',
  MARGIN: '1cm',
  FONT_FAMILY: 'Inter, sans-serif'
} as const;

// QR Code settings
export const QR_CODE_SETTINGS = {
  SIZE: 100,
  ERROR_CORRECTION_LEVEL: 'M',
  MARGIN: 1
} as const;
