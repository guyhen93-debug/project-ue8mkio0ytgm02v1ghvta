import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Package, CheckCircle, XCircle, Clock, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface NotificationItemProps {
  notification: any;
  onClick?: () => void;
  onDelete?: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onClick, onDelete }) => {
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

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(notification.id);
    }
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

          {onDelete && (
            <div className="flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationItem;