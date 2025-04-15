
import { StorageAdapter, StorageConfig } from './storage-adapter';
import { GoogleDriveAdapter } from './google-drive-adapter';
import { AmazonS3Adapter } from './amazon-s3-adapter';
import { AzureBlobAdapter } from './azure-blob-adapter';

/**
 * Factory class to create appropriate storage adapter based on configuration
 */
export class StorageFactory {
  // Create and initialize a storage adapter based on configuration
  static async createAdapter(config: StorageConfig): Promise<StorageAdapter> {
    let adapter: StorageAdapter;
    
    switch (config.provider) {
      case 'google-drive':
        adapter = new GoogleDriveAdapter();
        break;
      case 'amazon-s3':
        adapter = new AmazonS3Adapter();
        break;
      case 'azure-blob':
        adapter = new AzureBlobAdapter();
        break;
      case 'dropbox':
        // Could add Dropbox adapter in the future
        throw new Error('Dropbox adapter not implemented yet');
      case 'local':
        // Could add local storage adapter for development
        throw new Error('Local storage adapter not implemented yet');
      default:
        throw new Error(`Unknown storage provider: ${config.provider}`);
    }
    
    await adapter.initialize(config);
    return adapter;
  }
}
