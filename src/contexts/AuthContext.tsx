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
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );
      
      const userPromise = User.me();
      const currentUser = await Promise.race([userPromise, timeoutPromise]);
      
      setUser(currentUser);
    } catch (error) {
      console.error('Error loading user:', error);
      setError(error?.message || 'Failed to load user');
      setUser(null);
      
      // Auto retry once after 2 seconds
      if (retryCount === 0) {
        setTimeout(() => {
          setRetryCount(1);
        }, 2000);
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
      await User.logout();
      setUser(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const refreshUser = async () => {
    await loadUser();
  };

  const retry = () => {
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