
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { StorageAdapter, StorageConfig } from '@/lib/storage/storage-adapter';
import { StorageFactory } from '@/lib/storage/storage-factory';
import { StorageSettings } from '@/types';
import { useAuth } from './AuthContext';

interface StorageContextValue {
  storageAdapter: StorageAdapter | null;
  storageSettings: StorageSettings | null;
  isInitialized: boolean;
  error: string | null;
  configureStorage: (settings: StorageSettings) => Promise<boolean>;
  storeData: (key: string, data: string, path?: string) => Promise<string>;
  retrieveData: (key: string, path?: string) => Promise<string>;
  deleteData: (key: string, path?: string) => Promise<boolean>;
  listData: (path: string) => Promise<string[]>;
}

const StorageContext = createContext<StorageContextValue>({
  storageAdapter: null,
  storageSettings: null,
  isInitialized: false,
  error: null,
  configureStorage: async () => false,
  storeData: async () => '',
  retrieveData: async () => '',
  deleteData: async () => false,
  listData: async () => [],
});

export const StorageProvider = ({ children }: { children: ReactNode }) => {
  const [storageAdapter, setStorageAdapter] = useState<StorageAdapter | null>(null);
  const [storageSettings, setStorageSettings] = useState<StorageSettings | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { authState } = useAuth();
  
  useEffect(() => {
    // Check for storage config in local storage
    const loadStorageConfig = async () => {
      try {
        const savedSettings = localStorage.getItem('storageSettings');
        
        if (savedSettings) {
          const settings = JSON.parse(savedSettings) as StorageSettings;
          configureStorage(settings);
        }
      } catch (error) {
        console.error('Error loading storage config:', error);
        setError('Failed to load storage configuration');
      }
    };
    
    if (authState.isAuthenticated) {
      loadStorageConfig();
    }
  }, [authState.isAuthenticated]);
  
  const configureStorage = async (settings: StorageSettings): Promise<boolean> => {
    try {
      setError(null);
      
      // Map to StorageConfig
      const config: StorageConfig = {
        provider: settings.provider,
        credentials: settings.credentials,
        rootFolder: settings.rootFolder,
      };
      
      // Initialize storage adapter
      const adapter = await StorageFactory.createAdapter(config);
      
      // Save settings
      localStorage.setItem('storageSettings', JSON.stringify(settings));
      
      setStorageAdapter(adapter);
      setStorageSettings(settings);
      setIsInitialized(true);
      
      return true;
    } catch (error) {
      console.error('Error configuring storage:', error);
      setError('Failed to configure storage provider');
      return false;
    }
  };
  
  const storeData = async (key: string, data: string, path?: string): Promise<string> => {
    if (!storageAdapter || !isInitialized) {
      throw new Error('Storage adapter not initialized');
    }
    
    try {
      return await storageAdapter.store(key, data, path);
    } catch (error) {
      console.error('Error storing data:', error);
      throw error;
    }
  };
  
  const retrieveData = async (key: string, path?: string): Promise<string> => {
    if (!storageAdapter || !isInitialized) {
      throw new Error('Storage adapter not initialized');
    }
    
    try {
      return await storageAdapter.retrieve(key, path);
    } catch (error) {
      console.error('Error retrieving data:', error);
      throw error;
    }
  };
  
  const deleteData = async (key: string, path?: string): Promise<boolean> => {
    if (!storageAdapter || !isInitialized) {
      throw new Error('Storage adapter not initialized');
    }
    
    try {
      return await storageAdapter.delete(key, path);
    } catch (error) {
      console.error('Error deleting data:', error);
      throw error;
    }
  };
  
  const listData = async (path: string): Promise<string[]> => {
    if (!storageAdapter || !isInitialized) {
      throw new Error('Storage adapter not initialized');
    }
    
    try {
      return await storageAdapter.list(path);
    } catch (error) {
      console.error('Error listing data:', error);
      throw error;
    }
  };
  
  return (
    <StorageContext.Provider
      value={{
        storageAdapter,
        storageSettings,
        isInitialized,
        error,
        configureStorage,
        storeData,
        retrieveData,
        deleteData,
        listData,
      }}
    >
      {children}
    </StorageContext.Provider>
  );
};

export const useStorage = () => {
  const context = useContext(StorageContext);
  if (context === undefined) {
    throw new Error('useStorage must be used within a StorageProvider');
  }
  return context;
};
