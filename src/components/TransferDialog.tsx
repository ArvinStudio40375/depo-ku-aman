import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface TransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TransferData {
  nominal: string;
  nomorRekening: string;
  bankTujuan: string;
  namaPemilik: string;
}

const INDONESIAN_BANKS = [
  'Bank Mandiri',
  'Bank Central Asia (BCA)',
  'Bank Negara Indonesia (BNI)',
  'Bank Rakyat Indonesia (BRI)',
  'Bank Tabungan Negara (BTN)',
  'Bank Danamon',
  'Bank CIMB Niaga',
  'Bank Permata',
  'Bank Maybank Indonesia',
  'Bank OCBC NISP',
  'Bank Panin',
  'Bank Mega',
  'Bank Bukopin',
  'Bank Sinarmas',
  'Bank UOB Indonesia'
];

const LOADING_STAGES = [
  'Mempersiapkan Transfer',
  'Memuat Data Transfer',
  'Menghubungkan Ke Server Data Bank',
  'Mengalihkan Data',
  'Memeriksa Persyaratan',
  'Menunggu Konfirmasi Data Server',
  'Meminta Izin Server'
];

export const TransferDialog: React.FC<TransferDialogProps> = ({ open, onOpenChange }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<'form' | 'preview' | 'pin' | 'loading' | 'invoice' | 'failed'>('form');
  const [transferData, setTransferData] = useState<TransferData>({
    nominal: '',
    nomorRekening: '',
    bankTujuan: '',
    namaPemilik: ''
  });
  const [pin, setPin] = useState('');
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState(0);
  const [transferSuccess, setTransferSuccess] = useState(false);

  const formatCurrency = (value: string) => {
    const number = value.replace(/\D/g, '');
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(parseInt(number) || 0);
  };

  const handleNominalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setTransferData(prev => ({ ...prev, nominal: value }));
  };

  const handleContinue = () => {
    if (!transferData.nominal || !transferData.nomorRekening || !transferData.bankTujuan || !transferData.namaPemilik) {
      toast({
        title: "Error",
        description: "Semua field harus diisi",
        variant: "destructive",
      });
      return;
    }
    setStep('preview');
  };

  const handleConfirm = () => {
    setStep('pin');
  };

  const handlePinSubmit = () => {
    if (pin !== '112233') {
      toast({
        title: "PIN Salah",
        description: "Nomor Pin Yang Dimasukan Salah Silahkan Coba Lagi Dengan Nomor PIN Yang Benar dan Sah",
        variant: "destructive",
      });
      setPin('');
      return;
    }
    
    setStep('loading');
    setProgress(0);
    setCurrentStage(0);
    
    // Start loading animation
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + (100 / 60); // 60 seconds total
        
        // Update stage based on progress
        const stageIndex = Math.floor((newProgress / 100) * LOADING_STAGES.length);
        setCurrentStage(Math.min(stageIndex, LOADING_STAGES.length - 1));
        
        if (newProgress >= 100) {
          clearInterval(interval);
          
          // Check balance requirement
          if (!user) return 100;
          
          const requiredSavings = user.saldo_deposito * 0.015;
          const hasEnoughBalance = user.saldo_tabungan >= requiredSavings;
          
          setTimeout(() => {
            if (hasEnoughBalance) {
              setTransferSuccess(true);
              setStep('invoice');
            } else {
              setStep('failed');
            }
          }, 500);
          
          return 100;
        }
        
        return newProgress;
      });
    }, 1000);
  };

  const resetDialog = () => {
    setStep('form');
    setTransferData({
      nominal: '',
      nomorRekening: '',
      bankTujuan: '',
      namaPemilik: ''
    });
    setPin('');
    setProgress(0);
    setCurrentStage(0);
    setTransferSuccess(false);
  };

  const handleClose = () => {
    resetDialog();
    onOpenChange(false);
  };

  const getRequiredAmount = () => {
    if (!user) return 0;
    const requiredSavings = user.saldo_deposito * 0.015;
    return Math.max(0, requiredSavings - user.saldo_tabungan);
  };

  const formatCurrencyDisplay = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 'form' && 'Transfer Dana'}
            {step === 'preview' && 'Konfirmasi Transfer'}
            {step === 'pin' && 'Masukkan PIN Transaksi'}
            {step === 'loading' && 'Memproses Transfer'}
            {step === 'invoice' && 'Transfer Berhasil'}
            {step === 'failed' && 'Transfer Gagal'}
          </DialogTitle>
        </DialogHeader>

        {step === 'form' && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nominal Transfer</label>
              <Input
                placeholder="Rp 0"
                value={transferData.nominal ? formatCurrency(transferData.nominal) : ''}
                onChange={handleNominalChange}
                className="mt-1"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Nomor Rekening Tujuan</label>
              <Input
                type="number"
                placeholder="Masukkan nomor rekening"
                value={transferData.nomorRekening}
                onChange={(e) => setTransferData(prev => ({ ...prev, nomorRekening: e.target.value }))}
                className="mt-1"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Bank Tujuan</label>
              <Select value={transferData.bankTujuan} onValueChange={(value) => setTransferData(prev => ({ ...prev, bankTujuan: value }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Pilih bank tujuan" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg">
                  {INDONESIAN_BANKS.map((bank) => (
                    <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Nama Pemilik Rekening</label>
              <Input
                placeholder="Masukkan nama pemilik rekening"
                value={transferData.namaPemilik}
                onChange={(e) => setTransferData(prev => ({ ...prev, namaPemilik: e.target.value }))}
                className="mt-1"
              />
            </div>
            
            <Button 
              onClick={handleContinue}
              className="w-full bg-bri-blue hover:bg-bri-dark-blue text-white"
            >
              Lanjutkan
            </Button>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Nominal Transfer:</span>
                <span className="font-medium">{formatCurrency(transferData.nominal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Rekening Tujuan:</span>
                <span className="font-medium">{transferData.nomorRekening}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Bank Tujuan:</span>
                <span className="font-medium">{transferData.bankTujuan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Nama Pemilik:</span>
                <span className="font-medium">{transferData.namaPemilik}</span>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setStep('form')}
                className="flex-1"
              >
                Kembali
              </Button>
              <Button 
                onClick={handleConfirm}
                className="flex-1 bg-bri-blue hover:bg-bri-dark-blue text-white"
              >
                Konfirmasi
              </Button>
            </div>
          </div>
        )}

        {step === 'pin' && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">PIN Transaksi</label>
              <Input
                type="password"
                placeholder="Masukkan PIN transaksi"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="mt-1"
                maxLength={6}
              />
            </div>
            
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setStep('preview')}
                className="flex-1"
              >
                Kembali
              </Button>
              <Button 
                onClick={handlePinSubmit}
                className="flex-1 bg-bri-blue hover:bg-bri-dark-blue text-white"
              >
                Proses Transfer
              </Button>
            </div>
          </div>
        )}

        {step === 'loading' && (
          <div className="space-y-6 text-center">
            <div className="space-y-2">
              <Progress value={progress} className="w-full h-3" />
              <p className="text-sm text-gray-600">{Math.round(progress)}%</p>
            </div>
            
            <div className="space-y-1">
              <p className="font-medium">{LOADING_STAGES[currentStage]}</p>
              <p className="text-sm text-gray-500">Mohon tunggu sebentar...</p>
            </div>
          </div>
        )}

        {step === 'invoice' && (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <h3 className="text-lg font-semibold text-green-600">Transfer Berhasil</h3>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Nominal:</span>
                <span className="font-medium">{formatCurrency(transferData.nominal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Ke Rekening:</span>
                <span className="font-medium">{transferData.nomorRekening}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Bank:</span>
                <span className="font-medium">{transferData.bankTujuan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Penerima:</span>
                <span className="font-medium">{transferData.namaPemilik}</span>
              </div>
              <hr />
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Status:</span>
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <span className="font-medium text-orange-500">Pending</span>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={handleClose}
              className="w-full bg-bri-blue hover:bg-bri-dark-blue text-white"
            >
              Selesai
            </Button>
          </div>
        )}

        {step === 'failed' && (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
              <h3 className="text-lg font-semibold text-red-600">Transfer Gagal</h3>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-red-700 mb-3">
                Maaf Transfer Gagal Dikarenakan Saldo Tabungan Anda Kurang Dari 1,5% Dari Saldo Deposito anda, 
                Maka Sebelum Transfer Pastikan Anda Memiliki Saldo Yang Pas Atau Lebih dari 1,5% Dari Total Saldo Deposito anda.
              </p>
              <p className="text-sm font-medium text-red-700">
                Kekurangan saldo: {formatCurrencyDisplay(getRequiredAmount())}
              </p>
            </div>
            
            <Button 
              onClick={handleClose}
              className="w-full bg-bri-blue hover:bg-bri-dark-blue text-white"
            >
              Tutup
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};