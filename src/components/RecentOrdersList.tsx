import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { Package, MapPin, Calendar, Sunrise, Sunset, Building2, Factory } from 'lucide-react';

interface RecentOrdersListProps {
  orders: any[];
  sites: any[];
  products: any[];
  onOrderClick?: (order: any) => void;
}

export const RecentOrdersList: React.FC<RecentOrdersListProps> = ({ 
  orders, 
  sites, 
  products,
  onOrderClick 
}) => {
  const { language } = useLanguage();

  const translations = {
    he: {
      orderNumber: 'הזמנה',
      site: 'אתר',
      region: 'אזור',
      eilat: 'אילת',
      outsideEilat: 'מחוץ לאילת',
      supplier: 'ספק',
      shifuliHar: 'שיפולי הר',
      maavarRabin: 'מעבר רבין',
      product: 'מוצר',
      quantity: 'כמות',
      deliveryDate: 'תאריך אספקה',
      timeWindow: 'חלון זמן',
      morning: 'בוקר',
      afternoon: 'אחר הצהריים',
      pending: 'ממתין לאישור',
      approved: 'אושר',
      rejected: 'נדחה',
      completed: 'הושלם',
      tons: 'טון',
      noOrders: 'אין הזמנות'
    },
    en: {
      orderNumber: 'Order',
      site: 'Site',
      region: 'Region',
      eilat: 'Eilat',
      outsideEilat: 'Outside Eilat',
      supplier: 'Supplier',
      shifuliHar: 'Shifuli Har',
      maavarRabin: 'Maavar Rabin',
      product: 'Product',
      quantity: 'Quantity',
      deliveryDate: 'Delivery Date',
      timeWindow: 'Time Window',
      morning: 'Morning',
      afternoon: 'Afternoon',
      pending: 'Pending Approval',
      approved: 'Approved',
      rejected: 'Rejected',
      completed: 'Completed',
      tons: 'tons',
      noOrders: 'No orders'
    }
  };

  const t = translations[language];
  const isRTL = language === 'he';

  const getProductName = (productId: string) => {
    const product = products.find(p => p.product_id === productId);
    return product ? (language === 'he' ? product.name_he : product.name_en) : productId;
  };

  const getSite = (siteId: string) => {
    return sites.find(s => s.id === siteId);
  };

  const getSiteName = (siteId: string) => {
    const site = getSite(siteId);
    return site?.site_name || t.site;
  };

  const getRegionName = (siteId: string) => {
    const site = getSite(siteId);
    if (!site) return '';
    return site.region_type === 'eilat' ? t.eilat : t.outsideEilat;
  };

  const getSupplierName = (supplier: string) => {
    if (!supplier) return '';
    return supplier === 'shifuli_har' ? t.shifuliHar : t.maavarRabin;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'status-pending',
      approved: 'status-approved',
      rejected: 'status-rejected',
      completed: 'status-completed'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600">{t.noOrders}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3" dir={isRTL ? 'rtl' : 'ltr'}>
      {orders.map((order) => {
        const TimeIcon = order.delivery_window === 'morning' ? Sunrise : Sunset;
        
        return (
          <Card 
            key={order.id} 
            className={onOrderClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}
            onClick={() => onOrderClick?.(order)}
          >
            <CardContent className="p-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-bold text-sm sm:text-base">
                      {t.orderNumber} #{order.order_number || order.id.slice(-6)}
                    </h3>
                    <Badge className={`${getStatusColor(order.status)} text-xs`}>
                      {t[order.status]}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2">
                {order.site_id && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <span className="text-gray-500">{t.site}:</span>
                    <span className="font-medium text-gray-900">{getSiteName(order.site_id)}</span>
                  </div>
                )}
                {order.site_id && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <Building2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <span className="text-gray-500">{t.region}:</span>
                    <span className="font-medium text-blue-700">{getRegionName(order.site_id)}</span>
                  </div>
                )}
                {order.supplier && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <Factory className="w-4 h-4 text-orange-500 flex-shrink-0" />
                    <span className="text-gray-500">{t.supplier}:</span>
                    <span className="font-medium text-orange-700">{getSupplierName(order.supplier)}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <Package className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <span className="text-gray-500">{t.product}:</span>
                  <span className="font-medium text-gray-900">{getProductName(order.product_id)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <Package className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <span className="text-gray-500">{t.quantity}:</span>
                  <span className="font-medium text-gray-900">{order.quantity_tons} {t.tons}</span>
                </div>
                {order.delivery_date && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <span className="text-gray-500">{t.deliveryDate}:</span>
                    <span className="font-medium text-gray-900">{formatDate(order.delivery_date)}</span>
                  </div>
                )}
                {order.delivery_window && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <TimeIcon className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                    <span className="text-gray-500">{t.timeWindow}:</span>
                    <span className="font-medium text-gray-900">
                      {order.delivery_window === 'morning' ? t.morning : t.afternoon}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};