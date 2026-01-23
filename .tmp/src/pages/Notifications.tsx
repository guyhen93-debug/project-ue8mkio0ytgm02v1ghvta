import React, { useState, useEffect, useMemo } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Notification, User } from '@/entities';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, CheckCheck, Loader2, Trash2, Filter, Package, ExternalLink, ChevronRight } from 'lucide-react';
import NotificationItem from '@/components/notifications/NotificationItem';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

const Notifications: React.FC = () => {
  const { language } = useLanguage();
  const { isManager } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<'all' | 'unread'>('all');

  const translations = {
    he: {
      title: 'מרכז התראות',
      markAllRead: 'סמן הכל כנקרא',
      deleteAll: 'מחק הכל',
      noNotifications: 'אין התראות',
      noNotificationsDesc: 'כל ההתראות שלך יופיעו כאן',
      deleteSuccess: 'ההתראה נמחקה בהצלחה',
      deleteError: 'שגיאה במחיקת ההתראה',
      deleteAllSuccess: 'כל ההתראות נמחקו בהצלחה',
      deleteAllError: 'שגיאה במחיקת ההתראות',
      all: 'הכל',
      unread: 'לא נקראו',
      openOrder: 'פתח הזמנה',
      markGroupRead: 'סמן כנקראו',
      other: 'התראות כלליות',
      orderPrefix: 'הזמנה #'
    },
    en: {
      title: 'Notifications Center',
      markAllRead: 'Mark All as Read',
      deleteAll: 'Delete All',
      noNotifications: 'No Notifications',
      noNotificationsDesc: 'All your notifications will appear here',
      deleteSuccess: 'Notification deleted successfully',
      deleteError: 'Error deleting notification',
      deleteAllSuccess: 'All notifications deleted successfully',
      deleteAllError: 'Error deleting notifications',
      all: 'All',
      unread: 'Unread',
      openOrder: 'Open Order',
      markGroupRead: 'Mark as Read',
      other: 'General Notifications',
      orderPrefix: 'Order #'
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
      
      const userNotifications = await Notification.filter(
        { recipient_email: currentUser.email },
        '-created_at',
        200
      );

      setNotifications(userNotifications || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast({
        title: isRTL ? 'שגיאה' : 'Error',
        description: isRTL ? 'נכשל בטעינת ההתראות' : 'Failed to load notifications',
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
      if (unreadNotifications.length === 0) return;
      
      await Promise.all(
        unreadNotifications.map(n => Notification.update(n.id, { is_read: true }))
      );

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      
      toast({
        title: isRTL ? 'הצלחה' : 'Success',
        description: isRTL ? 'כל ההתראות סומנו כנקראו' : 'All notifications marked as read',
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
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
    }
  };

  const markGroupAsRead = async (groupId: string, notifs: any[]) => {
    try {
      const unreadInGroup = notifs.filter(n => !n.is_read);
      if (unreadInGroup.length === 0) return;

      await Promise.all(
        unreadInGroup.map(n => Notification.update(n.id, { is_read: true }))
      );

      setNotifications(prev => 
        prev.map(n => {
          const isMatch = groupId === 'other' ? !n.order_id : n.order_id === groupId;
          return isMatch ? { ...n, is_read: true } : n;
        })
      );
    } catch (error) {
      console.error('Error marking group as read:', error);
    }
  };

  const handleOpenOrder = (orderId: string) => {
    if (isManager) {
      navigate(`/orders?order=${orderId}`);
    } else {
      navigate(`/order-history?order=${orderId}`);
    }
  };

  const filteredNotifications = useMemo(() => {
    if (filterMode === 'unread') {
      return notifications.filter(n => !n.is_read);
    }
    return notifications;
  }, [notifications, filterMode]);

  const groupedNotifications = useMemo(() => {
    const groups: Record<string, any[]> = {};
    
    filteredNotifications.forEach(n => {
      const key = n.order_id || 'other';
      if (!groups[key]) groups[key] = [];
      groups[key].push(n);
    });

    return Object.entries(groups).sort((a, b) => {
      // Sort 'other' to the bottom
      if (a[0] === 'other') return 1;
      if (b[0] === 'other') return -1;
      // Otherwise sort by most recent notification in group
      return new Date(b[1][0].created_at).getTime() - new Date(a[1][0].created_at).getTime();
    });
  }, [filteredNotifications]);

  const unreadCountTotal = notifications.filter(n => !n.is_read).length;

  return (
    <Layout title={t.title}>
      <div className="p-4 sm:p-6 pb-24 max-w-4xl mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 p-2 rounded-lg">
              <Bell className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
              <p className="text-sm text-gray-500">
                {unreadCountTotal > 0 ? `${unreadCountTotal} ${t.unread}` : t.noNotificationsDesc}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {unreadCountTotal > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs h-9"
              >
                <CheckCheck className="h-4 w-4 ml-2" />
                {t.markAllRead}
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  if (confirm(isRTL ? 'בטוח שברצונך למחוק את כל ההתראות?' : 'Are you sure you want to delete all notifications?')) {
                    try {
                      await Promise.all(notifications.map(n => Notification.delete(n.id)));
                      setNotifications([]);
                      toast({ title: t.deleteAllSuccess });
                    } catch (e) {
                      toast({ title: t.deleteAllError, variant: 'destructive' });
                    }
                  }
                }}
                className="text-xs h-9 text-gray-500 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4 ml-2" />
                {t.deleteAll}
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
          <Button
            variant={filterMode === 'all' ? 'white' : 'ghost'}
            size="sm"
            onClick={() => setFilterMode('all')}
            className={`text-xs px-4 h-8 rounded-md ${filterMode === 'all' ? 'shadow-sm' : ''}`}
          >
            {t.all}
            <Badge variant="secondary" className="mr-2 h-4 px-1 min-w-[1.25rem] text-[10px] bg-gray-200">
              {notifications.length}
            </Badge>
          </Button>
          <Button
            variant={filterMode === 'unread' ? 'white' : 'ghost'}
            size="sm"
            onClick={() => setFilterMode('unread')}
            className={`text-xs px-4 h-8 rounded-md ${filterMode === 'unread' ? 'shadow-sm' : ''}`}
          >
            {t.unread}
            {unreadCountTotal > 0 && (
              <Badge className="mr-2 h-4 px-1 min-w-[1.25rem] text-[10px] bg-red-500 text-white border-none">
                {unreadCountTotal}
              </Badge>
            )}
          </Button>
        </div>
          
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-yellow-500 mb-4" />
            <p className="text-gray-500 text-sm">טוען התראות...</p>
          </div>
        ) : groupedNotifications.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <div className="bg-gray-100 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Bell className="h-10 w-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {t.noNotifications}
            </h3>
            <p className="text-gray-500 max-w-xs mx-auto">
              {t.noNotificationsDesc}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedNotifications.map(([groupId, groupNotifs]) => {
              const unreadInGroup = groupNotifs.filter(n => !n.is_read).length;
              const isOther = groupId === 'other';
              
              return (
                <div key={groupId} className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <div className={`p-1 rounded ${isOther ? 'bg-gray-100' : 'bg-blue-50 text-blue-600'}`}>
                        {isOther ? <Bell className="h-4 w-4" /> : <Package className="h-4 w-4" />}
                      </div>
                      <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2 uppercase tracking-wide">
                        {isOther ? t.other : `${t.orderPrefix}${groupId}`}
                        {unreadInGroup > 0 && (
                          <Badge variant="outline" className="h-4 text-[10px] border-yellow-200 bg-yellow-50 text-yellow-700 font-bold">
                            {unreadInGroup}
                          </Badge>
                        )}
                      </h2>
                    </div>

                    <div className="flex items-center gap-2">
                      {unreadInGroup > 0 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => markGroupAsRead(groupId, groupNotifs)}
                          className="text-[10px] h-6 px-2 text-gray-500 hover:text-yellow-600"
                        >
                          {t.markGroupRead}
                        </Button>
                      )}
                      {!isOther && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleOpenOrder(groupId)}
                          className="text-[10px] h-6 px-2 text-blue-600 hover:bg-blue-50"
                        >
                          {t.openOrder}
                          <ChevronRight className={`h-3 w-3 ${isRTL ? 'mr-1 rotate-180' : 'ml-1'}`} />
                        </Button>
                      )}
                    </div>
                  </div>

                  <Card className="overflow-hidden border-gray-200 shadow-sm">
                    <div className="divide-y divide-gray-100">
                      {groupNotifs.map((notification) => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          onClick={() => !notification.is_read && markAsRead(notification.id)}
                          onDelete={handleDelete}
                        />
                      ))}
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Notifications;
