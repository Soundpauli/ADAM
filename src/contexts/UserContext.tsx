import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../types';
import { useAuth } from './AuthContext';

interface UserContextType {
  users: User[];
  addUser: (userData: Omit<User, 'id'>) => void;
  updateUser: (id: string, userData: Partial<User>) => void;
  deleteUser: (id: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUsers = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUsers must be used within a UserProvider');
  }
  return context;
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    // Load users from localStorage
    const storedUsers = localStorage.getItem('users');
    if (storedUsers) {
      setUsers(JSON.parse(storedUsers));
    } else {
      // Initialize with default admin if no users exist
      const defaultAdmin: User = {
        id: uuidv4(),
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin',
      };
      
      setUsers([defaultAdmin]);
      localStorage.setItem('users', JSON.stringify([defaultAdmin]));
    }
  }, []);

  const addUser = (userData: Omit<User, 'id'>) => {
    const newUser: User = {
      ...userData,
      id: uuidv4(),
    };
    
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem('users', JSON.stringify(updatedUsers));
  };

  const updateUser = (id: string, userData: Partial<User>) => {
    const updatedUsers = users.map(user => 
      user.id === id ? { ...user, ...userData } : user
    );
    
    setUsers(updatedUsers);
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    
    // If the current user is being updated, we need to update local storage for the current user as well
    if (currentUser && currentUser.id === id) {
      const updatedCurrentUser = { ...currentUser, ...userData };
      localStorage.setItem('currentUser', JSON.stringify(updatedCurrentUser));
    }
  };

  const deleteUser = (id: string) => {
    // Prevent deleting the last admin
    const admins = users.filter(user => user.role === 'admin');
    const userToDelete = users.find(user => user.id === id);
    
    if (userToDelete?.role === 'admin' && admins.length <= 1) {
      alert('Cannot delete the last admin user');
      return;
    }
    
    // Prevent deleting the current user
    if (currentUser && currentUser.id === id) {
      alert('You cannot delete your own account while logged in');
      return;
    }
    
    const updatedUsers = users.filter(user => user.id !== id);
    setUsers(updatedUsers);
    localStorage.setItem('users', JSON.stringify(updatedUsers));
  };

  return (
    <UserContext.Provider value={{ users, addUser, updateUser, deleteUser }}>
      {children}
    </UserContext.Provider>
  );
};