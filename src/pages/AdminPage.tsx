import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AdminDashboard from '@/components/AdminDashboard';
import { useNavigate } from 'react-router-dom';

const AdminPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const storedAdmin = localStorage.getItem('isAdmin');
    if (!storedAdmin) {
      navigate('/');
    }
  }, [navigate]);

  if (!localStorage.getItem('isAdmin')) {
    return null;
  }

  return <AdminDashboard />;
};

export default AdminPage;