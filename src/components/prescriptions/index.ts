// Prescription Management Components
export { default as PrescriptionForm } from './prescription-form';
export { default as PrescriptionDialog } from './prescription-dialog';
export { default as PrescriptionList } from './prescription-list';
export { default as PrescriptionDetailDialog } from './prescription-detail-dialog';

// Re-export types for convenience
export type { 
  Prescription, 
  PrescriptionItem 
} from '@/lib/types';

// Re-export constants for convenience
export {
  PRESCRIPTION_STATUSES,
  PRESCRIPTION_STATUS_LABELS,
  PRESCRIPTION_STATUS_VARIANTS,
  DEFAULT_CLINIC_INFO,
  COMMON_DOSAGE_INSTRUCTIONS,
  COMMON_DOSAGE_FREQUENCIES,
  COMMON_DOSAGE_AMOUNTS,
  MEDICATION_UNITS,
  PRESCRIPTION_VALIDATION
} from '@/lib/prescription-constants';

// Re-export utility functions for convenience
export {
  generatePrescriptionId,
  calculatePrescriptionTotal,
  calculateItemTotal,
  generatePrescriptionValidUntil,
  isPrescriptionValid,
  formatPrescriptionStatus,
  getPrescriptionStatusVariant
} from '@/lib/utils';
