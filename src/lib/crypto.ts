
/**
 * Utility functions for end-to-end encryption using the Web Crypto API
 * Handles key generation, encryption/decryption, and key management
 */

// Generate a new key pair for asymmetric encryption (RSA-OAEP)
export async function generateKeyPair(): Promise<CryptoKeyPair> {
  return await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true, // extractable
    ["encrypt", "decrypt"]
  );
}

// Generate a symmetric key for channel/group encryption (AES-GCM)
export async function generateSymmetricKey(): Promise<CryptoKey> {
  return await window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true, // extractable
    ["encrypt", "decrypt"]
  );
}

// Export a key to JSON Web Key (JWK) format for storage
export async function exportKey(key: CryptoKey): Promise<JsonWebKey> {
  return await window.crypto.subtle.exportKey("jwk", key);
}

// Import a key from JWK format
export async function importKey(
  jwk: JsonWebKey,
  isPrivate = false
): Promise<CryptoKey> {
  return await window.crypto.subtle.importKey(
    "jwk",
    jwk,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    isPrivate ? ["decrypt"] : ["encrypt"]
  );
}

// Import a symmetric key from JWK format
export async function importSymmetricKey(jwk: JsonWebKey): Promise<CryptoKey> {
  return await window.crypto.subtle.importKey(
    "jwk",
    jwk,
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );
}

// Encrypt data using the recipient's public key
export async function encryptWithPublicKey(
  data: string,
  publicKey: CryptoKey
): Promise<string> {
  // Convert data to ArrayBuffer
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);

  // Encrypt the data
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: "RSA-OAEP",
    },
    publicKey,
    dataBuffer
  );

  // Convert to base64 for storage/transmission
  return arrayBufferToBase64(encryptedBuffer);
}

// Decrypt data using the recipient's private key
export async function decryptWithPrivateKey(
  encryptedData: string,
  privateKey: CryptoKey
): Promise<string> {
  // Convert from base64 to ArrayBuffer
  const encryptedBuffer = base64ToArrayBuffer(encryptedData);

  // Decrypt the data
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: "RSA-OAEP",
    },
    privateKey,
    encryptedBuffer
  );

  // Convert back to string
  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}

// Encrypt data using a symmetric key (for channel messages)
export async function encryptWithSymmetricKey(
  data: string,
  symmetricKey: CryptoKey
): Promise<{ ciphertext: string; iv: string }> {
  // Generate a random IV
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  // Convert data to ArrayBuffer
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);

  // Encrypt the data
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    symmetricKey,
    dataBuffer
  );

  // Convert to base64 for storage/transmission
  return {
    ciphertext: arrayBufferToBase64(encryptedBuffer),
    iv: arrayBufferToBase64(iv),
  };
}

// Decrypt data using a symmetric key
export async function decryptWithSymmetricKey(
  encryptedData: string,
  iv: string,
  symmetricKey: CryptoKey
): Promise<string> {
  // Convert from base64 to ArrayBuffer
  const encryptedBuffer = base64ToArrayBuffer(encryptedData);
  const ivBuffer = base64ToArrayBuffer(iv);

  // Decrypt the data
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: new Uint8Array(ivBuffer),
    },
    symmetricKey,
    encryptedBuffer
  );

  // Convert back to string
  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}

// Helper function to convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper function to convert Base64 to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}
