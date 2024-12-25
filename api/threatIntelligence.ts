import { db } from '@/lib/firebase';
import {
  collection,
  query,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  getDoc,
} from 'firebase/firestore';
import { encrypt, decrypt, isEncrypted } from '@/lib/encryption';

const COLLECTION_NAME = 'threatIntelligence';

interface ThreatIndicator {
  id: string;
  type: 'ip' | 'domain' | 'url' | 'file_hash';
  value: string;
  confidence: 'low' | 'medium' | 'high';
  verified: boolean;
  status?: 'valid' | 'corrupted';
  lastValidation?: Date;
}

function safeJsonParse(value: string): { success: boolean; data?: any; error?: string } {
  try {
    if (typeof value !== 'string') {
      return {
        success: false,
        error: `Invalid input type: expected string, got ${typeof value}`
      };
    }

    //console.log('Parsing value:', value);
    const parsed = JSON.parse(value);

    return {
      success: true,
      data: parsed
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error';
    console.error('JSON Parse Error:', {
      errorMessage,
      valueLength: value.length,
      valuePreview: value.substring(0, 100)
    });

    return {
      success: false,
      error: errorMessage
    };
  }
}

function sanitizeValue(value: string): string {
  // Remove BOM and hidden characters
  value = value.replace(/^\uFEFF/, '');
  // Remove null characters
  value = value.replace(/\0/g, '');
  // Trim whitespace
  value = value.trim();
  
  // Handle simple string values
  if (!value.startsWith('{') && !value.startsWith('[') && !value.startsWith('"')) {
    // Escape any existing quotes and wrap in quotes
    value = `"${value.replace(/"/g, '\\"')}"`;
  }
  
  return value;
}

function validateThreatData(value: string): { isValid: boolean; error?: string } {
  const parseResult = safeJsonParse(value);
  
  if (!parseResult.success) {
    return { isValid: false, error: parseResult.error };
  }

  const parsed = parseResult.data;
  
  // Validate data structure
  if (typeof parsed !== 'string' && typeof parsed !== 'object') {
    return { isValid: false, error: 'Invalid data type: must be string or object' };
  }

  return { isValid: true };
}

export async function getThreatIndicators(): Promise<ThreatIndicator[]> {
  const q = query(collection(db, COLLECTION_NAME));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.reduce((acc: ThreatIndicator[], doc) => {
    const data = doc.data();
    try {
      /*console.log(`Processing indicator ${doc.id}:`, {
        type: data.type,
        hasValue: !!data.value,
        isEncrypted: isEncrypted(data.value)
      });*/

      let value = data.value;
      
      if (isEncrypted(value)) {
        value = decrypt(value);
        //console.log('Decrypted value:', value);
      }

      const sanitizedValue = sanitizeValue(value);
      const parseResult = safeJsonParse(sanitizedValue);

      if (!parseResult.success) {
        throw new Error(`JSON parsing failed: ${parseResult.error}`);
      }

      acc.push({
        id: doc.id,
        type: data.type,
        value: parseResult.data,
        confidence: data.confidence,
        verified: data.verified,
        status: 'valid',
        lastValidation: new Date()
      } as ThreatIndicator);
    } catch (error) {
      console.error(`Error processing threat indicator ${doc.id}:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        rawValue: data.value,
        docData: {
          type: data.type,
          confidence: data.confidence,
          verified: data.verified
        }
      });

      acc.push({
        id: doc.id,
        type: data.type,
        value: `Error: Corrupted Data (${doc.id}) - ${error instanceof Error ? error.message : 'Unknown error'}`,
        confidence: 'low',
        verified: false,
        status: 'corrupted',
        lastValidation: new Date()
      } as ThreatIndicator);

      // Attempt auto-repair
      reEncryptThreatIndicator(doc.id).catch(e => 
        console.error(`Auto-repair failed for ${doc.id}:`, e)
      );
    }
    return acc;
  }, []);
}

export async function addThreatIndicator(
  indicatorData: Omit<ThreatIndicator, 'id' | 'verified' | 'status' | 'lastValidation'>
): Promise<string> {
  try {
    const validation = validateThreatData(JSON.stringify(indicatorData.value));
    if (!validation.isValid) {
      throw new Error(`Invalid threat data: ${validation.error}`);
    }
    
    const encryptedData = {
      ...indicatorData,
      value: encrypt(JSON.stringify(indicatorData.value)),
      verified: false,
      status: 'valid',
      lastValidation: new Date()
    };
    
    const docRef = await addDoc(collection(db, COLLECTION_NAME), encryptedData);
    return docRef.id;
  } catch (error) {
    console.error('Error adding threat indicator:', error);
    throw error;
  }
}

export async function updateThreatIndicator(
  id: string,
  updateData: Partial<ThreatIndicator>
): Promise<void> {
  try {
    const indicatorRef = doc(db, COLLECTION_NAME, id);
    const indicatorSnap = await getDoc(indicatorRef);
    
    if (!indicatorSnap.exists()) {
      throw new Error(`Threat indicator ${id} not found`);
    }

    const data = {
      ...updateData,
      lastValidation: new Date()
    };

    if (updateData.value) {
      const validation = validateThreatData(JSON.stringify(updateData.value));
      if (!validation.isValid) {
        throw new Error(`Invalid update data: ${validation.error}`);
      }
      data.value = encrypt(JSON.stringify(updateData.value));
    }

    await updateDoc(indicatorRef, data);
  } catch (error) {
    console.error(`Error updating threat indicator ${id}:`, error);
    throw error;
  }
}

export async function reEncryptThreatIndicator(id: string): Promise<void> {
  try {
    const indicatorRef = doc(db, COLLECTION_NAME, id);
    const indicatorSnap = await getDoc(indicatorRef);
    
    if (!indicatorSnap.exists()) {
      throw new Error(`Threat indicator ${id} not found`);
    }
    
    const data = indicatorSnap.data();
    if (!data?.value) {
      throw new Error(`Threat indicator ${id} has no value`);
    }
    
    let value = data.value;
    /*console.log(`Re-encrypting indicator ${id}:`, {
      originalValue: value,
      isEncrypted: isEncrypted(value)
    });*/

    if (isEncrypted(value)) {
      value = decrypt(value);
      //console.log('Decrypted value:', value);
    }

    const sanitizedValue = sanitizeValue(value);
    const validation = validateThreatData(sanitizedValue);
    
    if (!validation.isValid) {
      throw new Error(`Invalid data format: ${validation.error}`);
    }
    
    const encryptedValue = encrypt(sanitizedValue);
    await updateDoc(indicatorRef, { 
      value: encryptedValue,
      status: 'valid',
      lastValidation: new Date()
    });
  } catch (error) {
    console.error(`Error re-encrypting threat indicator ${id}:`, error);
    
    // Mark as corrupted if re-encryption fails
    const indicatorRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(indicatorRef, {
      status: 'corrupted',
      lastValidation: new Date()
    });
    
    throw error;
  }
}