import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/entities';

interface AuthContextType {
  user: any;
  loading: boolean;
  isManager: boolean;
  error: string | null;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  retry: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const loadUser = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading user...');
      const currentUser = await User.me();
      console.log('User loaded successfully:', currentUser);
      
      setUser(currentUser);
      setError(null);
    } catch (error: any) {
      console.error('Error loading user:', error);
      
      // Check if it's an authentication error (user not logged in)
      // This includes 401, Unauthorized, and "Failed to fetch" errors
      const isAuthError = 
        error?.message?.includes('401') || 
        error?.message?.includes('Unauthorized') ||
        error?.message?.includes('Failed to fetch');
      
      if (isAuthError) {
        console.log('User not authenticated, this is normal');
        setUser(null);
        setError(null); // Don't show error for not being logged in
      } else {
        // For other unexpected errors, set error state
        console.error('Unexpected error loading user:', error);
        setError(error?.message || 'Failed to load user');
        setUser(null);
        
        // Auto retry once after 3 seconds for unexpected errors
        if (retryCount === 0) {
          console.log('Will retry loading user in 3 seconds...');
          setTimeout(() => {
            setRetryCount(1);
          }, 3000);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, [retryCount]);

  const logout = async () => {
    try {
      console.log('Logging out...');
      await User.logout();
      setUser(null);
      setError(null);
      console.log('Logged out successfully');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const refreshUser = async () => {
    console.log('Refreshing user...');
    await loadUser();
  };

  const retry = () => {
    console.log('Manual retry triggered');
    setRetryCount(prev => prev + 1);
  };

  const isManager = user?.role === 'manager' || user?.role === 'administrator';

  return (
    <AuthContext.Provider value={{ user, loading, isManager, error, logout, refreshUser, retry }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};