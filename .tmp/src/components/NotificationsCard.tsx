import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Notification, User } from '@/entities';
import { useLanguage } from '@/contexts/LanguageContext';
import { Bell, AlertCircle, RefreshCw, ChevronRight, Inbox } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import NotificationItem from './notifications/NotificationItem';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const NotificationsCard: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { language } = useLanguage();
  const navigate = useNavigate();

  const translations = {
    he: {
      title: 'התראות אחרונות',
      viewAll: 'צפה בכל ההתראות',
      noNotifications: 'אין התראות חדשות',
      error: 'שגיאה בטעינת התראות',
      retry: 'נסה שוב',
      unreadText: 'התראות חדשות'
    },
    en: {
      title: 'Recent Notifications',
      viewAll: 'View All Notifications',
      noNotifications: 'No new notifications',
      error: 'Error loading notifications',
      retry: 'Retry',
      unreadText: 'new notifications'
    }
  };

  const t = translations[language];
  const isRTL = language === 'he';

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const currentUser = await User.me();
      if (!currentUser?.email) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      // Load recent 3 notifications
      const userNotifications = await Notification.filter(
        { recipient_email: currentUser.email },
        '-created_at',
        3
      );

      // Load total unread count
      const allUnread = await Notification.filter(
        { recipient_email: currentUser.email, is_read: false },
        '-created_at',
        100
      );
      
      setNotifications(userNotifications || []);
      setUnreadCount(allUnread?.length || 0);
    } catch (error) {
      console.error('Error loading notifications summary:', error);
      // Fail silently for dashboard
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="industrial-card overflow-hidden">
        <CardHeader className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center justify-between">
            <div className="h-6 w-32 bg-gray-200 animate-pulse rounded"></div>
            <div className="h-5 w-5 bg-gray-200 animate-pulse rounded-full"></div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-4 p-4">
            <div className="h-10 bg-gray-100 animate-pulse rounded"></div>
            <div className="h-10 bg-gray-100 animate-pulse rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="industrial-card overflow-hidden flex flex-col h-full">
      <CardHeader className="p-4 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Bell className="h-4 w-4 text-yellow-600" />
            {t.title}
          </CardTitle>
          {unreadCount > 0 && (
            <Badge className="bg-red-500 text-white border-none text-[10px] h-5 min-w-[1.25rem] flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-0 flex-1">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <Inbox className="h-10 w-10 text-gray-200 mb-2" />
            <p className="text-gray-400 text-xs">{t.noNotifications}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                condensed={true}
                onClick={() => navigate('/notifications')}
              />
            ))}
          </div>
        )}
      </CardContent>

      <div className="p-3 bg-white border-t border-gray-100 mt-auto">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-between text-xs text-blue-600 hover:bg-blue-50 h-8"
          onClick={() => navigate('/notifications')}
        >
          <span>{t.viewAll}</span>
          <ChevronRight className={`h-3 w-3 ${isRTL ? 'rotate-180' : ''}`} />
        </Button>
      </div>
    </Card>
  );
};

export default NotificationsCard;
