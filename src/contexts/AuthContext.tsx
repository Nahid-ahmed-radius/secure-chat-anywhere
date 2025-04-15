
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthState, User } from '@/types';
import { generateKeyPair, exportKey } from '@/lib/crypto';

// Default auth state
const defaultAuthState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
};

// Create context
const AuthContext = createContext<{
  authState: AuthState;
  login: (email: string, password: string) => Promise<boolean>;
  signUp: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUserProfile: (userData: Partial<User>) => Promise<boolean>;
  generateUserKeys: () => Promise<JsonWebKey | undefined>;
  getPrivateKey: () => Promise<JsonWebKey | undefined>;
}>({
  authState: defaultAuthState,
  login: async () => false,
  signUp: async () => false,
  logout: () => {},
  updateUserProfile: async () => false,
  generateUserKeys: async () => undefined,
  getPrivateKey: async () => undefined,
});

// Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>(defaultAuthState);
  
  // On mount, check if user is already logged in (from local storage)
  useEffect(() => {
    const checkAuthState = async () => {
      try {
        // In a real app, we'd check with the server or a JWT token
        const savedUser = localStorage.getItem('user');
        const privateKey = localStorage.getItem('privateKey');
        
        if (savedUser) {
          setAuthState({
            user: JSON.parse(savedUser),
            isAuthenticated: true,
            isLoading: false,
            privateKeyJwk: privateKey ? JSON.parse(privateKey) : undefined,
          });
        } else {
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } catch (error) {
        console.error('Error checking auth state:', error);
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'Failed to restore session',
        });
      }
    };
    
    checkAuthState();
  }, []);
  
  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      // In a real app, this would be an API call to authenticate
      // For demo purposes, we'll just mock successful login
      const mockUser: User = {
        id: 'user-' + Math.random().toString(36).substring(2, 9),
        name: email.split('@')[0],
        email,
        online: true,
        lastSeen: new Date(),
      };
      
      // Check if we have keys for this user, if not generate them
      let privateKey = localStorage.getItem(`privateKey-${mockUser.id}`);
      let publicKey;
      
      if (!privateKey) {
        const keys = await generateKeyPair();
        const privateKeyJwk = await exportKey(keys.privateKey);
        const publicKeyJwk = await exportKey(keys.publicKey);
        
        localStorage.setItem(`privateKey-${mockUser.id}`, JSON.stringify(privateKeyJwk));
        privateKey = JSON.stringify(privateKeyJwk);
        publicKey = JSON.stringify(publicKeyJwk);
        
        // In a real app, we'd send the public key to the server
        mockUser.publicKey = publicKey;
      }
      
      // Save to localStorage for persistence
      localStorage.setItem('user', JSON.stringify(mockUser));
      localStorage.setItem('privateKey', privateKey);
      
      setAuthState({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
        privateKeyJwk: JSON.parse(privateKey),
      });
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Login failed',
      });
      return false;
    }
  };
  
  // Sign-up function
  const signUp = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      // In a real app, this would be an API call to create account
      // Generate encryption keys for the new user
      const keys = await generateKeyPair();
      const privateKeyJwk = await exportKey(keys.privateKey);
      const publicKeyJwk = await exportKey(keys.publicKey);
      
      const newUser: User = {
        id: 'user-' + Math.random().toString(36).substring(2, 9),
        name,
        email,
        publicKey: JSON.stringify(publicKeyJwk),
        online: true,
        lastSeen: new Date(),
      };
      
      // Save to localStorage for persistence
      localStorage.setItem('user', JSON.stringify(newUser));
      localStorage.setItem('privateKey', JSON.stringify(privateKeyJwk));
      localStorage.setItem(`privateKey-${newUser.id}`, JSON.stringify(privateKeyJwk));
      
      setAuthState({
        user: newUser,
        isAuthenticated: true,
        isLoading: false,
        privateKeyJwk,
      });
      
      return true;
    } catch (error) {
      console.error('Sign-up error:', error);
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Sign-up failed',
      });
      return false;
    }
  };
  
  // Logout function
  const logout = () => {
    // Clear local auth data
    localStorage.removeItem('user');
    // Don't remove privateKey to enable persistence
    
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };
  
  // Update user profile
  const updateUserProfile = async (userData: Partial<User>): Promise<boolean> => {
    try {
      if (!authState.user) {
        return false;
      }
      
      const updatedUser = { ...authState.user, ...userData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      setAuthState(prev => ({
        ...prev,
        user: updatedUser,
      }));
      
      return true;
    } catch (error) {
      console.error('Update profile error:', error);
      return false;
    }
  };
  
  // Generate encryption keys for the user
  const generateUserKeys = async (): Promise<JsonWebKey | undefined> => {
    try {
      if (!authState.user) {
        return undefined;
      }
      
      const keys = await generateKeyPair();
      const privateKeyJwk = await exportKey(keys.privateKey);
      const publicKeyJwk = await exportKey(keys.publicKey);
      
      // Save private key locally
      localStorage.setItem('privateKey', JSON.stringify(privateKeyJwk));
      localStorage.setItem(`privateKey-${authState.user.id}`, JSON.stringify(privateKeyJwk));
      
      // Update user with public key
      const updatedUser = {
        ...authState.user,
        publicKey: JSON.stringify(publicKeyJwk),
      };
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      setAuthState(prev => ({
        ...prev,
        user: updatedUser,
        privateKeyJwk,
      }));
      
      return publicKeyJwk;
    } catch (error) {
      console.error('Generate keys error:', error);
      return undefined;
    }
  };
  
  // Get private key for decryption
  const getPrivateKey = async (): Promise<JsonWebKey | undefined> => {
    if (!authState.user) {
      return undefined;
    }
    
    const privateKey = authState.privateKeyJwk || 
      JSON.parse(localStorage.getItem(`privateKey-${authState.user.id}`) || 'null');
    
    return privateKey;
  };
  
  return (
    <AuthContext.Provider 
      value={{ 
        authState, 
        login, 
        signUp, 
        logout, 
        updateUserProfile,
        generateUserKeys,
        getPrivateKey,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
