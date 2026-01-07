import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Order } from '@/entities';
import type { Order as OrderType } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
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
      invalidAmount: 'נא להזין כמות תקינה',
      urgentTitle: 'דורש טיפול מיידי',
      urgentPendingText: '{count} הזמנות ממתינות לאישור',
      urgentNoPending: 'אין הזמנות הממתינות לטיפול ✅',
      urgentButton: 'טפל עכשיו',
      thisWeekTitle: '📊 השבוע',
      statNewOrders: 'הזמנות חדשות',
      statTonsDelivered: 'טונות סופקו',
      statAvgRating: 'דירוג ממוצע',
      noData: 'אין נתונים',
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
      thisWeekTitle: '📊 This Week',
      statNewOrders: 'New Orders',
      statTonsDelivered: 'Tons Delivered',
      statAvgRating: 'Average Rating',
      noData: 'No data',
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
  }, [retryCount]);

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

  // Stats calculations for the last 7 days
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);

  const isWithinLast7Days = (dateString?: string) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    return date >= sevenDaysAgo;
  };

  const weeklyNewOrders = orders.filter(o => isWithinLast7Days(o.created_at));
  const weeklyNewCount = weeklyNewOrders.length;

  const weeklyDeliveredOrders = orders.filter(o => 
    (o.is_delivered || o.status === 'completed') && 
    (isWithinLast7Days(o.actual_delivery_date) || isWithinLast7Days(o.delivered_at) || isWithinLast7Days(o.updated_at))
  );

  const weeklyTonsDelivered = weeklyDeliveredOrders.reduce((sum, o) =>
    sum + (o.delivered_quantity_tons || o.quantity_tons || 0),
    0
  );

  const weeklyRatedOrders = orders.filter(o => o.rating && isWithinLast7Days(o.updated_at));
  const avgRating = weeklyRatedOrders.length
    ? weeklyRatedOrders.reduce((sum, o) => sum + (o.rating || 0), 0) / weeklyRatedOrders.length
    : 0;

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

        {/* Weekly Stats Section */}
        <div className="mb-8">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-1">
            {t.thisWeekTitle}
          </h2>
          <p className="text-xs text-gray-500 mb-3">
            {t.last50Note}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="industrial-card p-4 flex flex-col gap-1 border-gray-100 hover:border-yellow-200 transition-colors">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5" />
                📦 {t.statNewOrders}
              </span>
              <span className="text-2xl font-bold text-gray-900">
                {weeklyNewCount.toLocaleString()}
              </span>
            </Card>

            <Card className="industrial-card p-4 flex flex-col gap-1 border-gray-100 hover:border-yellow-200 transition-colors">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                ⚖️ {t.statTonsDelivered}
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gray-900">
                  {weeklyTonsDelivered > 0 ? weeklyTonsDelivered.toFixed(1) : '0.0'}
                </span>
                <span className="text-sm text-gray-500 font-medium">{t.tons}</span>
              </div>
            </Card>

            <Card className="industrial-card p-4 flex flex-col gap-1 border-gray-100 hover:border-yellow-200 transition-colors">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5" />
                ⭐ {t.statAvgRating}
              </span>
              {avgRating > 0 ? (
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {avgRating.toFixed(1)}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-yellow-500 mt-1">
                    {"★".repeat(Math.round(avgRating))}
                    {"☆".repeat(5 - Math.round(avgRating))}
                    <span className="text-gray-400 ml-1">({weeklyRatedOrders.length})</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col">
                  <span className="text-gray-400 text-sm font-medium">{t.noData}</span>
                  <div className="flex text-gray-200 text-xs mt-1">
                    {"☆☆☆☆☆"}
                  </div>
                </div>
              )}
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

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-1 w-full">
                        <Button 
                          size="sm" 
                          className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto sm:flex-none whitespace-nowrap h-10"
                          onClick={() => handleOpenDeliveryDialog(order)}
                          disabled={isUpdating === order.id}
                        >
                          {t.addDelivery}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-gray-400 p-2 h-10 w-10 flex-shrink-0 self-center sm:self-auto"
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

        {/* Recent Orders Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              {t.recentSectionTitle}
            </h2>
            <Button 
              variant="link" 
              className="text-blue-600 text-sm p-0 h-auto font-semibold"
              onClick={() => navigate('/orders')}
            >
              {t.viewAllOrders}
            </Button>
          </div>
          
          <div className="space-y-3">
            {loading ? (
              <div className="space-y-3">
                <OrderCardSkeleton />
                <OrderCardSkeleton />
                <OrderCardSkeleton />
              </div>
            ) : (
              <>
                {recentOrdersList.length > 0 ? (
                  recentOrdersList.map(order => {
                    const effectiveStatus = (order.status === 'completed' || order.is_delivered)
                      ? 'completed'
                      : order.status;
                    const status = getStatusConfig(effectiveStatus, language);
                    return (
                      <Card 
                        key={order.id} 
                        className="industrial-card hover:border-yellow-300 transition-colors cursor-pointer"
                        onClick={() => navigate('/orders')}
                      >
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="font-bold truncate text-gray-900">
                                #{order.order_number} - {getClientName(order, sitesMap, clientsMap)}
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5 truncate">
                                {getProductName(order.product_id, productsMap, language)} • {order.quantity_tons}ט' • {formatOrderDate(order.delivery_date, language)}
                              </div>
                            </div>
                            <div className={cn(
                              "px-2 py-1 rounded text-[10px] sm:text-xs font-bold whitespace-nowrap",
                              status.className
                            )}>
                              {status.label}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                ) : (
                  <Card className="industrial-card p-12 text-center border-dashed border-2">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      עדיין אין הזמנות במערכת
                    </h3>
                    <p className="text-gray-500 mb-4">
                      התחל על ידי יצירת ההזמנה הראשונה
                    </p>
                    <Button 
                      onClick={() => navigate('/create-order')}
                      className="bg-yellow-500 hover:bg-yellow-600"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      צור הזמנה ראשונה
                    </Button>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <Dialog
        open={deliveryDialogOpen}
        onOpenChange={(open) => {
          setDeliveryDialogOpen(open);
          if (!open) {
            setSelectedOrderForDelivery(null);
          }
        }}
      >
        <DialogContent dir={isRTL ? 'rtl' : 'ltr'} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.deliveryDialogTitle}</DialogTitle>
            {selectedOrderForDelivery && (
              <DialogDescription className="text-gray-500 mt-1">
                #{selectedOrderForDelivery.order_number} — {getClientName(selectedOrderForDelivery, sitesMap, clientsMap)}
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div>
              <Label className="block mb-1">{t.quantity}</Label>
              <Input
                type="number"
                inputMode="decimal"
                value={deliveryForm.amount}
                onChange={(e) => setDeliveryForm((prev) => ({ ...prev, amount: e.target.value }))}
                placeholder={t.deliveryAmountPlaceholder}
              />
            </div>

            <div>
              <Label className="block mb-1">{t.deliveryNoteNumber}</Label>
              <Input
                value={deliveryForm.deliveryNoteNumber}
                onChange={(e) => setDeliveryForm((prev) => ({ ...prev, deliveryNoteNumber: e.target.value }))}
                placeholder={t.deliveryNoteNumber}
              />
            </div>

            <div>
              <Label className="block mb-1">{t.driverName}</Label>
              <Input
                value={deliveryForm.driverName}
                onChange={(e) => setDeliveryForm((prev) => ({ ...prev, driverName: e.target.value }))}
                placeholder={t.driverName}
              />
            </div>

            <div>
              <Label className="block mb-1">{t.deliveryNotes}</Label>
              <Textarea
                value={deliveryForm.notes}
                onChange={(e) => setDeliveryForm((prev) => ({ ...prev, notes: e.target.value }))}
                className="min-h-[80px]"
                placeholder={t.deliveryNotes}
              />
            </div>
          </div>

          <DialogFooter className={cn("gap-2 sm:gap-0", isRTL ? 'flex-row-reverse' : '')}>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDeliveryDialogOpen(false);
                setSelectedOrderForDelivery(null);
              }}
            >
              {t.cancel}
            </Button>
            <Button
              type="button"
              onClick={handleConfirmDelivery}
              disabled={isUpdating === selectedOrderForDelivery?.id}
            >
              {isUpdating === selectedOrderForDelivery?.id
                ? language === 'he' ? 'שומר...' : 'Saving...'
                : t.addDelivery}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default ManagerDashboard;
