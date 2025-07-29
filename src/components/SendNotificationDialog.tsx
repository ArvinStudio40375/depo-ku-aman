import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SendNotificationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const SendNotificationDialog: React.FC<SendNotificationDialogProps> = ({ isOpen, onClose, onSuccess }) => {
  const [selectedUser, setSelectedUser] = useState('');
  const [notificationType, setNotificationType] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
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
    if (!selectedUser || !notificationType || !title || !message) return;

    setIsLoading(true);
    try {
      await supabase.rpc('set_config', {
        setting_name: 'app.user_role',
        setting_value: 'admin'
      });

      const { error } = await supabase
        .from('notifikasi')
        .insert({
          user_id: selectedUser,
          tipe: notificationType,
          isi: `${title}|${message}`,
        });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Notifikasi berhasil dikirim",
      });

      setSelectedUser('');
      setNotificationType('');
      setTitle('');
      setMessage('');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error sending notification:', error);
      toast({
        title: "Error",
        description: "Gagal mengirim notifikasi",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Kirim Notifikasi</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="user">Pilih Pengguna</Label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih pengguna..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Pengguna</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="type">Jenis Notifikasi</Label>
            <Select value={notificationType} onValueChange={setNotificationType}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih jenis..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">Informasi</SelectItem>
                <SelectItem value="promo">Promosi</SelectItem>
                <SelectItem value="peringatan">Peringatan</SelectItem>
                <SelectItem value="sistem">Sistem</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="title">Judul</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Masukkan judul notifikasi"
              required
            />
          </div>

          <div>
            <Label htmlFor="message">Pesan</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Masukkan isi pesan"
              rows={4}
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={isLoading || !selectedUser || !notificationType || !title || !message}>
              {isLoading ? 'Mengirim...' : 'Kirim Notifikasi'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SendNotificationDialog;