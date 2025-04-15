import { StorageAdapter, StorageConfig, StorageError } from './storage-adapter';

/**
 * Google Drive Storage Adapter
 * Implements the StorageAdapter interface for Google Drive
 */
export class GoogleDriveAdapter implements StorageAdapter {
  private accessToken: string | null = null;
  private rootFolderId: string | null = null;
  private initialized = false;
  private folderCache: Record<string, string> = {}; // Cache folder IDs to avoid repeated lookups

  async initialize(config: StorageConfig): Promise<boolean> {
    if (config.provider !== 'google-drive') {
      throw new StorageError('Invalid provider for Google Drive adapter');
    }

    if (!config.credentials?.accessToken) {
      throw new StorageError('Google Drive access token is required');
    }

    this.accessToken = config.credentials.accessToken;
    
    // Create root folder if needed
    if (config.rootFolder) {
      this.rootFolderId = await this.findOrCreateFolder(config.rootFolder);
    }
    
    this.initialized = true;
    return true;
  }

  async store(key: string, data: string, path?: string): Promise<string> {
    if (!this.isInitialized()) {
      throw new StorageError('Google Drive adapter not initialized');
    }

    try {
      // Determine parent folder ID
      let parentId = this.rootFolderId;
      if (path) {
        parentId = await this.findOrCreatePath(path);
      }

      // Check if file exists already (to update vs create)
      const existingFileId = await this.findFile(key, parentId);
      
      // Prepare file metadata and content
      const metadata = {
        name: key,
        mimeType: 'application/json',
        parents: existingFileId ? undefined : [parentId || 'root']
      };
      
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', new Blob([data], { type: 'application/json' }));
      
      // Upload or update file
      const method = existingFileId ? 'PATCH' : 'POST';
      const url = existingFileId 
        ? `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart` 
        : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
      
      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: form,
      });

      if (!response.ok) {
        throw new StorageError(`Failed to store file: ${response.statusText}`);
      }

      const fileData = await response.json();
      return fileData.id;
    } catch (error) {
      throw new StorageError('Error storing data in Google Drive', undefined, error);
    }
  }

  async retrieve(key: string, data: string, path?: string): Promise<string> {
    if (!this.isInitialized()) {
      throw new StorageError('Google Drive adapter not initialized');
    }

    try {
      // Determine parent folder ID
      let parentId = this.rootFolderId;
      if (path) {
        parentId = await this.findOrCreatePath(path);
      }

      // Find file ID
      const fileId = await this.findFile(key, parentId);
      if (!fileId) {
        throw new StorageError(`File not found: ${key}`);
      }
      
      // Download file content
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new StorageError(`Failed to retrieve file: ${response.statusText}`);
      }

      return await response.text();
    } catch (error) {
      throw new StorageError('Error retrieving data from Google Drive', undefined, error);
    }
  }

  async delete(key: string, data: string, path?: string): Promise<boolean> {
    if (!this.isInitialized()) {
      throw new StorageError('Google Drive adapter not initialized');
    }

    try {
      // Determine parent folder ID
      let parentId = this.rootFolderId;
      if (path) {
        parentId = await this.findOrCreatePath(path);
      }

      // Find file ID
      const fileId = await this.findFile(key, parentId);
      if (!fileId) {
        return false; // File not found, nothing to delete
      }
      
      // Delete file
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      return response.ok;
    } catch (error) {
      throw new StorageError('Error deleting data from Google Drive', undefined, error);
    }
  }

  async list(path: string): Promise<string[]> {
    if (!this.isInitialized()) {
      throw new StorageError('Google Drive adapter not initialized');
    }

    try {
      // Determine folder ID
      const folderId = await this.findOrCreatePath(path);
      
      // List files in folder
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents&fields=files(id,name)`, 
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new StorageError(`Failed to list files: ${response.statusText}`);
      }

      const data = await response.json();
      return data.files.map((file: any) => file.name);
    } catch (error) {
      throw new StorageError('Error listing data from Google Drive', undefined, error);
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getProviderName(): string {
    return 'Google Drive';
  }

  // Helper method to find or create a folder by name
  private async findOrCreateFolder(folderName: string, parentId?: string | null): Promise<string> {
    // First try to find the folder
    const query = [
      `name='${folderName}'`,
      `mimeType='application/vnd.google-apps.folder'`,
      parentId ? `'${parentId}' in parents` : `'${this.rootFolderId || 'root'}' in parents`
    ].join(' and ');

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`, 
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new StorageError(`Failed to search for folder: ${response.statusText}`);
    }

    const data = await response.json();
    
    // If folder exists, return its ID
    if (data.files.length > 0) {
      return data.files[0].id;
    }
    
    // Otherwise, create the folder
    const metadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId || this.rootFolderId || 'root'],
    };
    
    const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.accessToken}`,
      },
      body: JSON.stringify(metadata),
    });

    if (!createResponse.ok) {
      throw new StorageError(`Failed to create folder: ${createResponse.statusText}`);
    }

    const folder = await createResponse.json();
    return folder.id;
  }

  // Helper method to find a file by name in a folder
  private async findFile(fileName: string, parentId?: string | null): Promise<string | null> {
    const query = [
      `name='${fileName}'`,
      parentId ? `'${parentId}' in parents` : `'${this.rootFolderId || 'root'}' in parents`
    ].join(' and ');

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`, 
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new StorageError(`Failed to search for file: ${response.statusText}`);
    }

    const data = await response.json();
    
    return data.files.length > 0 ? data.files[0].id : null;
  }

  // Helper method to create nested paths
  private async findOrCreatePath(path: string): Promise<string> {
    // Check cache first
    if (this.folderCache[path]) {
      return this.folderCache[path];
    }

    const parts = path.split('/').filter(Boolean);
    let currentParentId = this.rootFolderId;

    for (const part of parts) {
      currentParentId = await this.findOrCreateFolder(part, currentParentId);
    }

    // Cache the result
    this.folderCache[path] = currentParentId as string;
    return currentParentId as string;
  }
}
