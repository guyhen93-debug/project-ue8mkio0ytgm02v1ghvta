import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Notification, User } from '@/entities';
import { useLanguage } from '@/contexts/LanguageContext';
import { Bell, CheckCheck, Loader2, Trash2 } from 'lucide-react';
import NotificationItem from '@/components/notifications/NotificationItem';
import { toast } from '@/hooks/use-toast';

const Notifications: React.FC = () => {
  const { language } = useLanguage();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const translations = {
    he: {
      title: 'התראות',
      markAllRead: 'סמן הכל כנקרא',
      deleteAll: 'מחק הכל',
      noNotifications: 'אין התראות',
      noNotificationsDesc: 'כל ההתראות שלך יופיעו כאן',
      deleteSuccess: 'ההתראה נמחקה בהצלחה',
      deleteError: 'שגיאה במחיקת ההתראה',
      deleteAllSuccess: 'כל ההתראות נמחקו בהצלחה',
      deleteAllError: 'שגיאה במחיקת ההתראות'
    },
    en: {
      title: 'Notifications',
      markAllRead: 'Mark All as Read',
      deleteAll: 'Delete All',
      noNotifications: 'No Notifications',
      noNotificationsDesc: 'All your notifications will appear here',
      deleteSuccess: 'Notification deleted successfully',
      deleteError: 'Error deleting notification',
      deleteAllSuccess: 'All notifications deleted successfully',
      deleteAllError: 'Error deleting notifications'
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
      setUser(currentUser);

      const userNotifications = await Notification.filter(
        { recipient_email: currentUser.email },
        '-created_at',
        100
      );

      console.log('Loaded notifications:', userNotifications);
      setNotifications(userNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast({
        title: 'שגיאה',
        description: 'נכשל בטעינת ההתראות',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await Notification.update(notificationId, { is_read: true });
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.is_read);
      
      await Promise.all(
        unreadNotifications.map(n => Notification.update(n.id, { is_read: true }))
      );

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      
      toast({
        title: 'הצלחה',
        description: 'כל ההתראות סומנו כנקראו',
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast({
        title: 'שגיאה',
        description: 'נכשל בסימון ההתראות',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await Notification.delete(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      toast({
        title: t.deleteSuccess,
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: t.deleteError,
        variant: 'destructive',
      });
    }
  };

  const deleteAllNotifications = async () => {
    try {
      await Promise.all(
        notifications.map(n => Notification.delete(n.id))
      );

      setNotifications([]);
      
      toast({
        title: t.deleteAllSuccess,
      });
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      toast({
        title: t.deleteAllError,
        variant: 'destructive',
      });
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <Layout title={t.title}>
      <div className="p-3 sm:p-4 md:p-6 pb-24" dir={isRTL ? 'rtl' : 'ltr'}>
        <Card className="industrial-card">
          <CardHeader className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-6 w-6 text-gray-700" />
                <div>
                  <CardTitle className="text-lg sm:text-xl">{t.title}</CardTitle>
                  {unreadCount > 0 && (
                    <p className="text-sm text-gray-600 mt-1">
                      {unreadCount} התראות חדשות
                    </p>
                  )}
                </div>
              </div>
              
              {notifications.length > 0 && (
                <div className="flex gap-2">
                  {unreadCount > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-xs sm:text-sm"
                    >
                      <CheckCheck className="h-4 w-4 ml-2" />
                      {t.markAllRead}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={deleteAllNotifications}
                    className="text-xs sm:text-sm hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                  >
                    <Trash2 className="h-4 w-4 ml-2" />
                    {t.deleteAll}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="p-3 sm:p-6 pt-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t.noNotifications}
                </h3>
                <p className="text-gray-600">{t.noNotificationsDesc}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClick={() => !notification.is_read && markAsRead(notification.id)}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Notifications;