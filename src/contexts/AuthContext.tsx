import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  username: string;
  saldo_tabungan: number;
  saldo_deposito: number;
}

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  login: (username: string, pin: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateBalance: (saldo_tabungan: number, saldo_deposito: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const login = async (username: string, pin: string): Promise<boolean> => {
    try {
      // Check for admin login
      if (username === 'admin' && pin === '112233') {
        setIsAdmin(true);
        localStorage.setItem('isAdmin', 'true');
        return true;
      }

      // Get users from localStorage
      const storedUsers = localStorage.getItem('users');
      let users = [];
      
      if (storedUsers) {
        users = JSON.parse(storedUsers);
      } else {
        // Initialize with default users if none exist
        users = [
          {
            id: '1',
            username: 'Siti Aminah',
            pin: '112233',
            saldo_tabungan: 1100000,
            saldo_deposito: 245300000
          },
          {
            id: '2',
            username: 'Budi Santoso',
            pin: '123456',
            saldo_tabungan: 3000000,
            saldo_deposito: 1500000
          }
        ];
        localStorage.setItem('users', JSON.stringify(users));
      }

      // Find user with matching credentials
      const user = users.find((u: any) => u.username === username && u.pin === pin);
      
      if (!user) {
        console.log('User not found or wrong credentials');
        return false;
      }

      setUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setIsAdmin(false);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isAdmin');
  };

  const refreshUser = async () => {
    if (!user) return;

    try {
      const storedUsers = localStorage.getItem('users');
      if (!storedUsers) return;

      const users = JSON.parse(storedUsers);
      const updatedUser = users.find((u: any) => u.id === user.id);
      
      if (updatedUser) {
        setUser(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  };

  const updateBalance = async (saldo_tabungan: number, saldo_deposito: number) => {
    if (!user) return;

    try {
      const storedUsers = localStorage.getItem('users');
      if (!storedUsers) return;

      const users = JSON.parse(storedUsers);
      const userIndex = users.findIndex((u: any) => u.id === user.id);
      
      if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], saldo_tabungan, saldo_deposito };
        localStorage.setItem('users', JSON.stringify(users));
        await refreshUser();
      }
    } catch (error) {
      console.error('Update balance error:', error);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    const storedAdmin = localStorage.getItem('isAdmin');
    
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    if (storedAdmin) {
      setIsAdmin(true);
    }
  }, []);

  const contextValue: AuthContextType = {
    user,
    isAdmin,
    login,
    logout,
    refreshUser,
    updateBalance
  };

  return (
    <AuthContext.Provider value={contextValue}>
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