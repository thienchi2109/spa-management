import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Patient } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
}

export function calculateAge(birthYear: number): number {
  if (!birthYear) return 0;
  // Use a static year to be consistent with mock data and avoid hydration errors.
  return 2024 - birthYear;
}

export function formatCurrency(amount: number): string {
    if (typeof amount !== 'number') return '';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

/**
 * Generates a patient ID following the pattern: PATIENT-DDMMYYYY-XXX
 * @param existingPatients - Array of existing patients to check for ID collisions
 * @param creationDate - Optional date for ID generation (defaults to today)
 * @returns Generated patient ID
 */
export function generatePatientId(existingPatients: { id: string }[], creationDate?: Date): string {
    const date = creationDate || new Date();

    // Format date as DDMMYYYY
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString();
    const dateStr = `${day}${month}${year}`;

    // Find existing patient IDs for the same date
    const datePrefix = `PATIENT-${dateStr}-`;
    const existingIdsForDate = existingPatients
        .filter(patient => patient.id.startsWith(datePrefix))
        .map(patient => patient.id)
        .sort();

    // Find the next available sequence number
    let sequenceNumber = 0;
    for (const existingId of existingIdsForDate) {
        const sequencePart = existingId.split('-')[2];
        const currentSequence = parseInt(sequencePart, 10);
        if (currentSequence === sequenceNumber) {
            sequenceNumber++;
        } else {
            break;
        }
    }

    // Format sequence number as XXX (3 digits with leading zeros)
    const sequenceStr = sequenceNumber.toString().padStart(3, '0');

    return `PATIENT-${dateStr}-${sequenceStr}`;
}

/**
 * Generates a customer ID following the pattern: CUSTOMER-DDMMYYYY-XXX
 * @param existingCustomers - Array of existing customers to check for ID collisions
 * @param creationDate - Optional date for ID generation (defaults to today)
 * @returns Generated customer ID
 */
export function generateCustomerId(existingCustomers: { id: string }[], creationDate?: Date): string {
    const date = creationDate || new Date();

    // Format date as DDMMYYYY
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString();
    const dateStr = `${day}${month}${year}`;

    // Find existing customer IDs for the same date
    const datePrefix = `CUSTOMER-${dateStr}-`;
    const existingIdsForDate = existingCustomers
        .filter(customer => customer.id.startsWith(datePrefix))
        .map(customer => customer.id)
        .sort();

    // Find the next available sequence number
    let sequenceNumber = 0;
    for (const existingId of existingIdsForDate) {
        const sequencePart = existingId.split('-')[2];
        const currentSequence = parseInt(sequencePart, 10);
        if (currentSequence === sequenceNumber) {
            sequenceNumber++;
        } else {
            break;
        }
    }

    // Format sequence number as XXX (3 digits with leading zeros)
    const sequenceStr = sequenceNumber.toString().padStart(3, '0');

    return `CUSTOMER-${dateStr}-${sequenceStr}`;
}

/**
 * Generates a customer ID following the pattern: KH-DDMMYYYY-xxx
 * @param existingCustomers - Array of existing customers to check for ID collisions
 * @param creationDate - Optional date for ID generation (defaults to today)
 * @returns Generated customer ID
 */
export function generateKhachHangId(existingCustomers: { id: string }[], creationDate?: Date): string {
    const date = creationDate || new Date();

    // Format date as DDMMYYYY
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString();
    const dateStr = `${day}${month}${year}`;

    // Find existing customer IDs for the same date
    const datePrefix = `KH-${dateStr}-`;
    const existingIdsForDate = existingCustomers
        .filter(customer => customer.id.startsWith(datePrefix))
        .map(customer => customer.id)
        .sort();

    // Find the next available sequence number
    let sequenceNumber = 0;
    for (const existingId of existingIdsForDate) {
        const sequencePart = existingId.split('-')[2];
        if (sequencePart) {
            const currentSequence = parseInt(sequencePart, 10);
            if (currentSequence === sequenceNumber) {
                sequenceNumber++;
            } else {
                break;
            }
        }
    }

    // Format sequence number as xxx (3 digits with leading zeros)
    const sequenceStr = sequenceNumber.toString().padStart(3, '0');

    return `KH-${dateStr}-${sequenceStr}`;
}


