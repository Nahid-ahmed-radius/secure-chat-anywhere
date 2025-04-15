
/**
 * Storage adapter interfaces for supporting multiple storage providers
 * Each storage provider must implement this interface
 */

// Generic storage adapter interface
export interface StorageAdapter {
  // Initialize the storage adapter with configuration
  initialize(config: StorageConfig): Promise<boolean>;
  
  // Store data (messages, files, etc.) with optional path
  store(key: string, data: string, path?: string): Promise<string>;
  
  // Retrieve data by key
  retrieve(key: string, path?: string): Promise<string>;
  
  // Delete data
  delete(key: string, path?: string): Promise<boolean>;
  
  // List items in a path/directory
  list(path: string): Promise<string[]>;
  
  // Check if the adapter is properly initialized
  isInitialized(): boolean;
  
  // Get storage provider name
  getProviderName(): string;
}

// Storage configuration interface
export interface StorageConfig {
  provider: 'google-drive' | 'amazon-s3' | 'azure-blob' | 'dropbox' | 'local';
  credentials: any; // Provider-specific credentials
  encryptionKey?: string; // Optional client-side encryption key
  rootFolder?: string; // Optional root folder or prefix
}

// Storage paths for organizing data
export const StoragePaths = {
  MESSAGES: 'messages',
  FILES: 'files',
  KEYS: 'keys',
  USERS: 'users',
  CHANNELS: 'channels',
  ENCRYPTION: 'encryption',
  METADATA: 'metadata'
};

// Error class for storage operations
export class StorageError extends Error {
  constructor(message: string, public code?: string, public originalError?: any) {
    super(message);
    this.name = 'StorageError';
  }
}
