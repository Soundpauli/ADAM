import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for saved user in localStorage
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // In a real app, you would call an API to validate credentials
    // For demo purposes, we'll use mock data with hardcoded users
    
    // Fetch users from localStorage
    const storedUsers = localStorage.getItem('users');
    const users: User[] = storedUsers ? JSON.parse(storedUsers) : [];
    
    // Check if we have any users, if not create a default admin
    if (users.length === 0) {
      const defaultUsers: User[] = [
        {
          id: '1',
          name: 'Admin User',
          email: 'admin@example.com',
          password: 'admin123',
          role: 'admin',
        },
        {
          id: '2',
          name: 'Manager User',
          email: 'manager@example.com',
          password: 'manager123',
          role: 'manager',
        }
      ];
      
      users.push(...defaultUsers);
      localStorage.setItem('users', JSON.stringify(users));
    }
    
    // Find user with matching email and password
    const foundUser = users.find(u => u.email === email && u.password === password);
    
    if (foundUser) {
      // Remove password before storing in state for security
      const { password, ...userWithoutPassword } = foundUser;
      const secureUser = { ...userWithoutPassword, password: '' };
      
      setUser(secureUser as User);
      localStorage.setItem('currentUser', JSON.stringify(secureUser));
      return true;
    }
    
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  const updateProfile = (data: Partial<User>) => {
    if (!user) return;
    
    const updatedUser = { ...user, ...data };
    setUser(updatedUser);
    
    // Also update the user in the users array
    const storedUsers = localStorage.getItem('users');
    if (storedUsers) {
      const users: User[] = JSON.parse(storedUsers);
      const updatedUsers = users.map(u => (u.id === user.id ? { ...u, ...data } : u));
      localStorage.setItem('users', JSON.stringify(updatedUsers));
    }
    
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};