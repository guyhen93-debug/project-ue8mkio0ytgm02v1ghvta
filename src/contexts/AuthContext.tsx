import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'client' | 'manager';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => Promise<void>;
}

// Initialize context with a default value to prevent undefined errors
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => null,
  logout: async () => {}
});

// Mock users for demo
const mockUsers: User[] = [
  {
    id: '1',
    email: 'client@demo.com',
    full_name: 'Demo Client',
    role: 'client'
  },
  {
    id: '2',
    email: 'manager@demo.com',
    full_name: 'Demo Manager',
    role: 'manager'
  }
];

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<User | null> => {
    // Mock authentication - in real app, this would call an API
    if (password !== 'demo123') {
      throw new Error('Invalid credentials');
    }

    const foundUser = mockUsers.find(u => u.email === email);
    if (!foundUser) {
      throw new Error('User not found');
    }

    setUser(foundUser);
    localStorage.setItem('user', JSON.stringify(foundUser));
    return foundUser;
  };

  const logout = async (): Promise<void> => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const contextValue: AuthContextType = {
    user,
    isLoading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};