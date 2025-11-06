import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { OrderService } from '@/services/orderService';
import { DataService } from '@/services/dataService';
import { SampleDataService } from '@/services/sampleDataService';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Plus, MapPin, Calendar, Package, Clock, FileText, Search, RefreshCw, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { he, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const ManagerDashboard: React.FC = () => {
  const { t, language, isRTL } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Monitor online status
    const handleOnline = () => {
      setIsOnline(true);
      console.log('Connection restored, reloading data...');
      loadOrders();
    };
    const handleOffline = () => {
      setIsOnline(false);
      console.log('Connection lost');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, statusFilter, regionFilter, searchTerm]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading orders... Attempt:', retryCount + 1);
      
      // Try to initialize sample data if no data exists (only on first load)
      if (retryCount === 0) {
        try {
          await SampleDataService.initializeSampleData();
        } catch (sampleError) {
          console.log('Sample data initialization failed, continuing with existing data');
          // Don't treat this as a fatal error
        }
      }
      
      // Load orders with retry logic
      const allOrders = await withRetry(async () => {
        return await OrderService.getOrdersWithRelations(undefined, true);
      }, 3, 2000);
      
      if (allOrders !== null) {
        console.log('Loaded orders:', allOrders.length);
        setOrders(allOrders);
        setRetryCount(0); // Reset retry count on success
      } else {
        throw new Error('Failed to load orders after multiple attempts');
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      const errorMessage = !isOnline 
        ? 'No internet connection. Please check your network and try again.'
        : `Failed to load orders. ${error instanceof Error ? error.message : 'Unknown error'}`;
      
      setError(errorMessage);
      
      // Keep existing orders if we have them
      if (orders.length === 0) {
        setOrders([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Retry helper function
  const withRetry = async <T,>(
    operation: () => Promise<T>, 
    maxRetries: number = 3, 
    delay: number = 1000
  ): Promise<T | null> => {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        console.log(`Operation failed, retry ${i + 1}/${maxRetries}:`, error);
        
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        }
      }
    }
    
    console.error('Operation failed after all retries:', lastError);
    return null;
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    loadOrders();
  };

  const filterOrders = () => {
    let filtered = orders;
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }
    
    // Region filter
    if (regionFilter !== 'all') {
      filtered = filtered.filter(order => order.region_type === regionFilter);
    }
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(order => 
        (order.order_number && order.order_number.toLowerCase().includes(term)) ||
        order.created_by.toLowerCase().includes(term) ||
        (order.site_name && order.site_name.toLowerCase().includes(term)) ||
        (order.client_name && order.client_name.toLowerCase().includes(term)) ||
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

  const formatDeliveryInfo = (date: string, window: string) => {
    try {
      const deliveryDate = new Date(date);
      const dateStr = format(deliveryDate, 'MMMM d', { 
        locale: language === 'he' ? he : enUS 
      });
      
      const windowStr = OrderService.formatDeliveryWindow(window, language);
      
      return `${dateStr} • ${windowStr}`;
    } catch (error) {
      return date;
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const result = await withRetry(async () => {
        return await DataService.updateOrder(orderId, { status: newStatus });
      });
      
      if (result && result.success) {
        await loadOrders(); // Reload orders
        toast({
          title: t('order_updated'),
          description: t('order_updated_successfully')
        });
      } else {
        throw new Error(result?.error || 'Update failed');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: t('error'),
        description: t('update_failed'),
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <Layout title={t('all_orders')}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto mb-4"></div>
            <p className="text-gray-600">{t('loading')}</p>
            {retryCount > 0 && (
              <p className="text-sm text-gray-500 mt-2">
                Retry attempt: {retryCount}
              </p>
            )}
            {!isOnline && (
              <div className="flex items-center justify-center gap-2 mt-3 text-orange-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">No internet connection</span>
              </div>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title={t('all_orders')}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <Package className="w-16 h-16 text-red-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {!isOnline ? 'Connection Problem' : t('error_loading_data')}
            </h3>
            <p className="text-gray-600 mb-4 text-sm">{error}</p>
            
            {!isOnline && (
              <div className="flex items-center justify-center gap-2 mb-4 text-orange-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">Check your internet connection</span>
              </div>
            )}
            
            <div className="flex gap-2 justify-center">
              <Button 
                onClick={handleRetry} 
                className="bg-yellow-500 hover:bg-yellow-600 text-black"
                disabled={!isOnline}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {t('try_again')}
              </Button>
              <Button 
                onClick={() => navigate('/create-order')}
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('create_order')}
              </Button>
            </div>
            {retryCount > 0 && (
              <p className="text-xs text-gray-500 mt-3">
                Failed attempts: {retryCount}
              </p>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={t('all_orders')}>
      <div className="p-4 space-y-4">
        {/* Connection Status */}
        {!isOnline && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-orange-600" />
            <span className="text-sm text-orange-800">
              No internet connection. Some features may not work properly.
            </span>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('all_orders')}</h1>
            <p className="text-gray-600">{t('total_orders')}: {orders.length}</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              onClick={handleRetry}
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none"
              disabled={!isOnline}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {t('refresh')}
            </Button>
            <Button 
              onClick={() => navigate('/create-order')}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium flex-1 sm:flex-none"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('create_order')}
            </Button>
            <Button 
              onClick={() => navigate('/admin')}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium flex-1 sm:flex-none"
            >
              {t('admin_panel')}
            </Button>
          </div>
        </div>

        {/* ... keep existing code (filters and orders list) */}
        <div className={cn(
          "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4",
          isRTL ? "text-right" : "text-left"
        )}>
          {/* Search */}
          <div className="relative">
            <Search className={cn(
              "absolute top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4",
              isRTL ? "right-3" : "left-3"
            )} />
            <Input
              placeholder={t('search_orders')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn(isRTL ? "pr-10 text-right" : "pl-10 text-left")}
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className={cn(isRTL ? "text-right" : "text-left")}>
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

          {/* Region Filter */}
          <Select value={regionFilter} onValueChange={setRegionFilter}>
            <SelectTrigger className={cn(isRTL ? "text-right" : "text-left")}>
              <SelectValue placeholder={isRTL ? "סינון לפי אזור" : "Filter by region"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('all')}</SelectItem>
              <SelectItem value="eilat">{t('eilat')}</SelectItem>
              <SelectItem value="outside_eilat">{t('outside_eilat')}</SelectItem>
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
            <p className="text-gray-600 mb-4">
              {orders.length === 0 ? t('no_orders_yet') : t('no_orders_match_filter')}
            </p>
            {orders.length === 0 && (
              <Button 
                onClick={() => navigate('/create-order')}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('create_first_order')}
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
                        {t('order_number')}{order.order_number || order.id.slice(-6)}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {t('customer')}: {order.created_by}
                      </p>
                      <p className="text-sm text-gray-600">
                        {t('client')}: {order.client_name}
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
                            disabled={!isOnline}
                          >
                            {t('approved')}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateOrderStatus(order.id, 'rejected')}
                            disabled={!isOnline}
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
                  <div className={cn(
                    "flex items-center gap-2",
                    isRTL ? "text-right" : "text-left"
                  )}>
                    <Package className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">{t(order.product_id)}</span>
                    <span className="text-gray-600">{order.quantity_tons} {t('tons')}</span>
                  </div>

                  {/* Delivery Date & Window */}
                  <div className={cn(
                    "flex items-center gap-2",
                    isRTL ? "text-right" : "text-left"
                  )}>
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">
                      {formatDeliveryInfo(order.delivery_date, order.delivery_window)}
                    </span>
                  </div>

                  {/* Site Name */}
                  <div className={cn(
                    "flex items-center gap-2",
                    isRTL ? "text-right" : "text-left"
                  )}>
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">{order.site_name}</span>
                    <span className="text-xs text-gray-500">({t(order.region_type)})</span>
                    {order.unlinked_site && (
                      <Badge variant="outline" className="text-xs">
                        {isRTL ? "לא מקושר" : "Unlinked"}
                      </Badge>
                    )}
                  </div>

                  {/* Delivery Method */}
                  <div className={cn(
                    "flex items-center gap-2",
                    isRTL ? "text-right" : "text-left"
                  )}>
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">{t(order.delivery_method)}</span>
                  </div>

                  {/* Notes */}
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

export default ManagerDashboard;