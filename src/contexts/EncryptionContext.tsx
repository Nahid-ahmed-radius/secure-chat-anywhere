import { createContext, useContext, useState, ReactNode } from 'react';
import {
  generateKeyPair,
  exportKey,
  importKey,
  encryptWithPublicKey,
  decryptWithPrivateKey,
  generateSymmetricKey,
  importSymmetricKey,
  encryptWithSymmetricKey,
  decryptWithSymmetricKey,
} from '@/lib/crypto';
import { useAuth } from './AuthContext';
import { useStorage } from './StorageContext';
import { StoragePaths } from '@/lib/storage/storage-adapter';
import { EncryptionKeyReference } from '@/types';

interface EncryptionContextValue {
  encryptMessage: (message: string, channelId: string) => Promise<{ ciphertext: string; iv: string }>;
  decryptMessage: (ciphertext: string, iv: string, channelId: string) => Promise<string>;
  encryptFile: (file: File, channelId: string) => Promise<{ encryptedData: string; iv: string; metadata: string }>;
  decryptFile: (encryptedData: string, iv: string, metadata: string, channelId: string) => Promise<Blob>;
  shareChannelKey: (channelId: string, recipientPublicKeyJwk: JsonWebKey) => Promise<string>;
  importSharedChannelKey: (encryptedKey: string, channelId: string) => Promise<boolean>;
  generateChannelKey: (channelId: string) => Promise<boolean>;
  hasChannelKey: (channelId: string) => Promise<boolean>;
}

const EncryptionContext = createContext<EncryptionContextValue>({
  encryptMessage: async () => ({ ciphertext: '', iv: '' }),
  decryptMessage: async () => '',
  encryptFile: async () => ({ encryptedData: '', iv: '', metadata: '' }),
  decryptFile: async () => new Blob(),
  shareChannelKey: async () => '',
  importSharedChannelKey: async () => false,
  generateChannelKey: async () => false,
  hasChannelKey: async () => false,
});

// Keep a cache of symmetric keys for channels
const channelKeysCache: Record<string, CryptoKey> = {};

