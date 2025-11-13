import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Notification, User } from '@/entities';
import { useLanguage } from '@/contexts/LanguageContext';
import { Bell, ChevronLeft, ChevronRight } from 'lucide-react';

const NotificationsCard: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const translations = {
    he: {
      title: 'התראות אחרונות',
      viewAll: 'צפה בכל ההתראות',
      noNotifications: 'אין התראות חדשות',
      markAsRead: 'סמן כנקרא'
    },
    en: {
      title: 'Recent Notifications',
      viewAll: 'View All Notifications',
      noNotifications: 'No new notifications',
      markAsRead: 'Mark as read'
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
      const currentUser = await User.me();
      const unreadNotifications = await Notification.filter(
        { recipient_email: currentUser.email, is_read: false },
        '-created_at',
        5
      );
      setNotifications(unreadNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification: any) => {
    try {
      await Notification.update(notification.id, { is_read: true });
      navigate('/notifications');
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return language === 'he' ? 'עכשיו' : 'now';
    if (diffMins < 60) return language === 'he' ? `לפני ${diffMins} דקות` : `${diffMins}m ago`;
    if (diffHours < 24) return language === 'he' ? `לפני ${diffHours} שעות` : `${diffHours}h ago`;
    if (diffDays < 7) return language === 'he' ? `לפני ${diffDays} ימים` : `${diffDays}d ago`;
    return date.toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US');
  };

  return (
    <Card className="industrial-card">
      <CardHeader className="p-3 sm:p-6 flex flex-row items-center justify-between">
        <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
          <Bell className="w-5 h-5 text-yellow-500" />
          {t.title}
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/notifications')}
          className="text-yellow-600 hover:text-yellow-700"
        >
          {t.viewAll}
          {isRTL ? (
            <ChevronLeft className="w-4 h-4 mr-1" />
          ) : (
            <ChevronRight className="w-4 h-4 ml-1" />
          )}
        </Button>
      </CardHeader>
      <CardContent className="p-3 sm:p-6 pt-0">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>{t.noNotifications}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg cursor-pointer hover:bg-yellow-100 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(notification.created_at)}
                    </p>
                  </div>
                  <div className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0 mt-1"></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationsCard;