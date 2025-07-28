import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LoginPage from '@/components/LoginPage';
import Dashboard from '@/components/Dashboard';

const Index = () => {
  const { user } = useAuth();

  if (user) {
    return <Dashboard />;
  }

  return <LoginPage />;
};

export default Index;
