import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AddBalanceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddBalanceDialog: React.FC<AddBalanceDialogProps> = ({ isOpen, onClose, onSuccess }) => {
  const [selectedUser, setSelectedUser] = useState('');
  const [amount, setAmount] = useState('');
  const [balanceType, setBalanceType] = useState<'tabungan' | 'deposito'>('tabungan');
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      await supabase.rpc('set_config', {
        setting_name: 'app.user_role',
        setting_value: 'admin'
      });

      const { data, error } = await supabase
        .from('users')
        .select('id, username')
        .order('username', { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Gagal memuat daftar pengguna",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !amount) return;

    setIsLoading(true);
    try {
      await supabase.rpc('set_config', {
        setting_name: 'app.user_role',
        setting_value: 'admin'
      });

      const amountValue = parseInt(amount.replace(/\D/g, ''));
      const field = balanceType === 'tabungan' ? 'saldo_tabungan' : 'saldo_deposito';
      
      const { data: currentUser } = await supabase
        .from('users')
        .select(field)
        .eq('id', selectedUser)
        .single();

      const currentAmount = currentUser?.[field] || 0;
      const newAmount = currentAmount + amountValue;

      const { error } = await supabase
        .from('users')
        .update({ [field]: newAmount })
        .eq('id', selectedUser);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: `Saldo ${balanceType} berhasil ditambahkan`,
      });

      setSelectedUser('');
      setAmount('');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding balance:', error);
      toast({
        title: "Error",
        description: "Gagal menambahkan saldo",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: string) => {
    const number = value.replace(/\D/g, '');
    return new Intl.NumberFormat('id-ID').format(parseInt(number) || 0);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value);
    setAmount(formatted);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah Saldo</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="user">Pilih Pengguna</Label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih pengguna..." />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="balanceType">Jenis Saldo</Label>
            <Select value={balanceType} onValueChange={(value: 'tabungan' | 'deposito') => setBalanceType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tabungan">Saldo Tabungan</SelectItem>
                <SelectItem value="deposito">Saldo Deposito</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="amount">Jumlah</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                Rp
              </span>
              <Input
                id="amount"
                value={amount}
                onChange={handleAmountChange}
                placeholder="0"
                className="pl-8"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={isLoading || !selectedUser || !amount}>
              {isLoading ? 'Memproses...' : 'Tambah Saldo'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddBalanceDialog;