import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await login(username, pin);
      if (success) {
        toast({
          title: "Login berhasil",
          description: "Selamat datang di Deposit BRI",
        });
      } else {
        toast({
          title: "Login gagal",
          description: "Username atau PIN salah",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat login",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-bri-blue to-bri-dark-blue flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-bri-blue rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">BRI</span>
          </div>
          <CardTitle className="text-2xl font-bold text-bri-dark-blue">
            Deposit BRI
          </CardTitle>
          <p className="text-muted-foreground">
            Masuk ke akun Anda
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">
                Username
              </label>
              <Input
                id="username"
                type="text"
                placeholder="Masukkan username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="pin" className="text-sm font-medium">
                PIN
              </label>
              <Input
                id="pin"
                type="password"
                placeholder="Masukkan PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                required
                maxLength={6}
                className="h-12"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 bg-bri-blue hover:bg-bri-dark-blue"
              disabled={isLoading}
            >
              {isLoading ? 'Masuk...' : 'Masuk'}
            </Button>
          </form>
          <div className="mt-6 p-4 bg-bri-light-blue rounded-lg">
            <p className="text-sm text-bri-dark-blue font-medium">Demo Account:</p>
            <p className="text-xs text-muted-foreground">Username: Siti Aminah</p>
            <p className="text-xs text-muted-foreground">PIN: 112233</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;