export const EncryptionProvider = ({ children }: { children: ReactNode }) => {
  const { authState, getPrivateKey } = useAuth();
  const { storeData, retrieveData } = useStorage();
  
  // Get the symmetric key for a channel
  const getChannelKey = async (channelId: string): Promise<CryptoKey | null> => {
    try {
      // Check cache first
      if (channelKeysCache[channelId]) {
        return channelKeysCache[channelId];
      }
      
      // Get the user's private key for decryption
      const privateKeyJwk = await getPrivateKey();
      if (!privateKeyJwk) {
        throw new Error('Private key not available');
      }
      
      // Import the private key
      const privateKey = await importKey(privateKeyJwk, true);
      
      // Try to retrieve the encrypted channel key
      const encryptedKeyReferencePath = `${StoragePaths.ENCRYPTION}/${channelId}`;
      const encryptedKeyReferenceData = await retrieveData(
        `key-${authState.user?.id}.json`,
        encryptedKeyReferencePath
      );
      
      const encryptedKeyReference: EncryptionKeyReference = JSON.parse(encryptedKeyReferenceData);
      
      // Decrypt the symmetric key using the user's private key
      const decryptedKeyJwk = await decryptWithPrivateKey(
        encryptedKeyReference.encryptedKey, 
        privateKey
      );
      
      // Import the symmetric key
      const symmetricKey = await importSymmetricKey(JSON.parse(decryptedKeyJwk));
      
      // Add to cache
      channelKeysCache[channelId] = symmetricKey;
      
      return symmetricKey;
    } catch (error) {
      console.error('Error getting channel key:', error);
      return null;
    }
  };
  
  // Generate a new symmetric key for a channel
  const generateChannelKey = async (channelId: string): Promise<boolean> => {
    try {
      if (!authState.user) {
        throw new Error('User not authenticated');
      }
      
      // Generate a new symmetric key for the channel
      const symmetricKey = await generateSymmetricKey();
      
      // Export the key to JWK format
      const symmetricKeyJwk = await exportKey(symmetricKey);
      
      // Get the user's private key for decryption later
      const privateKeyJwk = await getPrivateKey();
      if (!privateKeyJwk) {
        throw new Error('Private key not available');
      }
      
      // Import user's public key
      const publicKeyData = authState.user.publicKey;
      if (!publicKeyData) {
        throw new Error('Public key not available');
      }
      
      const publicKeyJwk = JSON.parse(publicKeyData);
      const publicKey = await importKey(publicKeyJwk, false);
      
      // Encrypt the symmetric key with the user's public key
      const encryptedKey = await encryptWithPublicKey(
        JSON.stringify(symmetricKeyJwk),
        publicKey
      );
      
      // Create the key reference
      const keyReference: EncryptionKeyReference = {
        id: `key-${channelId}-${authState.user.id}`,
        ownerUserId: authState.user.id,
        encryptedKey,
        keyType: 'channel',
        associatedId: channelId,
        createdAt: new Date(),
      };
      
      // Store the encrypted key reference
      await storeData(
        `key-${authState.user.id}.json`,
        JSON.stringify(keyReference),
        `${StoragePaths.ENCRYPTION}/${channelId}`
      );
      
      // Add to cache
      channelKeysCache[channelId] = symmetricKey;
      
      return true;
    } catch (error) {
      console.error('Error generating channel key:', error);
      return false;
    }
  };
  
  // Check if user has the key for a channel
  const hasChannelKey = async (channelId: string): Promise<boolean> => {
    try {
      // Check cache first
      if (channelKeysCache[channelId]) {
        return true;
      }
      
      // Try to get the key
      const key = await getChannelKey(channelId);
      return !!key;
    } catch (error) {
      return false;
    }
  };
  
  // Share a channel's key with another user
  const shareChannelKey = async (
    channelId: string,
    recipientPublicKeyJwk: JsonWebKey
  ): Promise<string> => {
    try {
      if (!authState.user) {
        throw new Error('User not authenticated');
      }
      
      // Get the channel's symmetric key
      const channelKey = await getChannelKey(channelId);
      if (!channelKey) {
        throw new Error('Channel key not available');
      }
      
      // Export the symmetric key
      const symmetricKeyJwk = await exportKey(channelKey);
      
      // Import recipient's public key
      const recipientPublicKey = await importKey(recipientPublicKeyJwk, false);
      
      // Encrypt the symmetric key with recipient's public key
      const encryptedKey = await encryptWithPublicKey(
        JSON.stringify(symmetricKeyJwk),
        recipientPublicKey
      );
      
      return encryptedKey;
    } catch (error) {
      console.error('Error sharing channel key:', error);
      throw error;
    }
  };
  
  // Import a shared channel key
  const importSharedChannelKey = async (
    encryptedKey: string,
    channelId: string
  ): Promise<boolean> => {
    try {
      if (!authState.user) {
        throw new Error('User not authenticated');
      }
      
      // Get the user's private key
      const privateKeyJwk = await getPrivateKey();
      if (!privateKeyJwk) {
        throw new Error('Private key not available');
      }
      
      // Import the private key
      const privateKey = await importKey(privateKeyJwk, true);
      
      // Decrypt the symmetric key
      const decryptedKeyJwk = await decryptWithPrivateKey(encryptedKey, privateKey);
      
      // Create the key reference
      const keyReference: EncryptionKeyReference = {
        id: `key-${channelId}-${authState.user.id}`,
        ownerUserId: authState.user.id,
        encryptedKey,
        keyType: 'channel',
        associatedId: channelId,
        createdAt: new Date(),
      };
      
      // Store the encrypted key reference
      await storeData(
        `key-${authState.user.id}.json`,
        JSON.stringify(keyReference),
        `${StoragePaths.ENCRYPTION}/${channelId}`
      );
      
      // Import the symmetric key to cache
      const symmetricKey = await importSymmetricKey(JSON.parse(decryptedKeyJwk));
      channelKeysCache[channelId] = symmetricKey;
      
      return true;
    } catch (error) {
      console.error('Error importing shared channel key:', error);
      return false;
    }
  };
  
  // Encrypt a message for a channel
  const encryptMessage = async (
    message: string,
    channelId: string
  ): Promise<{ ciphertext: string; iv: string }> => {
    try {
      // Get the channel's symmetric key
      const channelKey = await getChannelKey(channelId);
      if (!channelKey) {
        throw new Error('Channel key not available');
      }
      
      // Encrypt the message
      return await encryptWithSymmetricKey(message, channelKey);
    } catch (error) {
      console.error('Error encrypting message:', error);
      throw error;
    }
  };
  
  // Decrypt a message from a channel
  const decryptMessage = async (
    ciphertext: string,
    iv: string,
    channelId: string
  ): Promise<string> => {
    try {
      // Get the channel's symmetric key
      const channelKey = await getChannelKey(channelId);
      if (!channelKey) {
        throw new Error('Channel key not available');
      }
      
      // Decrypt the message
      return await decryptWithSymmetricKey(ciphertext, iv, channelKey);
    } catch (error) {
      console.error('Error decrypting message:', error);
      throw error;
    }
  };
  
  // Encrypt a file for a channel
  const encryptFile = async (
    file: File,
    channelId: string
  ): Promise<{ encryptedData: string; iv: string; metadata: string }> => {
    try {
      // Get the channel's symmetric key
      const channelKey = await getChannelKey(channelId);
      if (!channelKey) {
        throw new Error('Channel key not available');
      }
      
      // Read the file as ArrayBuffer
      const fileBuffer = await file.arrayBuffer();
      const fileData = new Uint8Array(fileBuffer);
      
      // Create metadata
      const metadata = JSON.stringify({
        name: file.name,
        type: file.type,
        size: file.size,
      });
      
      // Encrypt the file data
      const encoder = new TextEncoder();
      const { ciphertext, iv } = await encryptWithSymmetricKey(
        String.fromCharCode.apply(null, Array.from(fileData)),
        channelKey
      );
      
      return {
        encryptedData: ciphertext,
        iv,
        metadata,
      };
    } catch (error) {
      console.error('Error encrypting file:', error);
      throw error;
    }
  };
  
  // Decrypt a file from a channel
  const decryptFile = async (
    encryptedData: string,
    iv: string,
    metadata: string,
    channelId: string
  ): Promise<Blob> => {
    try {
      // Get the channel's symmetric key
      const channelKey = await getChannelKey(channelId);
      if (!channelKey) {
        throw new Error('Channel key not available');
      }
      
      // Decrypt the file data
      const decryptedData = await decryptWithSymmetricKey(
        encryptedData,
        iv,
        channelKey
      );
      
      // Parse the metadata
      const { type } = JSON.parse(metadata);
      
      // Convert the decrypted string back to ArrayBuffer
      const binaryData = new Uint8Array(decryptedData.length);
      for (let i = 0; i < decryptedData.length; i++) {
        binaryData[i] = decryptedData.charCodeAt(i);
      }
      
      // Create a Blob from the decrypted data
      return new Blob([binaryData], { type });
    } catch (error) {
      console.error('Error decrypting file:', error);
      throw error;
    }
  };
  
  return (
    <EncryptionContext.Provider
      value={{
        encryptMessage,
        decryptMessage,
        encryptFile,
        decryptFile,
        shareChannelKey,
        importSharedChannelKey,
        generateChannelKey,
        hasChannelKey,
      }}
    >
      {children}
    </EncryptionContext.Provider>
  );
};

export const useEncryption = () => {
  const context = useContext(EncryptionContext);
  if (context === undefined) {
    throw new Error('useEncryption must be used within an EncryptionProvider');
  }
  return context;
};
