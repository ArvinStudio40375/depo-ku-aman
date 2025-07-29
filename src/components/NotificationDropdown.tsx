import React, { useState, useEffect } from 'react';
import { Bell, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  tipe: string;
  isi: string;
  dibaca: boolean;
  tanggal: string;
}

const NotificationDropdown: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      await supabase.rpc('set_config', {
        setting_name: 'app.current_user',
        setting_value: user.username
      });

      const { data, error } = await supabase
        .from('notifikasi')
        .select('*')
        .eq('user_id', user.id)
        .order('tanggal', { ascending: false })
        .limit(20);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter(notif => !notif.dibaca).length || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!user) return;

    try {
      await supabase.rpc('set_config', {
        setting_name: 'app.current_user',
        setting_value: user.username
      });

      const { error } = await supabase
        .from('notifikasi')
        .update({ dibaca: true })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, dibaca: true }
            : notif
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user || unreadCount === 0) return;

    setIsLoading(true);
    try {
      await supabase.rpc('set_config', {
        setting_name: 'app.current_user',
        setting_value: user.username
      });

      const { error } = await supabase
        .from('notifikasi')
        .update({ dibaca: true })
        .eq('user_id', user.id)
        .eq('dibaca', false);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(notif => ({ ...notif, dibaca: true }))
      );
      
      setUnreadCount(0);
      
      toast({
        title: "Berhasil",
        description: "Semua notifikasi telah ditandai sebagai dibaca",
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast({
        title: "Error",
        description: "Gagal menandai notifikasi sebagai dibaca",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Baru saja';
    } else if (diffInHours < 24) {
      return `${diffInHours} jam lalu`;
    } else {
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }
  };

  const parseNotification = (isi: string) => {
    const parts = isi.split('|');
    if (parts.length >= 2) {
      return {
        title: parts[0],
        message: parts[1]
      };
    }
    return {
      title: 'Notifikasi',
      message: isi
    };
  };

  const getNotificationIcon = (tipe: string) => {
    switch (tipe) {
      case 'promo':
        return '🎉';
      case 'peringatan':
        return '⚠️';
      case 'sistem':
        return '⚙️';
      default:
        return 'ℹ️';
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Notifikasi</CardTitle>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  disabled={isLoading}
                  className="text-xs"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Tandai Semua
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[300px]">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Tidak ada notifikasi
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((notification) => {
                    const { title, message } = parseNotification(notification.isi);
                    return (
                      <div
                        key={notification.id}
                        className={`p-3 border-b cursor-pointer transition-colors hover:bg-muted/50 ${
                          !notification.dibaca ? 'bg-blue-50/50' : ''
                        }`}
                        onClick={() => !notification.dibaca && markAsRead(notification.id)}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-lg">{getNotificationIcon(notification.tipe)}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className={`text-sm font-medium truncate ${
                                !notification.dibaca ? 'text-foreground' : 'text-muted-foreground'
                              }`}>
                                {title}
                              </p>
                              {!notification.dibaca && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDate(notification.tanggal)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationDropdown;