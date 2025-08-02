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

      // Set session configuration for RLS
      await supabase.rpc('set_config', {
        setting_name: 'app.current_user',
        setting_value: username
      });

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('pin', pin)
        .single();

      if (error || !data) {
        return false;
      }

      setUser(data);
      localStorage.setItem('currentUser', JSON.stringify(data));
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
      await supabase.rpc('set_config', {
        setting_name: 'app.current_user',
        setting_value: user.username
      });

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', user.username)
        .single();

      if (data && !error) {
        setUser(data);
        localStorage.setItem('currentUser', JSON.stringify(data));
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  };

  const updateBalance = async (saldo_tabungan: number, saldo_deposito: number) => {
    if (!user) return;

    try {
      await supabase.rpc('set_config', {
        setting_name: 'app.current_user',
        setting_value: user.username
      });

      const { error } = await supabase
        .from('users')
        .update({ saldo_tabungan, saldo_deposito })
        .eq('id', user.id);

      if (!error) {
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