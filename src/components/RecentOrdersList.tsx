import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { Package, Calendar, MapPin } from 'lucide-react';

interface Order {
  id: string;
  order_number: string;
  product_id: string;
  quantity_tons: number;
  delivery_date: string;
  status: string;
  created_at: string;
}

interface RecentOrdersListProps {
  orders: Order[];
  onViewAll: () => void;
}

const RecentOrdersList: React.FC<RecentOrdersListProps> = ({ orders, onViewAll }) => {
  const { t } = useLanguage();

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      pending: 'status-pending',
      approved: 'status-approved',
      rejected: 'status-rejected',
      completed: 'status-completed',
    };

    return (
      <Badge className={statusClasses[status] || 'bg-gray-100 text-gray-800'}>
        {t(status)}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL');
  };

  if (orders.length === 0) {
    return (
      <Card className="industrial-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{t('recent_orders')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>{t('no_orders_yet')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="industrial-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">{t('recent_orders')}</CardTitle>
        <button
          onClick={onViewAll}
          className="text-sm text-yellow-600 hover:text-yellow-700 font-medium"
        >
          {t('view_all')}
        </button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {orders.slice(0, 5).map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900">
                    #{order.order_number}
                  </span>
                  {getStatusBadge(order.status)}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    <span>{order.quantity_tons} {t('tons')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(order.delivery_date)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentOrdersList;