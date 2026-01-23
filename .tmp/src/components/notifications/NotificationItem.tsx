import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Bell, 
  Package, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Trash2, 
  Truck, 
  MessageSquare,
  AlertTriangle 
} from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';

interface NotificationItemProps {
  notification: any;
  onClick?: () => void;
  onDelete?: (id: string) => void;
  condensed?: boolean;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ 
  notification, 
  onClick, 
  onDelete,
  condensed = false
}) => {
  const { language } = useLanguage();
  const t = {
    he: {
      new_order: 'הזמנה חדשה',
      order_approved: 'הזמנה אושרה',
      order_rejected: 'הזמנה נדחתה',
      order_completed: 'הזמנה הושלמה',
      order_status_change: 'שינוי סטטוס',
      order_pending_reminder: 'תזכורת לאישור',
      order_delivery_overdue: 'איחור באספקה',
      message_received: 'הודעה חדשה',
      default: 'התראה'
    },
    en: {
      new_order: 'New Order',
      order_approved: 'Order Approved',
      order_rejected: 'Order Rejected',
      order_completed: 'Order Completed',
      order_status_change: 'Status Change',
      order_pending_reminder: 'Pending Reminder',
      order_delivery_overdue: 'Delivery Overdue',
      message_received: 'New Message',
      default: 'Notification'
    }
  }[language];

  const getIcon = () => {
    switch (notification.type) {
      case 'new_order':
        return <Package className="h-4 w-4 text-blue-600" />;
      case 'order_approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'order_rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'order_completed':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'order_delivery_overdue':
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      case 'order_pending_reminder':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'message_received':
        return <MessageSquare className="h-4 w-4 text-purple-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeLabel = () => {
    return t[notification.type as keyof typeof t] || t.default;
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(notification.id);
    }
  };

  return (
    <div 
      className={`group flex items-start gap-3 p-3 transition-colors cursor-pointer hover:bg-gray-50 relative ${
        !notification.is_read ? 'bg-yellow-50/40' : ''
      } ${condensed ? 'py-2 px-3' : 'py-3 px-4'}`}
      onClick={onClick}
    >
      {/* Unread dot */}
      {!notification.is_read && (
        <div className="absolute top-1/2 -translate-y-1/2 right-1.5 w-1.5 h-1.5 rounded-full bg-yellow-500 shadow-sm" />
      )}

      <div className={`flex-shrink-0 mt-0.5 rounded-full p-1.5 bg-white border border-gray-100 shadow-sm`}>
        {getIcon()}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-bold text-gray-800 uppercase tracking-tight">
            {getTypeLabel()}
          </span>
          <span className="text-[10px] text-gray-400">
            {format(new Date(notification.created_at), 'HH:mm', { locale: he })}
          </span>
        </div>
        
        <p className={`text-gray-600 leading-snug break-words ${condensed ? 'text-xs line-clamp-1' : 'text-sm'}`}>
          {notification.message}
        </p>
      </div>

      {!condensed && onDelete && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 transition-opacity"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default NotificationItem;
