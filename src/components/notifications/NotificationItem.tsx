import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { mockDataService } from '@/services/mockDataService';
import { toast } from '@/hooks/use-toast';
import { X, Bell, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { he, enUS } from 'date-fns/locale';

interface NotificationItemProps {
  notification: any;
  onDelete?: (notificationId: string) => void;
  onMarkRead?: (notificationId: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ 
  notification, 
  onDelete, 
  onMarkRead 
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { t, language } = useLanguage();

  const handleDelete = async () => {
    try {
      await mockDataService.deleteNotification(notification.id);
      
      if (onDelete) onDelete(notification.id);
      
      toast({
        title: t('notification_deleted'),
        description: t('notification_deleted_successfully'),
      });
      
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: t('error'),
        description: t('delete_failed'),
        variant: 'destructive',
      });
    }
  };

  const handleMarkRead = async () => {
    if (notification.read) return;
    
    try {
      await mockDataService.updateNotification(notification.id, { read: true });
      
      if (onMarkRead) onMarkRead(notification.id);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const formatNotificationTime = (dateString: string) => {
    const date = new Date(dateString);
    const locale = language === 'he' ? he : enUS;
    return formatDistanceToNow(date, { addSuffix: true, locale });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order_approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'order_rejected':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'quantity_reduced':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      default:
        return <Bell className="h-4 w-4 text-blue-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'order_approved':
        return 'border-l-green-500';
      case 'order_rejected':
        return 'border-l-red-500';
      case 'quantity_reduced':
        return 'border-l-orange-500';
      default:
        return 'border-l-blue-500';
    }
  };

  return (
    <>
      <Card 
        className={`mb-3 border-l-4 ${getNotificationColor(notification.type)} ${
          !notification.read ? 'bg-blue-50' : 'bg-white'
        } cursor-pointer hover:shadow-md transition-shadow`}
        onClick={handleMarkRead}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              {getNotificationIcon(notification.type)}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-sm">
                    {t(notification.title)}
                  </h4>
                  {!notification.read && (
                    <Badge variant="default" className="text-xs">
                      {t('new')}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {notification.message}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {formatNotificationTime(notification.created_at)}
                  </span>
                  {notification.order_id && (
                    <Badge variant="outline" className="text-xs">
                      {t('order')} #{notification.order_id}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteConfirm(true);
              }}
              className="h-6 w-6 p-0 text-gray-400 hover:text-red-600 ml-2"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold mb-2">{t('confirm_delete')}</h3>
            <p className="text-gray-600 mb-4">{t('confirm_delete_notification')}</p>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={handleDelete}
                className="flex-1"
              >
                {t('delete')}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1"
              >
                {t('cancel')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NotificationItem;