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
import { Input } from '@/components/ui/input';
import { Plus, MapPin, Calendar, Package, Clock, FileText, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { he, enUS } from 'date-fns/locale';

const ManagerDashboard: React.FC = () => {
  const { t, language, isRTL } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [quarryFilter, setQuarryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, statusFilter, quarryFilter, searchTerm]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const allOrders = await Order.list('-created_at');
      setOrders(allOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }
    
    // Quarry filter
    if (quarryFilter !== 'all') {
      if (quarryFilter === 'shifolei_har') {
        filtered = filtered.filter(order => order.quarry === 'shifolei_har');
      } else if (quarryFilter === 'yitzhak_rabin') {
        filtered = filtered.filter(order => order.quarry === 'yitzhak_rabin');
      }
    }
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(term) ||
        order.created_by.toLowerCase().includes(term) ||
        (order.site_name && order.site_name.toLowerCase().includes(term)) ||
        (order.notes && order.notes.toLowerCase().includes(term))
      );
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

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await Order.update(orderId, { status: newStatus });
      await loadOrders(); // Reload orders
      // TODO: Send notification to client
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  if (loading) {
    return (
      <Layout title={t('all_orders')}>
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
    <Layout title={t('all_orders')}>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('all_orders')}</h1>
            <p className="text-gray-600">{t('total_orders')}: {orders.length}</p>
          </div>
          <Button 
            onClick={() => navigate('/admin')}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium w-full sm:w-auto"
          >
            {t('admin_panel')}
          </Button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder={t('search_orders')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder={t('all_statuses')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('all')}</SelectItem>
              <SelectItem value="pending">{t('pending')}</SelectItem>
              <SelectItem value="approved">{t('approved')}</SelectItem>
              <SelectItem value="rejected">{t('rejected')}</SelectItem>
              <SelectItem value="completed">{t('completed')}</SelectItem>
            </SelectContent>
          </Select>

          {/* Quarry Filter */}
          <Select value={quarryFilter} onValueChange={setQuarryFilter}>
            <SelectTrigger>
              <SelectValue placeholder={t('quarry_crossing')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('all')}</SelectItem>
              <SelectItem value="shifolei_har">{t('shifolei_har')}</SelectItem>
              <SelectItem value="yitzhak_rabin">{t('yitzhak_rabin')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t('no_orders_found')}
            </h3>
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
                        {t('customer')}: {order.created_by}
                      </p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(order.created_at), 'PPP', { 
                          locale: language === 'he' ? he : enUS 
                        })}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <Badge className={getStatusColor(order.status)}>
                        {t(order.status)}
                      </Badge>
                      {order.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => updateOrderStatus(order.id, 'approved')}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            {t('approved')}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateOrderStatus(order.id, 'rejected')}
                          >
                            {t('rejected')}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Product */}
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">{t(order.product_id)}</span>
                    <span className="text-gray-600">• {order.quantity} {t('tons')}</span>
                  </div>

                  {/* Delivery Date & Time */}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">
                      {formatDeliveryTime(order.delivery_date, order.time_slot)}
                    </span>
                  </div>

                  {/* Site Name */}
                  {order.site_name && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">{order.site_name}</span>
                    </div>
                  )}

                  {/* Delivery Type */}
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">{t(order.delivery_type)}</span>
                  </div>

                  {/* Quarry */}
                  {order.quarry && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">{t(order.quarry)}</span>
                    </div>
                  )}

                  {/* Notes - Show full text */}
                  {order.notes && (
                    <div className="flex items-start gap-2">
                      <FileText className="w-4 h-4 text-gray-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 leading-relaxed">
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

export default ManagerDashboard;