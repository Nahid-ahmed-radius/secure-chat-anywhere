
/**
 * Core types used throughout the application
 */

// User type
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  publicKey?: string; // JWK format of public key for E2EE
  online: boolean;
  lastSeen?: Date;
}

// Message type
export interface Message {
  id: string;
  content: string; // Encrypted content
  iv?: string; // Initialization vector for AES-GCM
  senderId: string;
  senderName: string;
  timestamp: Date;
  channelId: string;
  parentId?: string; // For thread replies
  edited?: boolean;
  reactions?: Reaction[];
  attachments?: Attachment[];
  mentions?: string[]; // User IDs that were mentioned
  replyCount?: number; // Number of replies if this is a thread parent
}

// Reaction type
export interface Reaction {
  emoji: string;
  userId: string;
  userName: string;
}

// Attachment type
export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string; // Storage reference
  iv?: string; // For encrypted attachments
}

// Channel type
export interface Channel {
  id: string;
  name: string;
  description?: string;
  isPrivate: boolean;
  members: string[]; // User IDs
  createdBy: string;
  createdAt: Date;
  encryptionKeyId?: string; // Reference to the channel's encryption key
  lastMessage?: Message;
  pinnedMessages?: string[]; // Message IDs
}

// Direct message channel type
export interface DirectChannel {
  id: string;
  participants: User[];
  lastMessage?: Message;
  createdAt: Date;
  encryptionKeyId?: string; // Reference to the DM's encryption key
}

// Storage configuration (saved locally or provided during setup)
export interface StorageSettings {
  provider: 'google-drive' | 'amazon-s3' | 'azure-blob' | 'dropbox' | 'local';
  credentials: any;
  rootFolder?: string;
}

// Company information
export interface CompanyInfo {
  id: string;
  name: string;
  logo?: string;
  plan: 'startup' | 'smb' | 'enterprise';
  ownerId: string; // Admin user ID
  createdAt: Date;
  storageProvider: string;
  // Billing info would be handled separately by Stripe
}

// Subscription plan tiers
export interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  features: string[];
  maxUsers: number;
  maxStorage: number; // In GB
}

// User preferences
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  soundEffects: boolean;
  markdownRendering: boolean;
  messageGrouping: boolean;
  compactMode: boolean;
}

// Auth state
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  privateKeyJwk?: JsonWebKey; // User's private key (stored locally)
  error?: string;
}

// App settings
export interface AppSettings {
  companyInfo: CompanyInfo;
  userPreferences: UserPreferences;
  storageSettings: StorageSettings;
  encryptionEnabled: boolean;
  lastSyncTimestamp?: Date;
}

// Encryption Key Reference
export interface EncryptionKeyReference {
  id: string;
  ownerUserId: string;
  encryptedKey: string; // Encrypted with owner's public key
  keyType: 'channel' | 'user';
  associatedId: string; // Channel ID or user ID
  createdAt: Date;
}
