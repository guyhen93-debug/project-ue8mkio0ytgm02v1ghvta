import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Order } from '@/entities';
import { useLanguage } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { getProductName, getSiteName, getClientName, formatOrderDate } from '@/lib/orderUtils';
import { toast } from '@/hooks/use-toast';
import { Plus, Sparkles, Check, X, MessageSquare, Truck, AlertCircle } from 'lucide-react';
import NotificationsCard from '@/components/NotificationsCard';

const ManagerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { productsMap, sitesMap, clientsMap } = useData();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [deliveryUpdates, setDeliveryUpdates] = useState<Record<string, string>>({});
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const translations = {
    he: {
      title: 'דשבורד מנהל',
      recentOrders: 'הזמנות אחרונות',
      createOrder: 'צור הזמנה חדשה',
      error: 'שגיאה בטעינת הזמנות',
      retry: 'נסה שוב',
      pendingSectionTitle: 'הזמנות ממתינות לאישור',
      partialSectionTitle: 'הזמנות באספקה חלקית',
      approve: 'אשר',
      reject: 'דחה',
      sendMessage: 'שלח הודעה',
      addDelivery: 'עדכן אספקה',
      deliveryAmountPlaceholder: 'טונות נוספים',
      remaining: 'נותר',
      delivered: 'סופק',
      of: 'מתוך',
      successApprove: 'ההזמנה אושרה בהצלחה',
      successReject: 'ההזמנה נדחתה',
      successDelivery: 'האספקה עודכנה בהצלחה',
      invalidAmount: 'נא להזין כמות תקינה'
    },
    en: {
      title: 'Manager Dashboard',
      recentOrders: 'Recent Orders',
      createOrder: 'Create New Order',
      error: 'Error loading orders',
      retry: 'Retry',
      pendingSectionTitle: 'Pending Orders',
      partialSectionTitle: 'Partially Delivered Orders',
      approve: 'Approve',
      reject: 'Reject',
      sendMessage: 'Send Message',
      addDelivery: 'Update Delivery',
      deliveryAmountPlaceholder: 'Add tons',
      remaining: 'Remaining',
      delivered: 'Delivered',
      of: 'of',
      successApprove: 'Order approved successfully',
      successReject: 'Order rejected',
      successDelivery: 'Delivery updated successfully',
      invalidAmount: 'Please enter a valid amount'
    }
  };

  const t = translations[language];
  const isRTL = language === 'he';

  useEffect(() => {
    loadOrders();
  }, [retryCount]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading orders...');
      const allOrders = await Order.list('-created_at', 1000);
      console.log('Orders loaded successfully:', allOrders?.length || 0);
      
      setOrders(allOrders || []);
    } catch (error: any) {
      console.error('Error loading orders:', error);
      
      // Only show error if it's not an auth issue
      if (!error?.message?.includes('401') && !error?.message?.includes('Unauthorized')) {
        setError(t.error);
      }
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: 'approved' | 'rejected') => {
    try {
      setIsUpdating(id);
      await Order.update(id, { status });
      toast({
        title: status === 'approved' ? t.successApprove : t.successReject,
      });
      loadOrders();
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setIsUpdating(null);
    }
  };

  const handleUpdateDelivery = async (order: any) => {
    const added = parseFloat(deliveryUpdates[order.id]);
    if (isNaN(added) || added <= 0) {
      toast({
        title: t.invalidAmount,
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsUpdating(order.id);
      const currentDelivered = order.delivered_quantity_tons || 0;
      const newDelivered = Math.min(currentDelivered + added, order.quantity_tons);
      const isCompleted = newDelivered >= order.quantity_tons;

      await Order.update(order.id, {
        delivered_quantity_tons: newDelivered,
        is_delivered: isCompleted,
        delivered_at: isCompleted ? new Date().toISOString() : order.delivered_at
      });

      toast({
        title: t.successDelivery,
      });
      
      setDeliveryUpdates(prev => {
        const next = { ...prev };
        delete next[order.id];
        return next;
      });
      
      loadOrders();
    } catch (err) {
      console.error('Error updating delivery:', err);
    } finally {
      setIsUpdating(null);
    }
  };

  const handleSendMessage = (order: any) => {
    const subject = language === 'he' 
      ? `הודעה לגבי הזמנה #${order.order_number}`
      : `Message regarding order #${order.order_number}`;
    
    navigate('/inbox', { 
      state: { 
        newMessage: { 
          subject, 
          orderId: order.id 
        } 
      } 
    });
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  const pendingOrders = orders.filter(o => o.status === 'pending').slice(0, 5);
  const partialOrders = orders.filter(o => 
    (o.status === 'approved' || o.status === 'completed') && 
    !o.is_delivered && 
    o.quantity_tons > (o.delivered_quantity_tons || 0)
  ).slice(0, 10);

  return (
    <Layout title={t.title}>
      <div className="p-3 sm:p-4 md:p-6 pb-24" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Highlighted Quick Action */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 rounded-lg blur opacity-30 animate-pulse"></div>
            <Button 
              className="relative w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold text-lg py-6 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
              onClick={() => navigate('/create-order')}
            >
              <Sparkles className={`w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'} animate-pulse`} />
              {t.createOrder}
              <Plus className={`w-5 h-5 ${isRTL ? 'mr-2' : 'ml-2'}`} />
            </Button>
          </div>
        </div>

        {/* Notifications Card */}
        <div className="mb-6">
          <NotificationsCard />
        </div>

        {/* Pending Orders Section */}
        {pendingOrders.length > 0 && (
          <Card className="industrial-card mb-6 overflow-hidden border-yellow-200">
            <CardHeader className="bg-yellow-50/50 p-4 border-b border-yellow-100">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                {t.pendingSectionTitle}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                {pendingOrders.map(order => (
                  <div key={order.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                    <div>
                      <div className="font-bold text-gray-900">
                        #{order.order_number} - {getClientName(order, sitesMap, clientsMap)}
                      </div>
                      <div className="text-sm text-gray-500 flex flex-wrap gap-x-3 mt-1">
                        <span>{getSiteName(order.site_id, sitesMap)}</span>
                        <span>•</span>
                        <span>{getProductName(order.product_id, productsMap, language)} ({order.quantity_tons}ט')</span>
                        <span>•</span>
                        <span>{formatOrderDate(order.delivery_date, language)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-green-600 border-green-200 hover:bg-green-50"
                        onClick={() => handleStatusUpdate(order.id, 'approved')}
                        disabled={!!isUpdating}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        {t.approve}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => handleStatusUpdate(order.id, 'rejected')}
                        disabled={!!isUpdating}
                      >
                        <X className="w-4 h-4 mr-1" />
                        {t.reject}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-gray-600"
                        onClick={() => handleSendMessage(order)}
                      >
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Partially Delivered Orders Section */}
        {partialOrders.length > 0 && (
          <Card className="industrial-card mb-6 overflow-hidden border-blue-200">
            <CardHeader className="bg-blue-50/50 p-4 border-b border-blue-100">
              <CardTitle className="text-lg flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-600" />
                {t.partialSectionTitle}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                {partialOrders.map(order => {
                  const delivered = order.delivered_quantity_tons || 0;
                  const total = order.quantity_tons;
                  const remaining = Math.max(0, total - delivered);
                  
                  return (
                    <div key={order.id} className="p-4 flex flex-col gap-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="font-bold">
                          #{order.order_number} - {getClientName(order, sitesMap, clientsMap)}
                        </div>
                        <div className="text-sm font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded">
                          {t.remaining}: {remaining.toFixed(1)}ט'
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-500">
                        {getProductName(order.product_id, productsMap, language)} • {t.delivered}: {delivered.toFixed(1)} {t.of} {total}ט'
                      </div>

                      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-blue-500 h-full transition-all duration-500" 
                          style={{ width: `${(delivered / total) * 100}%` }}
                        />
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          type="number"
                          placeholder={t.deliveryAmountPlaceholder}
                          className="h-9 text-sm"
                          value={deliveryUpdates[order.id] || ''}
                          onChange={(e) => setDeliveryUpdates(prev => ({ ...prev, [order.id]: e.target.value }))}
                        />
                        <Button 
                          size="sm" 
                          className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
                          onClick={() => handleUpdateDelivery(order)}
                          disabled={isUpdating === order.id}
                        >
                          {t.addDelivery}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-gray-400 p-2 h-9 w-9"
                          onClick={() => handleSendMessage(order)}
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </Layout>
  );
};
export default ManagerDashboard;
