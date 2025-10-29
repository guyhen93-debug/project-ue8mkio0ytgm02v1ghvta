import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  role: 'client' | 'manager';
  language: 'en' | 'he';
}

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demo
const mockUsers = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john@construction.com',
    phone: '+972-50-1234567',
    company: 'Smith Construction Ltd.',
    role: 'client' as const,
    language: 'en' as const,
    password: 'client123'
  },
  {
    id: '2',
    name: 'Ahmed Hassan',
    email: 'ahmed@buildco.com',
    phone: '+972-52-7654321',
    company: 'BuildCo Industries',
    role: 'client' as const,
    language: 'en' as const,
    password: 'client123'
  },
  {
    id: '3',
    name: 'דוד כהן',
    email: 'david@piternoufi.com',
    phone: '+972-54-9876543',
    company: 'Piter Noufi Ltd.',
    role: 'manager' as const,
    language: 'he' as const,
    password: 'manager123'
  }
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      // Check for stored user session
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      }
    } catch (error) {
      console.error('Error loading stored user:', error);
      localStorage.removeItem('currentUser');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const foundUser = mockUsers.find(u => u.email === email && u.password === password);
      
      if (foundUser) {
        const authUser: AuthUser = {
          id: foundUser.id,
          name: foundUser.name,
          email: foundUser.email,
          phone: foundUser.phone,
          company: foundUser.company,
          role: foundUser.role,
          language: foundUser.language
        };
        
        setUser(authUser);
        localStorage.setItem('currentUser', JSON.stringify(authUser));
        
        // Small delay to show success message before redirect
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
        
        return true;
      }
      
      setIsLoading(false);
      return false;
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
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