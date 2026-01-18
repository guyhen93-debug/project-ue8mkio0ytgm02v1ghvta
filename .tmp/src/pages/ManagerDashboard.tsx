import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Order, User, Notification } from '@/entities';
import type { Order as OrderType, User as UserType } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { getProductName, getSiteName, getClientName, formatOrderDate, getStatusConfig } from '@/lib/orderUtils';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Sparkles, Check, X, MessageSquare, Truck, AlertCircle, TrendingUp, BarChart3, Star, Clock, Package } from 'lucide-react';
import NotificationsCard from '@/components/NotificationsCard';
import { OrderCardSkeleton } from '@/components/OrderCardSkeleton';

const ManagerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user: currentUser } = useAuth();
  const { productsMap, sitesMap, clientsMap } = useData();
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [deliveryDialogOpen, setDeliveryDialogOpen] = useState(false);
  const [selectedOrderForDelivery, setSelectedOrderForDelivery] = useState<OrderType | null>(null);
  const [deliveryForm, setDeliveryForm] = useState({
    amount: '',
    deliveryNoteNumber: '',
    driverName: '',
    notes: '',
  });

  const translations = {
    he: {
      title: 'דשבורד מנהל',
      recentOrders: 'הזמנות אחרונות',
      createOrder: 'צור הזמנה חדשה',
      error: 'לא הצלחנו לטעון את ההזמנות כרגע. נסה שוב, ואם זה חוזר – עדכן את פיטר',
      retry: 'נסו שוב',
      pendingSectionTitle: 'הזמנות ממתינות לאישור',
      partialSectionTitle: 'הזמנות באספקה חלקית',
      approve: 'אשר',
      reject: 'דחה',
      sendMessage: 'שלח הודעה',
      details: 'פרטים',
      addDelivery: 'עדכן אספקה',
      deliveryAmountPlaceholder: 'טונות נוספים',
      remaining: 'נותר',
      delivered: 'סופק',
      of: 'מתוך',
      successApprove: 'ההזמנה אושרה בהצלחה',
      successReject: 'ההזמנה נדחתה',
      successDelivery: 'האספקה עודכנה בהצלחה',
      invalidAmount: 'נא להזין כמות תקינה',
      urgentTitle: 'דורש טיפול מיידי',
      urgentPendingText: '{count} הזמנות ממתינות לאישור',
      urgentNoPending: 'כל ההזמנות מטופלות ✅',
      urgentButton: 'טפל עכשיו',
      statusTitle: '⚡ סטטוס הזמנות',
      statusOpen: 'פתוחות',
      statusInTransit: 'בדרך',
      statusCompleted: 'הושלמו',
      recentSectionTitle: '📋 הזמנות אחרונות',
      viewAllOrders: 'צפה בכל ההזמנות',
      tons: 'טון',
      last50Note: '* מבוסס על 50 ההזמנות האחרונות',
      deliveryNoteNumber: 'מספר תעודת משלוח',
      driverName: 'שם נהג',
      deliveryNotes: 'הערות',
      deliveryDialogTitle: 'עדכון אספקה',
      deliveryNoteRequired: 'יש להזין מספר תעודת משלוח',
      cancel: 'ביטול',
      quantity: 'כמות',
      site: 'אתר',
      timeSlot: 'חלון זמן',
      deliveryType: 'סוג הובלה',
      notes: 'הערות',
      client: 'לקוח',
      product: 'מוצר',
      date: 'תאריך',
    },
    en: {
      title: 'Manager Dashboard',
      recentOrders: 'Recent Orders',
      createOrder: 'Create New Order',
      error: "We couldn't load orders right now. Try again, and if it keeps happening – let Piter know",
      retry: 'Retry',
      pendingSectionTitle: 'Pending Orders',
      partialSectionTitle: 'Partially Delivered Orders',
      approve: 'Approve',
      reject: 'Reject',
      sendMessage: 'Send Message',
      details: 'Details',
      addDelivery: 'Update Delivery',
      deliveryAmountPlaceholder: 'Add tons',
      remaining: 'Remaining',
      delivered: 'Delivered',
      of: 'of',
      successApprove: 'Order approved successfully',
      successReject: 'Order rejected',
      successDelivery: 'Delivery updated successfully',
      invalidAmount: 'Please enter a valid amount',
      urgentTitle: 'Requires Immediate Attention',
      urgentPendingText: '{count} orders waiting for approval',
      urgentNoPending: 'All orders are handled ✅',
      urgentButton: 'Handle now',
      statusTitle: '⚡ Order Status',
      statusOpen: 'Open',
      statusInTransit: 'In Transit',
      statusCompleted: 'Completed',
      recentSectionTitle: '📋 Recent Orders',
      viewAllOrders: 'View all orders',
      tons: 'tons',
      last50Note: '* Based on the last 50 orders',
      deliveryNoteNumber: 'Delivery Note Number',
      driverName: 'Driver Name',
      deliveryNotes: 'Notes',
      deliveryDialogTitle: 'Update Delivery',
      deliveryNoteRequired: 'Delivery note number is required',
      cancel: 'Cancel',
      quantity: 'Quantity',
      site: 'Site',
      timeSlot: 'Time Slot',
      deliveryType: 'Delivery Type',
      notes: 'Notes',
      client: 'Client',
      product: 'Product',
      date: 'Date',
    }
  };

  const t = translations[language];
  const isRTL = language === 'he';
  const managerDisplayName = currentUser?.full_name || currentUser?.email || (language === 'he' ? 'מנהל' : 'Manager');

  useEffect(() => {
    loadOrders();
  }, [retryCount]);

  const createManagerDashboardDeliveryNotification = async (order: OrderType, newDelivered: number, isCompleted: boolean) => {
    try {
      const clientName = getClientName(order, sitesMap, clientsMap);
      const suffix = clientName ? ` - ${clientName}` : '';
      const total = order.quantity_tons || 0;

      const message = isCompleted
        ? `הזמנה #${order.order_number} הושלמה - סופקו ${total} טון${suffix}`
        : `אספקה חלקית להזמנה #${order.order_number} - סופקו ${newDelivered} מתוך ${total} טון${suffix}`;

      const allUsers = await User.list('-created_at', 1000) as unknown as UserType[];
      const managers = allUsers.filter(u => u.role === 'manager');
      const orderCreator = allUsers.find(u => u.email === order.created_by);

      const notifications = [
        ...managers.map(manager =>
          Notification.create({
            recipient_email: manager.email,
            type: isCompleted ? 'order_completed' : 'order_partial_delivery',
            message: message,
            is_read: false,
            order_id: order.order_number
          })
        )
      ];

      if (orderCreator && orderCreator.role === 'client') {
        notifications.push(
          Notification.create({
            recipient_email: orderCreator.email,
            type: isCompleted ? 'order_completed' : 'order_partial_delivery',
            message: message,
            is_read: false,
            order_id: order.order_number
          })
        );
      }

      await Promise.all(notifications);
    } catch (error) {
      console.error('Error creating delivery notification:', error);
    }
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
    console.log('Loading orders...');
    const allOrders = await Order.list('-created_at', 50);
    console.log('Orders loaded successfully:', allOrders?.length || 0);
      
      setOrders(allOrders as unknown as OrderType[] || []);
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

  const handleOpenDeliveryDialog = (order: OrderType) => {
    setSelectedOrderForDelivery(order);
    const delivered = order.delivered_quantity_tons || 0;
    const total = order.quantity_tons || 0;
    const remaining = Math.max(0, total - delivered);

    setDeliveryForm({
      amount: remaining > 0 ? remaining.toString() : '',
      deliveryNoteNumber: '',
      driverName: order.driver_name || '',
      notes: order.delivery_notes || '',
    });
    setDeliveryDialogOpen(true);
  };

  const handleConfirmDelivery = async () => {
    if (!selectedOrderForDelivery) return;

    const added = parseFloat(deliveryForm.amount.replace(',', '.'));
    if (isNaN(added) || added <= 0) {
      toast({
        title: t.invalidAmount,
        variant: 'destructive',
      });
      return;
    }

    if (!deliveryForm.deliveryNoteNumber.trim()) {
      toast({
        title: t.error,
        description: t.deliveryNoteRequired,
        variant: 'destructive',
      });
      return;
    }

    const order = selectedOrderForDelivery;
    try {
      setIsUpdating(order.id);
      const currentDelivered = order.delivered_quantity_tons || 0;
      const newDelivered = Math.min(currentDelivered + added, order.quantity_tons || 0);
      const isCompleted = newDelivered >= (order.quantity_tons || 0);

      await Order.update(order.id, {
        delivered_quantity_tons: newDelivered,
        is_delivered: isCompleted,
        delivered_at: isCompleted ? new Date().toISOString() : order.delivered_at,
        delivery_note_number: deliveryForm.deliveryNoteNumber.trim(),
        driver_name: deliveryForm.driverName.trim() || undefined,
        delivery_notes: deliveryForm.notes.trim() || undefined,
        status: isCompleted ? 'completed' : order.status,
      });

      await createManagerDashboardDeliveryNotification(order, newDelivered, isCompleted);

      toast({
        title: t.successDelivery,
      });

      setDeliveryDialogOpen(false);
      setSelectedOrderForDelivery(null);
      setDeliveryForm({ amount: '', deliveryNoteNumber: '', driverName: '', notes: '' });
      loadOrders();
    } catch (err) {
      console.error('Error updating delivery:', err);
    } finally {
      setIsUpdating(null);
    }
  };

  const handleSendMessage = (order: OrderType) => {
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

  // Calculate derived values
  const pendingOrders = orders.filter(o => o.status === 'pending').slice(0, 5);
  
  const ordersNeedingAttention = orders.filter(o =>
    o.status === 'pending' ||
    (o.status === 'approved' && !o.is_delivered) ||
    (o.delivered_quantity_tons && o.quantity_tons && o.delivered_quantity_tons < o.quantity_tons)
  );
  const attentionCount = ordersNeedingAttention.length;

  const partialOrders = orders.filter(o => 
    (o.status === 'approved' || o.status === 'completed') && 
    !o.is_delivered && 
    o.quantity_tons > (o.delivered_quantity_tons || 0)
  ).slice(0, 10);

  // Status counts calculations
  const checkIsCompleted = (o: OrderType) => {
    return (
      o.status === 'completed' ||
      o.is_delivered === true ||
      (o.delivered_quantity_tons !== undefined && o.quantity_tons !== undefined && o.delivered_quantity_tons >= o.quantity_tons)
    );
  };

  const openOrdersCount = orders.filter(o => !checkIsCompleted(o) && (o.status === 'pending' || o.status === 'approved')).length;
  const inTransitCount = orders.filter(o => !checkIsCompleted(o) && (o.status === 'in_transit' || o.status === 'in-transit')).length;
  const completedThisMonthCount = orders.filter(o => checkIsCompleted(o)).length;

  const recentOrdersList = [...orders]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const getUrgentText = () => {
    if (attentionCount === 0) {
      return language === 'he'
        ? 'אין הזמנות הממתינות לטיפול ✅'
        : 'No orders waiting for attention ✅';
    }
    if (attentionCount === 1) {
      return language === 'he'
        ? 'הזמנה אחת דורשת טיפול'
        : 'One order requires attention';
    }
    // plural
    if (language === 'he') {
      return `${attentionCount.toLocaleString('he-IL')} הזמנות דורשות טיפול`;
    }
    return `${attentionCount.toLocaleString('en-US')} orders require attention`;
  };

  return (
    <Layout title={t.title}>
      <div className="p-3 sm:p-4 md:p-6 pb-24" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Personal Greeting */}
        <div className="mb-6">
          <p className="text-sm text-gray-500 mb-1">
            {language === 'he' ? 'ברוך הבא' : 'Welcome'}
          </p>
          <h1 className="text-xl sm:text-2xl font-bold flex items-baseline gap-2">
            <span>👋</span>
            {language === 'he' ? 'שלום,' : 'Hello,'}
            <span className="text-yellow-600">{managerDisplayName}</span>
          </h1>
        </div>

        {/* Urgent Card */}
        <div className={cn(
          "mb-6 p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300",
          attentionCount > 0 
            ? "border-red-200 bg-red-50" 
            : "border-green-100 bg-green-50/50"
        )}>
          <div className="flex items-center gap-3 flex-1">
            <div className={cn(
              "p-2 rounded-full",
              attentionCount > 0 ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
            )}>
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">{t.urgentTitle}</h3>
              <p className="text-sm text-gray-600">
                {getUrgentText()}
              </p>
            </div>
          </div>
          {attentionCount > 0 && (
            <div className="w-full sm:w-auto flex sm:justify-end">
              <Button 
                size="sm"
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white border-none"
                onClick={() => navigate('/orders?status=pending')}
              >
                {t.urgentButton}
              </Button>
            </div>
          )}
        </div>

        {/* Highlighted Quick Action */}
        <div className="mb-6">
          <Button
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-6"
            onClick={() => navigate('/create-order')}
          >
            <Plus className="w-5 h-5 mr-2" />
            {t.createOrder}
          </Button>
        </div>

        {/* Notifications Card */}
        <div className="mb-6">
          <NotificationsCard />
        </div>

        {/* Order Status Widget */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            {t.statusTitle}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* פתוחות / Open */}
            <Card className="p-4 flex flex-col gap-1 border-orange-100 bg-orange-50 shadow-none">
              <span className="text-xs font-medium text-orange-800 uppercase tracking-wider">
                {t.statusOpen}
              </span>
              <span className="text-2xl font-bold text-orange-700">
                {openOrdersCount}
              </span>
            </Card>

            {/* בדרך / In Transit */}
            <Card className="p-4 flex flex-col gap-1 border-sky-100 bg-sky-50 shadow-none">
              <span className="text-xs font-medium text-sky-800 uppercase tracking-wider">
                {t.statusInTransit}
              </span>
              <span className="text-2xl font-bold text-sky-700">
                {inTransitCount}
              </span>
            </Card>

            {/* הושלמו / Completed */}
            <Card className="p-4 flex flex-col gap-1 border-emerald-100 bg-emerald-50 shadow-none">
              <span className="text-xs font-medium text-emerald-800 uppercase tracking-wider">
                {t.statusCompleted}
              </span>
              <span className="text-2xl font-bold text-emerald-700">
                {completedThisMonthCount}
              </span>
            </Card>
          </div>
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
                  <div key={order.id} className="flex flex-col border-b border-gray-100 last:border-0">
                    <div 
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">#{order.order_number}</span>
                          <Badge className="bg-orange-100 text-orange-700 border-none px-2 py-0.5 text-[10px] font-bold">
                            {language === 'he' ? 'ממתין' : 'Pending'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 font-medium">
                          {getClientName(order, sitesMap, clientsMap)}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Package className="w-3 h-3" />
                            {getProductName(order.product_id, productsMap, language)}
                          </span>
                          <span>•</span>
                          <span>{order.quantity_tons} {t.tons}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatOrderDate(order.delivery_date, language)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                          onClick={() => handleStatusUpdate(order.id, 'rejected')}
                          disabled={isUpdating === order.id}
                          title={t.reject}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="h-9 w-9 p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                          onClick={() => handleSendMessage(order)}
                          title={t.sendMessage}
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          className="h-9 px-4 bg-green-600 hover:bg-green-700 text-white border-none gap-2 font-bold"
                          onClick={() => handleStatusUpdate(order.id, 'approved')}
                          disabled={isUpdating === order.id}
                        >
                          <Check className="w-4 h-4" />
                          <span className="hidden sm:inline">{t.approve}</span>
                        </Button>
                      </div>
                    </div>
                    
                    {/* Expanded Details */}
                    {expandedOrderId === order.id && (
                      <div className="px-4 pb-4 pt-0 bg-gray-50/50 animate-in slide-in-from-top-2 duration-200">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-3 bg-white rounded-lg border border-gray-100 shadow-sm text-sm">
                          <div>
                            <p className="text-gray-500 text-[10px] uppercase font-bold mb-0.5">{t.client}</p>
                            <p className="font-medium text-gray-900 truncate">{getClientName(order, sitesMap, clientsMap)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-[10px] uppercase font-bold mb-0.5">{t.site}</p>
                            <p className="font-medium text-gray-900 truncate">{getSiteName(order.site_id, sitesMap, language)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-[10px] uppercase font-bold mb-0.5">{t.product}</p>
                            <p className="font-medium text-gray-900 truncate">{getProductName(order.product_id, productsMap, language)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-[10px] uppercase font-bold mb-0.5">{t.quantity}</p>
                            <p className="font-medium text-gray-900">{order.quantity_tons} {t.tons}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-[10px] uppercase font-bold mb-0.5">{t.date}</p>
                            <p className="font-medium text-gray-900">{formatOrderDate(order.delivery_date, language)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-[10px] uppercase font-bold mb-0.5">{t.timeSlot}</p>
                            <p className="font-medium text-gray-900">{order.delivery_time_slot || '-'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-[10px] uppercase font-bold mb-0.5">{t.deliveryType}</p>
                            <p className="font-medium text-gray-900">{order.delivery_type || '-'}</p>
                          </div>
                          {order.notes && (
                            <div className="col-span-2 sm:col-span-4">
                              <p className="text-gray-500 text-[10px] uppercase font-bold mb-0.5">{t.notes}</p>
                              <p className="font-medium text-gray-900">{order.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="p-3 bg-gray-50 border-t flex justify-center">
                <Button 
                  variant="link" 
                  size="sm" 
                  className="text-gray-600 hover:text-gray-900 font-medium h-auto py-0"
                  onClick={() => navigate('/orders?status=pending')}
                >
                  {t.viewAllOrders}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Partially Delivered Orders */}
        {partialOrders.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5 text-sky-600" />
              {t.partialSectionTitle}
            </h2>
            <div className="space-y-3">
              {partialOrders.map(order => {
                const delivered = order.delivered_quantity_tons || 0;
                const total = order.quantity_tons || 0;
                const progress = (delivered / total) * 100;

                return (
                  <Card key={order.id} className="industrial-card overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-gray-900">#{order.order_number}</span>
                            <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                              {Math.round(progress)}% {t.delivered}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 font-medium">
                            {getClientName(order, sitesMap, clientsMap)}
                          </p>
                          <div className="text-xs text-gray-500 mb-2">
                            {getProductName(order.product_id, productsMap, language)} • {total} {t.tons}
                          </div>
                          
                          {/* Progress Bar */}
                          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-sky-500 rounded-full transition-all duration-500" 
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] text-gray-500 font-medium">
                            <span>{delivered} {t.delivered}</span>
                            <span>{total - delivered} {t.remaining}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 sm:pt-0 pt-2 border-t sm:border-0">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-9 px-3 gap-2 text-gray-600 border-gray-200"
                            onClick={() => handleSendMessage(order)}
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span className="sm:inline hidden">{t.sendMessage}</span>
                          </Button>
                          <Button 
                            size="sm" 
                            className="h-9 px-4 bg-sky-600 hover:bg-sky-700 text-white border-none gap-2 font-bold"
                            onClick={() => handleOpenDeliveryDialog(order)}
                            disabled={isUpdating === order.id}
                          >
                            <Plus className="w-4 h-4" />
                            {t.addDelivery}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Orders Overview */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              {t.recentSectionTitle}
            </h2>
            <Button 
              variant="link" 
              size="sm" 
              className="text-yellow-600 hover:text-yellow-700 font-bold p-0 h-auto"
              onClick={() => navigate('/orders')}
            >
              {t.viewAllOrders}
            </Button>
          </div>
          <Card className="industrial-card overflow-hidden">
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                {recentOrdersList.map(order => {
                  const isCompleted =
                    order.status === 'completed' ||
                    (order as any).is_delivered === true ||
                    ((order as any).delivered_quantity_tons !== undefined &&
                      order.quantity_tons !== undefined &&
                      (order as any).delivered_quantity_tons >= order.quantity_tons);

                  const effectiveStatus = isCompleted ? 'completed' : order.status;
                  const status = getStatusConfig(effectiveStatus, language);
                  return (
                    <div 
                      key={order.id} 
                      className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/orders?search=${order.order_number}`)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-gray-900">#{order.order_number}</span>
                        <div className={cn("px-2 py-1 rounded text-xs font-bold border shadow-sm", status.className)}>
                          {status.label}
                        </div>
                      </div>
                      <div className="text-sm text-gray-700 font-medium mb-1">
                        {getClientName(order, sitesMap, clientsMap)}
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{getProductName(order.product_id, productsMap, language)} • {order.quantity_tons} {t.tons}</span>
                        <span>{formatOrderDate(order.created_at, language)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          <p className="text-[10px] text-gray-400 mt-3 text-center italic">
            {t.last50Note}
          </p>
        </div>
      </div>

      {/* Delivery Update Dialog */}
      <Dialog open={deliveryDialogOpen} onOpenChange={setDeliveryDialogOpen}>
        <DialogContent className="sm:max-w-[425px]" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>{t.deliveryDialogTitle}</DialogTitle>
            <DialogDescription>
              {selectedOrderForDelivery ? `הזמנה #${selectedOrderForDelivery.order_number} - ${getClientName(selectedOrderForDelivery, sitesMap, clientsMap)}` : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">{t.quantity} ({t.tons})</Label>
              <Input
                id="amount"
                type="text"
                inputMode="decimal"
                value={deliveryForm.amount}
                onChange={(e) => setDeliveryForm({ ...deliveryForm, amount: e.target.value })}
                placeholder={t.deliveryAmountPlaceholder}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="deliveryNoteNumber">{t.deliveryNoteNumber} *</Label>
              <Input
                id="deliveryNoteNumber"
                value={deliveryForm.deliveryNoteNumber}
                onChange={(e) => setDeliveryForm({ ...deliveryForm, deliveryNoteNumber: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="driverName">{t.driverName}</Label>
              <Input
                id="driverName"
                value={deliveryForm.driverName}
                onChange={(e) => setDeliveryForm({ ...deliveryForm, driverName: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">{t.deliveryNotes}</Label>
              <Textarea
                id="notes"
                value={deliveryForm.notes}
                onChange={(e) => setDeliveryForm({ ...deliveryForm, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeliveryDialogOpen(false)}>
              {t.cancel}
            </Button>
            <Button 
              className="bg-sky-600 hover:bg-sky-700 text-white font-bold" 
              onClick={handleConfirmDelivery}
              disabled={isUpdating === selectedOrderForDelivery?.id}
            >
              {t.addDelivery}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default ManagerDashboard;
