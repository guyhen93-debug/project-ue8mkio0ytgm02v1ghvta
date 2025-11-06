import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Order } from '@/entities';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, MapPin, Calendar, Package, Clock, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { he, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const ClientDashboard: React.FC = () => {
  const { t, language, isRTL } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, [user]);

  useEffect(() => {
    filterOrders();
  }, [orders, statusFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      if (user?.email) {
        const userOrders = await Order.filter({ created_by: user.email }, '-created_at');
        setOrders(userOrders);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;
    
    if (statusFilter !== 'all') {
      filtered = orders.filter(order => order.status === statusFilter);
    }
    
    setFilteredOrders(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDeliveryTime = (date: string, timeSlot: string) => {
    try {
      const deliveryDate = new Date(date);
      const dateStr = format(deliveryDate, 'MMMM d', { 
        locale: language === 'he' ? he : enUS 
      });
      
      const timeStr = timeSlot === 'morning' ? t('morning') : t('afternoon');
      
      return isRTL ? `${dateStr} • ${timeStr}` : `${dateStr} • ${timeStr}`;
    } catch (error) {
      return date;
    }
  };

  if (loading) {
    return (
      <Layout title={t('my_orders')}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto mb-4"></div>
            <p className="text-gray-600">{t('loading')}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={t('my_orders')}>
      <div className="p-4 space-y-4">
        {/* Header with Create Order Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('my_orders')}</h1>
            <p className="text-gray-600">{t('total_orders')}: {orders.length}</p>
          </div>
          <Button 
            onClick={() => navigate('/create-order')}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('create_order')}
          </Button>
        </div>

        {/* Status Filter - Fix 1: RTL/LTR alignment and placeholders */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <label className={cn(
            "text-sm font-medium text-gray-700 whitespace-nowrap",
            isRTL ? "text-right" : "text-left"
          )}>
            {t('filter_by_status')}:
          </label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className={cn(
              "w-full sm:w-48",
              isRTL ? "text-right" : "text-left"
            )}>
              <SelectValue placeholder={isRTL ? "סינון לפי סטטוס" : "Filter by status"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('all')}</SelectItem>
              <SelectItem value="pending">{t('pending')}</SelectItem>
              <SelectItem value="approved">{t('approved')}</SelectItem>
              <SelectItem value="rejected">{t('rejected')}</SelectItem>
              <SelectItem value="completed">{t('completed')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {statusFilter === 'all' ? t('no_orders') : t('no_orders_filter')}
            </h3>
            {statusFilter === 'all' && (
              <p className="text-gray-600 mb-6">{t('start_creating_order')}</p>
            )}
            {statusFilter === 'all' && (
              <Button 
                onClick={() => navigate('/create-order')}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('create_order')}
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg font-semibold">
                        {t('order_number')}{order.id.slice(-6)}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {format(new Date(order.created_at), 'PPP', { 
                          locale: language === 'he' ? he : enUS 
                        })}
                      </p>
                    </div>
                    <Badge className={getStatusColor(order.status)}>
                      {t(order.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Product - Fix 2: Remove middle dot and align properly */}
                  <div className={cn(
                    "flex items-center gap-2",
                    isRTL ? "text-right" : "text-left"
                  )}>
                    <Package className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">{t(order.product_id)}</span>
                    <span className="text-gray-600">{order.quantity} {t('tons')}</span>
                  </div>

                  {/* Delivery Date & Time */}
                  <div className={cn(
                    "flex items-center gap-2",
                    isRTL ? "text-right" : "text-left"
                  )}>
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">
                      {formatDeliveryTime(order.delivery_date, order.time_slot)}
                    </span>
                  </div>

                  {/* Site Name */}
                  {order.site_name && (
                    <div className={cn(
                      "flex items-center gap-2",
                      isRTL ? "text-right" : "text-left"
                    )}>
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">{order.site_name}</span>
                    </div>
                  )}

                  {/* Delivery Type */}
                  <div className={cn(
                    "flex items-center gap-2",
                    isRTL ? "text-right" : "text-left"
                  )}>
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">{t(order.delivery_type)}</span>
                  </div>

                  {/* Notes - Fix 3: Translate Notes label and RTL alignment */}
                  {order.notes && (
                    <div className={cn(
                      "flex items-start gap-2",
                      isRTL ? "text-right" : "text-left"
                    )}>
                      <FileText className="w-4 h-4 text-gray-500 mt-0.5" />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-700">
                          {isRTL ? "הערות:" : "Notes:"}
                        </span>
                        <p className="text-sm text-gray-600 leading-relaxed mt-1">
                          {order.notes}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ClientDashboard;