import { collection, getDocs, writeBatch, doc, DocumentReference, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { Medication } from './types';

// This function checks if a collection is empty, and if so, seeds it with mock data.
// It then returns all documents from the collection.
export async function seedAndFetchCollection<T extends { id: string }>(
  collectionName: string,
  mockData: T[]
): Promise<T[]> {
  const collectionRef = collection(db, collectionName);
  const snapshot = await getDocs(collectionRef);

  if (snapshot.empty && mockData.length > 0) {
    try {
      const batch = writeBatch(db);
      mockData.forEach((item) => {
        // Use the item's own ID from mock data for the document ID
        const docRef = doc(collectionRef, item.id);
        batch.set(docRef, item);
      });
      await batch.commit();
      console.log(`Seeded '${collectionName}' collection.`);
      return mockData;
    } catch (error) {
      console.error(`Error seeding ${collectionName}:`, error);
      return []; // Return empty array on seeding error
    }
  } else {
    return snapshot.docs.map((doc) => ({ ...(doc.data() as T), id: doc.id }));
  }
}

export interface BatchImportResult {
  success: boolean;
  totalRecords: number;
  successfulRecords: number;
  failedRecords: number;
  errors: string[];
  importedIds: string[];
}

/**
 * Import medications in batches to Firebase
 * Firebase has a limit of 500 operations per batch
 */
export async function batchImportMedications(medications: Medication[]): Promise<BatchImportResult> {
  const BATCH_SIZE = 500;
  const result: BatchImportResult = {
    success: true,
    totalRecords: medications.length,
    successfulRecords: 0,
    failedRecords: 0,
    errors: [],
    importedIds: []
  };

  try {
    // Split medications into batches
    const batches = [];
    for (let i = 0; i < medications.length; i += BATCH_SIZE) {
      batches.push(medications.slice(i, i + BATCH_SIZE));
    }

    console.log(`Importing ${medications.length} medications in ${batches.length} batches...`);

    // Process each batch
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];

      try {
        const batchResult = await processMedicationBatch(batch, batchIndex + 1);
        result.successfulRecords += batchResult.successfulRecords;
        result.failedRecords += batchResult.failedRecords;
        result.errors.push(...batchResult.errors);
        result.importedIds.push(...batchResult.importedIds);
      } catch (error) {
        const errorMsg = `Batch ${batchIndex + 1} failed: ${error}`;
        console.error(errorMsg);
        result.errors.push(errorMsg);
        result.failedRecords += batch.length;
        result.success = false;
      }
    }

    console.log(`Import completed: ${result.successfulRecords}/${result.totalRecords} successful`);

  } catch (error) {
    console.error('Batch import failed:', error);
    result.success = false;
    result.errors.push(`Import failed: ${error}`);
  }

  return result;
}

/**
 * Process a single batch of medications
 */
async function processMedicationBatch(
  medications: Medication[],
  batchNumber: number
): Promise<Omit<BatchImportResult, 'totalRecords'>> {
  const batch = writeBatch(db);
  const result = {
    successfulRecords: 0,
    failedRecords: 0,
    errors: [] as string[],
    importedIds: [] as string[]
  };

  try {
    // Add each medication to the batch
    for (const medication of medications) {
      try {
        // Generate new document reference
        const docRef = doc(collection(db, 'medications'));

        // Remove the temporary ID and prepare data for Firestore
        const { id, ...medicationData } = medication;

        // Add to batch
        batch.set(docRef, {
          ...medicationData,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        result.importedIds.push(docRef.id);
        result.successfulRecords++;

      } catch (error) {
        const errorMsg = `Failed to prepare medication "${medication.name}": ${error}`;
        console.error(errorMsg);
        result.errors.push(errorMsg);
        result.failedRecords++;
      }
    }

    // Commit the batch
    await batch.commit();
    console.log(`Batch ${batchNumber} committed successfully: ${result.successfulRecords} records`);

  } catch (error) {
    console.error(`Batch ${batchNumber} commit failed:`, error);
    result.errors.push(`Batch ${batchNumber} commit failed: ${error}`);
    result.failedRecords = medications.length;
    result.successfulRecords = 0;
    result.importedIds = [];
  }

  return result;
}

/**
 * Check for duplicate medications before import
 */
export async function checkForDuplicateMedications(medications: Medication[]): Promise<{
  duplicates: Array<{ medication: Medication; existingId: string }>;
  unique: Medication[];
}> {
  try {
    // Get existing medications
    const existingSnapshot = await getDocs(collection(db, 'medications'));
    const existingMedications = existingSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Medication[];

    const duplicates: Array<{ medication: Medication; existingId: string }> = [];
    const unique: Medication[] = [];

    for (const medication of medications) {
      // Check for duplicates based on name + batchNo combination
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
  const medicationRef = doc(db, 'medications', medication.id);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, ...medicationData } = medication;
  await updateDoc(medicationRef, { ...medicationData, updatedAt: new Date() });
}

export async function deleteMedication(medicationId: string): Promise<void> {
  if (!medicationId) {
    throw new Error("Medication ID is required to delete.");
  }
  const medicationRef = doc(db, 'medications', medicationId);
  await deleteDoc(medicationRef);
}
