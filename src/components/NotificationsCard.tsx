import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Notification, User } from '@/entities';
import { useLanguage } from '@/contexts/LanguageContext';
import { Bell, AlertCircle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import NotificationItem from './notifications/NotificationItem';

const NotificationsCard: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { language } = useLanguage();
  const navigate = useNavigate();

  const translations = {
    he: {
      title: 'התראות אחרונות',
      viewAll: 'צפה בכל ההתראות',
      noNotifications: 'אין התראות חדשות',
      error: 'שגיאה בטעינת התראות',
      retry: 'נסה שוב'
    },
    en: {
      title: 'Recent Notifications',
      viewAll: 'View All Notifications',
      noNotifications: 'No new notifications',
      error: 'Error loading notifications',
      retry: 'Retry'
    }
  };

  const t = translations[language];

  useEffect(() => {
    loadNotifications();
  }, [retryCount]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get current user with timeout
      let currentUser;
      try {
        const userTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('User request timeout')), 10000)
        );
        
        const userPromise = User.me();
        currentUser = await Promise.race([userPromise, userTimeoutPromise]);
      } catch (userError) {
        console.error('Error getting user:', userError);
        setNotifications([]);
        setLoading(false);
        return;
      }

      if (!currentUser || !currentUser.email) {
        console.log('No user found or user has no email');
        setNotifications([]);
        setLoading(false);
        return;
      }

      // Get notifications with separate timeout
      try {
        const notificationsTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Notifications request timeout')), 10000)
        );
        
        const notificationsPromise = Notification.filter(
          { recipient_email: currentUser.email },
          '-created_at',
          5
        );
        
        const userNotifications = await Promise.race([notificationsPromise, notificationsTimeoutPromise]);
        setNotifications(userNotifications || []);
      } catch (notifError) {
        console.error('Error loading notifications:', notifError);
        // Don't show error to user, just set empty array
        setNotifications([]);
      }
    } catch (error) {
      console.error('Unexpected error in loadNotifications:', error);
      setError(t.error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  if (loading) {
    return (
      <Card className="industrial-card">
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {t.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="industrial-card">
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {t.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
          <div className="text-center py-6">
            <AlertCircle className="h-10 w-10 mx-auto mb-3 text-red-400" />
            <p className="text-red-600 mb-3 text-sm">{error}</p>
            <Button onClick={handleRetry} variant="outline" size="sm" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              {t.retry}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="industrial-card">
      <CardHeader className="p-3 sm:p-6">
        <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
          <Bell className="h-5 w-5" />
          {t.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-6 pt-0">
        {notifications.length === 0 ? (
          <p className="text-gray-500 text-center py-6 text-sm">{t.noNotifications}</p>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onUpdate={loadNotifications}
              />
            ))}
            <Button
              variant="outline"
              className="w-full mt-3"
              onClick={() => navigate('/notifications')}
            >
              {t.viewAll}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationsCard;