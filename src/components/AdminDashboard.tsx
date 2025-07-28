import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserData {
  id: string;
  username: string;
  saldo_tabungan: number;
  saldo_deposito: number;
  created_at: string;
}

const AdminDashboard: React.FC = () => {
  const { logout } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter(user =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [users, searchTerm]);

  const fetchUsers = async () => {
    try {
      await supabase.rpc('set_config', {
        setting_name: 'app.user_role',
        setting_value: 'admin'
      });

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data pengguna",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getTotalSaldoTabungan = () => {
    return users.reduce((total, user) => total + user.saldo_tabungan, 0);
  };

  const getTotalSaldoDeposito = () => {
    return users.reduce((total, user) => total + user.saldo_deposito, 0);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAdmin');
    logout();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bri-blue mx-auto mb-4"></div>
          <p>Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-bri-blue text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
            <p className="text-sm opacity-90">Deposit BRI - Panel Admin</p>
          </div>
          <Button 
            variant="ghost" 
            onClick={handleLogout}
            className="text-white hover:bg-white/20"
          >
            Keluar
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Pengguna
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-bri-blue">
                {users.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Saldo Tabungan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-income">
                {formatCurrency(getTotalSaldoTabungan())}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Saldo Deposito
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-bri-orange">
                {formatCurrency(getTotalSaldoDeposito())}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle>Cari Pengguna</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Cari berdasarkan nama pengguna..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Data Pengguna ({filteredUsers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Username</th>
                    <th className="text-right p-3 font-medium">Saldo Tabungan</th>
                    <th className="text-right p-3 font-medium">Saldo Deposito</th>
                    <th className="text-right p-3 font-medium">Total Saldo</th>
                    <th className="text-left p-3 font-medium">Tanggal Daftar</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-muted/50">
                      <td className="p-3 font-medium">{user.username}</td>
                      <td className="p-3 text-right text-income">
                        {formatCurrency(user.saldo_tabungan)}
                      </td>
                      <td className="p-3 text-right text-bri-orange">
                        {formatCurrency(user.saldo_deposito)}
                      </td>
                      <td className="p-3 text-right font-semibold">
                        {formatCurrency(user.saldo_tabungan + user.saldo_deposito)}
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {formatDate(user.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredUsers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? 'Tidak ada pengguna yang ditemukan.' : 'Belum ada data pengguna.'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;