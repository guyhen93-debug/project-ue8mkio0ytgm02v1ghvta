import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Package, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface NotificationItemProps {
  notification: any;
  onClick?: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onClick }) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'new_order':
        return <Package className="h-5 w-5 text-blue-600" />;
      case 'order_approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'order_rejected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'order_completed':
        return <CheckCircle className="h-5 w-5 text-blue-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTypeLabel = () => {
    switch (notification.type) {
      case 'new_order':
        return 'הזמנה חדשה';
      case 'order_approved':
        return 'הזמנה אושרה';
      case 'order_rejected':
        return 'הזמנה נדחתה';
      case 'order_completed':
        return 'הזמנה הושלמה';
      default:
        return 'התראה';
    }
  };

  const getBadgeColor = () => {
    if (!notification.is_read) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    }
    return 'bg-gray-100 text-gray-600';
  };

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        !notification.is_read ? 'border-l-4 border-l-yellow-500 bg-yellow-50/30' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            {getIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={getBadgeColor()}>
                {getTypeLabel()}
              </Badge>
              {!notification.is_read && (
                <Badge className="bg-red-500 text-white">חדש</Badge>
              )}
            </div>
            
            <p className="text-sm text-gray-900 font-medium mb-1">
              {notification.message}
            </p>
            
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              <span>
                {format(new Date(notification.created_at), 'dd/MM/yyyy HH:mm', { locale: he })}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationItem;