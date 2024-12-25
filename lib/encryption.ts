import CryptoJS from 'crypto-js'

const SECRET_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || ''

if (!SECRET_KEY) {
  throw new Error('NEXT_PUBLIC_ENCRYPTION_KEY is not defined in the environment variables')
}

export function encrypt(text: string): string {
  if (!text) {
    throw new Error('Cannot encrypt empty string')
  }
  
  try {
    // Validate that input is valid JSON
    JSON.parse(text)
    return CryptoJS.AES.encrypt(text, SECRET_KEY).toString()
  } catch (error) {
    throw new Error(`Invalid JSON data for encryption: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export function decrypt(ciphertext: string): string {
  if (!ciphertext) {
    throw new Error('Cannot decrypt empty string')
  }

  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY)
    const decrypted = bytes.toString(CryptoJS.enc.Utf8)
    
    if (!decrypted) {
      throw new Error('Decryption resulted in empty string')
    }

    // Validate decrypted data is valid JSON
    JSON.parse(decrypted)
    return decrypted
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to decrypt data: ${error.message}`)
    } else {
      throw new Error('Failed to decrypt data: Unknown error')
    }
  }
}

export function isEncrypted(text: string): boolean {
  try {
    decrypt(text)
    return true
  } catch {
    return false
  }
}