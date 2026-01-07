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
      title: 'דשבורד מתל',
      recentOrders: 'הזמנות אחרונות',
      createOrder: 'צור הזמנה חדשה',
      error: 'שגיאה בטעינת הזמנות',
      retry: 'נסו שוב',
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
      invalidAmount: 'נא להזין כמות תקינה',
      urgentTitle: 'דורש טיפול מיידי',
      urgentPendingText: '{count} הזמנות ממתינות לאישור',
      urgentNoPending: 'אין הזמנות הממתינות לטיפול ✅',
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
      invalidAmount: 'Please enter a valid amount',
      urgentTitle: 'Requires Immediate Attention',
      urgentPendingText: '{count} orders waiting for approval',
      urgentNoPending: 'No orders waiting for attention ✅',
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
    }
  };

  const t = translations[language];
  const isRTL = language === 'he';

  useEffect(() => {
    loadOrders();
    markNotificationsAsRead();
  }, [retryCount]);

  const markNotificationsAsRead = async () => {
    try {
      const user = currentUser || await User.me();
      if (!user) return;

      const unread = await Notification.filter({ recipient_email: user.email, is_read: false }, '-created_at', 100);
      if (unread.length > 0) {
        await Promise.all(unread.map(n => Notification.update(n.id, { is_read: true })));
        window.dispatchEvent(new Event('notifications-updated'));
      }
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

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
  const totalPendingCount = orders.filter(o => o.status === 'pending').length;

  const partialOrders = orders.filter(o => 
    (o.status === 'approved' || o.status === 'completed') && 
    !o.is_delivered && 
    o.quantity_tons > (o.delivered_quantity_tons || 0)
  ).slice(0, 10);

  // Status counts calculations
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const isInCurrentMonth = (dateString?: string) => {
    if (!dateString) return false;
    const d = new Date(dateString);
    return d >= startOfMonth && d <= now;
  };

  const checkIsCompleted = (o: OrderType) => {
    return (
      o.status === 'completed' ||
      o.is_delivered === true ||
      (o.delivered_quantity_tons !== undefined && o.quantity_tons !== undefined && o.delivered_quantity_tons >= o.quantity_tons)
    );
  };

  const openOrdersCount = orders.filter(o => !checkIsCompleted(o) && (o.status === 'pending' || o.status === 'approved')).length;
  const inTransitCount = orders.filter(o => !checkIsCompleted(o) && (o.status === 'in_transit' || o.status === 'in-transit')).length;
  const completedThisMonthCount = orders.filter(o =>
    checkIsCompleted(o) &&
    (isInCurrentMonth(o.delivery_date) || isInCurrentMonth(o.actual_delivery_date) || isInCurrentMonth(o.created_at))
  ).length;

  const recentOrdersList = [...orders]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const getUrgentPendingText = () => {
    if (totalPendingCount === 0) return t.urgentNoPending;
    
    if (language === 'he') {
      if (totalPendingCount === 1) return "הזמנה אחת ממתינה לאישור";
      return `${totalPendingCount.toLocaleString('he-IL')} הזמנות ממתינות לאישור`;
    }
    
    if (totalPendingCount === 1) return "1 order waiting for approval";
    return `${totalPendingCount.toLocaleString('en-US')} orders waiting for approval`;
  };

  return (
    <Layout title={t.title}>
      <div className="p-3 sm:p-4 md:p-6 pb-24" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Urgent Card */}
        <div className={cn(
          "mb-6 p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300",
          totalPendingCount > 0 
            ? "border-red-200 bg-red-50" 
            : "border-green-100 bg-green-50/50"
        )}>
          <div className="flex items-center gap-3 flex-1">
            <div className={cn(
              "p-2 rounded-full",
              totalPendingCount > 0 ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
            )}>
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">{t.urgentTitle}</h3>
              <p className="text-sm text-gray-600">
                {getUrgentPendingText()}
              </p>
            </div>
          </div>
          {totalPendingCount > 0 && (
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
            צור הזמנה חדשה
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

            {/* הושלמו / Completed this month */}
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
                  <div key={order.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">#{order.order_number}</span>
                        <Badge className="bg-orange-100 text-orange-700 border-none px-2 py-0.5 text-[10px] font-bold">
                          {t.pendingSectionTitle}
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
                        <span className="flex items-center gap-1 font-bold text-gray-700">
                          <TrendingUp className="w-3 h-3" />
                          {order.quantity_tons} {t.tons}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatOrderDate(order.delivery_date, language)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white h-9 px-4"
                        onClick={() => handleStatusUpdate(order.id, 'approved')}
                        disabled={isUpdating === order.id}
                      >
                        <Check className="w-4 h-4 mr-1.5" />
                        {t.approve}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50 h-9 px-4"
                        onClick={() => handleStatusUpdate(order.id, 'rejected')}
                        disabled={isUpdating === order.id}
                      >
                        <X className="w-4 h-4 mr-1.5" />
                        {t.reject}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Partial Delivery Section */}
        {partialOrders.length > 0 && (
          <Card className="industrial-card mb-8 overflow-hidden">
            <CardHeader className="p-4 border-b border-gray-100">
              <CardTitle className="text-lg flex items-center gap-2 text-gray-900">
                <Truck className="w-5 h-5 text-blue-500" />
                {t.partialSectionTitle}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                {partialOrders.map(order => {
                  const delivered = order.delivered_quantity_tons || 0;
                  const total = order.quantity_tons || 0;
                  const percent = Math.round((delivered / total) * 100);

                  return (
                    <div key={order.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900">#{order.order_number}</span>
                            <span className="text-xs text-gray-500">•</span>
                            <span className="text-sm text-gray-700">{getClientName(order, sitesMap, clientsMap)}</span>
                          </div>
                          <span className="text-xs font-bold text-blue-600">{percent}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium">
                          <span>{t.delivered}: {delivered} {t.tons}</span>
                          <span className="text-gray-400">{t.remaining}: {(total - delivered).toFixed(1)} {t.tons}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 px-4 border-blue-200 text-blue-700 hover:bg-blue-50"
                          onClick={() => handleOpenDeliveryDialog(order)}
                        >
                          <Truck className="w-4 h-4 mr-1.5" />
                          {t.addDelivery}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
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

        {/* Recent Orders List */}
        <div className="mb-4 flex items-center justify-between px-1">
          <h2 className="text-lg font-bold text-gray-900">{t.recentSectionTitle}</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-yellow-700 hover:text-yellow-800 hover:bg-yellow-50 font-semibold"
            onClick={() => navigate('/orders')}
          >
            {t.viewAllOrders}
          </Button>
        </div>

        <div className="space-y-4">
          {loading ? (
            Array(3).fill(0).map((_, i) => <OrderCardSkeleton key={i} />)
          ) : recentOrdersList.length > 0 ? (
            recentOrdersList.map(order => {
              const statusConfig = getStatusConfig(order.status, language);
              return (
                <Card 
                  key={order.id} 
                  className="industrial-card hover:border-yellow-200 transition-all cursor-pointer"
                  onClick={() => navigate(`/orders?id=${order.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">#{order.order_number}</span>
                          <Badge className={cn("px-2 py-0.5 text-[10px] font-bold border-none", statusConfig.className)}>
                            {statusConfig.label}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium text-gray-700">
                          {getClientName(order, sitesMap, clientsMap)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">{formatOrderDate(order.delivery_date, language)}</p>
                        <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">
                          {order.delivery_window === 'morning' ? (language === 'he' ? 'בוקר' : 'Morning') : (language === 'he' ? 'צהריים' : 'Afternoon')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-600 pt-2 border-t border-gray-50">
                      <div className="flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-gray-400" />
                        <span className="truncate max-w-[120px]">{getProductName(order.product_id, productsMap, language)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 ml-auto">
                        <TrendingUp className="w-3.5 h-3.5 text-gray-400" />
                        <span className="font-bold">{order.quantity_tons} {t.tons}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <div className="bg-white border border-dashed border-gray-200 rounded-xl py-12 text-center">
              <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">עדיין אין הזמנות במערכת</h3>
              <p className="text-gray-500 mb-6 px-8 max-w-sm mx-auto">התחל על ידי יצירת ההזמנה הראשונה ללקוחות שלך</p>
              <Button 
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 h-12"
                onClick={() => navigate('/create-order')}
              >
                <Plus className="w-5 h-5 mr-2" />
                צור הזמנה ראשונה
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Delivery Update Dialog */}
      <Dialog open={deliveryDialogOpen} onOpenChange={setDeliveryDialogOpen}>
        <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden border-none rounded-2xl shadow-2xl" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="bg-yellow-500 p-6 text-black">
            <DialogHeader>
              <DialogTitle className="text-xl font-black flex items-center gap-2">
                <Truck className="w-6 h-6" />
                {t.deliveryDialogTitle}
              </DialogTitle>
              <DialogDescription className="text-black/70 font-medium">
                #{selectedOrderForDelivery?.order_number} - {getClientName(selectedOrderForDelivery, sitesMap, clientsMap)}
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-6 space-y-5 bg-white">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-yellow-600" />
                  {t.quantity} ({t.tons})
                </Label>
                <Input
                  id="amount"
                  type="text"
                  inputMode="decimal"
                  value={deliveryForm.amount}
                  onChange={(e) => setDeliveryForm({ ...deliveryForm, amount: e.target.value })}
                  placeholder="0.0"
                  className="h-12 border-gray-200 focus:border-yellow-500 focus:ring-yellow-500/20 text-lg font-bold rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="note" className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-yellow-600" />
                  {t.deliveryNoteNumber}
                </Label>
                <Input
                  id="note"
                  value={deliveryForm.deliveryNoteNumber}
                  onChange={(e) => setDeliveryForm({ ...deliveryForm, deliveryNoteNumber: e.target.value })}
                  placeholder="---"
                  className="h-12 border-gray-200 focus:border-yellow-500 focus:ring-yellow-500/20 text-lg font-bold rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="driver" className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-yellow-600" />
                {t.driverName}
              </Label>
              <Input
                id="driver"
                value={deliveryForm.driverName}
                onChange={(e) => setDeliveryForm({ ...deliveryForm, driverName: e.target.value })}
                placeholder="---"
                className="h-12 border-gray-200 focus:border-yellow-500 focus:ring-yellow-500/20 font-medium rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-yellow-600" />
                {t.deliveryNotes}
              </Label>
              <Textarea
                id="notes"
                value={deliveryForm.notes}
                onChange={(e) => setDeliveryForm({ ...deliveryForm, notes: e.target.value })}
                className="min-h-[80px] border-gray-200 focus:border-yellow-500 focus:ring-yellow-500/20 rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="p-6 bg-gray-50 flex sm:flex-row-reverse gap-3 border-t border-gray-100">
            <Button
              className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-black h-12 rounded-xl shadow-lg shadow-yellow-500/20"
              onClick={handleConfirmDelivery}
              disabled={isUpdating === selectedOrderForDelivery?.id}
            >
              {isUpdating === selectedOrderForDelivery?.id ? (
                <Clock className="w-5 h-5 animate-spin" />
              ) : (
                <Check className="w-5 h-5 mr-2" />
              )}
              {t.approve}
            </Button>
            <Button
              variant="ghost"
              className="flex-1 h-12 text-gray-500 font-bold hover:bg-gray-100 rounded-xl"
              onClick={() => setDeliveryDialogOpen(false)}
            >
              {t.cancel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default ManagerDashboard;
