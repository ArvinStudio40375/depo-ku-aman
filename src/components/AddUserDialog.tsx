import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AddUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddUserDialog: React.FC<AddUserDialogProps> = ({ isOpen, onClose, onSuccess }) => {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [saldoTabungan, setSaldoTabungan] = useState('');
  const [saldoDeposito, setSaldoDeposito] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !pin) return;

    setIsLoading(true);
    try {
      await supabase.rpc('set_config', {
        setting_name: 'app.user_role',
        setting_value: 'admin'
      });

      const { error } = await supabase
        .from('users')
        .insert({
          username,
          pin,
          saldo_tabungan: parseInt(saldoTabungan.replace(/\D/g, '')) || 0,
          saldo_deposito: parseInt(saldoDeposito.replace(/\D/g, '')) || 0,
        });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Pengguna baru berhasil ditambahkan",
      });

      setUsername('');
      setPin('');
      setSaldoTabungan('');
      setSaldoDeposito('');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding user:', error);
      toast({
        title: "Error",
        description: "Gagal menambahkan pengguna baru",
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

  const handleSaldoTabunganChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSaldoTabungan(formatCurrency(e.target.value));
  };

  const handleSaldoDepositoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSaldoDeposito(formatCurrency(e.target.value));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah Pengguna Baru</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username"
              required
            />
          </div>

          <div>
            <Label htmlFor="pin">PIN</Label>
            <Input
              id="pin"
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Masukkan PIN"
              maxLength={6}
              required
            />
          </div>

          <div>
            <Label htmlFor="saldoTabungan">Saldo Tabungan (Opsional)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                Rp
              </span>
              <Input
                id="saldoTabungan"
                value={saldoTabungan}
                onChange={handleSaldoTabunganChange}
                placeholder="0"
                className="pl-8"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="saldoDeposito">Saldo Deposito (Opsional)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                Rp
              </span>
              <Input
                id="saldoDeposito"
                value={saldoDeposito}
                onChange={handleSaldoDepositoChange}
                placeholder="0"
                className="pl-8"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={isLoading || !username || !pin}>
              {isLoading ? 'Memproses...' : 'Tambah Pengguna'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddUserDialog;