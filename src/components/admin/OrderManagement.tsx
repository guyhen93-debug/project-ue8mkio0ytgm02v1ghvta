import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Order, Site, Client } from '@/entities';
import { useLanguage } from '@/contexts/LanguageContext';
import { Search, RefreshCw, CheckCircle, XCircle, Clock, Package, MapPin, Calendar, Sunrise, Sunset, Truck, FileText } from 'lucide-react';
import OrderEditDialog from './OrderEditDialog';

const PRODUCTS = [
  { id: 'p_new_sand_0_4', name_he: 'חול חדש 0-4', name_en: 'New Sand 0-4' },
  { id: 'p_new_sand_0_6', name_he: 'חול חדש 0-6', name_en: 'New Sand 0-6' },
  { id: 'p_washed_sand_0_2', name_he: 'חול שטוף 0-2', name_en: 'Washed Sand 0-2' },
  { id: 'p_washed_sand_0_4', name_he: 'חול שטוף 0-4', name_en: 'Washed Sand 0-4' },
  { id: 'granite_4_10', name_he: 'גרניט 4-10', name_en: 'Granite 4-10' },
  { id: 'granite_10_20', name_he: 'גרניט 10-20', name_en: 'Granite 10-20' },
  { id: 'granite_20_40', name_he: 'גרניט 20-40', name_en: 'Granite 20-40' },
  { id: 'granite_10_60', name_he: 'גרניט 10-60', name_en: 'Granite 10-60' },
  { id: 'granite_40_80', name_he: 'גרניט 40-80', name_en: 'Granite 40-80' },
  { id: 'granite_dust', name_he: 'אבק גרניט', name_en: 'Granite Dust' },
  { id: 'gravel_4_25', name_he: 'חצץ 4-25', name_en: 'Gravel 4-25' },
  { id: 'gravel_25_60', name_he: 'חצץ 25-60', name_en: 'Gravel 25-60' },
  { id: 'gravel_dust', name_he: 'אבק חצץ', name_en: 'Gravel Dust' }
];

export const OrderManagement: React.FC = () => {
  const { language } = useLanguage();
  const [orders, setOrders] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const translations = {
    he: {
      title: 'ניהול הזמנות',
      search: 'חיפוש הזמנה...',
      refresh: 'רענן',
      filterAll: 'הכל',
      filterPending: 'ממתין',
      filterApproved: 'מאושר',
      filterRejected: 'נדחה',
      filterCompleted: 'הושלם',
      orderNumber: 'הזמנה',
      client: 'לקוח',
      site: 'אתר',
      product: 'מוצר',
      quantity: 'כמות',
      deliveryDate: 'תאריך אספקה',
      timeWindow: 'חלון זמן',
      morning: 'בוקר',
      afternoon: 'אחר הצהריים',
      deliveryMethod: 'שיטת אספקה',
      self: 'עצמי',
      external: 'חיצוני',
      notes: 'הערות',
      status: 'סטטוס',
      pending: 'ממתין לאישור',
      approved: 'אושר',
      rejected: 'נדחה',
      completed: 'הושלם',
      actions: 'פעולות',
      approve: 'אשר',
      reject: 'דחה',
      markCompleted: 'סמן כהושלם',
      returnToPending: 'החזר לממתין',
      returnToApproved: 'החזר לאושר',
      edit: 'ערוך',
      noOrders: 'אין הזמנות במערכת',
      orderApproved: 'הזמנה אושרה בהצלחה',
      orderRejected: 'הזמנה נדחתה',
      orderCompleted: 'הזמנה סומנה כהושלמה',
      orderUpdated: 'הזמנה עודכנה בהצלחה',
      error: 'שגיאה',
      tons: 'טון',
      createdAt: 'נוצר ב'
    },
    en: {
      title: 'Order Management',
      search: 'Search order...',
      refresh: 'Refresh',
      filterAll: 'All',
      filterPending: 'Pending',
      filterApproved: 'Approved',
      filterRejected: 'Rejected',
      filterCompleted: 'Completed',
      orderNumber: 'Order',
      client: 'Client',
      site: 'Site',
      product: 'Product',
      quantity: 'Quantity',
      deliveryDate: 'Delivery Date',
      timeWindow: 'Time Window',
      morning: 'Morning',
      afternoon: 'Afternoon',
      deliveryMethod: 'Delivery Method',
      self: 'Self',
      external: 'External',
      notes: 'Notes',
      status: 'Status',
      pending: 'Pending Approval',
      approved: 'Approved',
      rejected: 'Rejected',
      completed: 'Completed',
      actions: 'Actions',
      approve: 'Approve',
      reject: 'Reject',
      markCompleted: 'Mark Completed',
      returnToPending: 'Return to Pending',
      returnToApproved: 'Return to Approved',
      edit: 'Edit',
      noOrders: 'No orders in the system',
      orderApproved: 'Order approved successfully',
      orderRejected: 'Order rejected',
      orderCompleted: 'Order marked as completed',
      orderUpdated: 'Order updated successfully',
      error: 'Error',
      tons: 'tons',
      createdAt: 'Created at'
    }
  };

  const t = translations[language];
  const isRTL = language === 'he';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordersData, sitesData, clientsData] = await Promise.all([
        Order.list('-created_at', 1000),
        Site.list('-created_at', 1000),
        Client.list('-created_at', 1000)
      ]);
      setOrders(ordersData);
      setSites(sitesData);
      setClients(clientsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: t.error,
        description: 'Failed to load data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await Order.update(orderId, { status: newStatus });
      const messages = {
        approved: t.orderApproved,
        rejected: t.orderRejected,
        completed: t.orderCompleted,
        pending: t.orderUpdated
      };
      toast({ title: messages[newStatus] || t.orderUpdated });
      loadData();
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: t.error,
        description: 'Failed to update order',
        variant: 'destructive'
      });
    }
  };

  const getProductName = (productId: string) => {
    const product = PRODUCTS.find(p => p.id === productId);
    return product ? (language === 'he' ? product.name_he : product.name_en) : productId;
  };

  const getSiteName = (siteId: string) => {
    const site = sites.find(s => s.id === siteId);
    return site?.site_name || t.site;
  };

  const getClientName = (siteId: string) => {
    const site = sites.find(s => s.id === siteId);
    if (!site) return '';
    const client = clients.find(c => c.id === site.client_id);
    return client?.name || '';
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

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getSiteName(order.site_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getProductName(order.product_id).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1">
          <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4`} />
          <Input
            placeholder={t.search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={isRTL ? 'pr-10' : 'pl-10'}
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.filterAll}</SelectItem>
              <SelectItem value="pending">{t.filterPending}</SelectItem>
              <SelectItem value="approved">{t.filterApproved}</SelectItem>
              <SelectItem value="rejected">{t.filterRejected}</SelectItem>
              <SelectItem value="completed">{t.filterCompleted}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadData} size="icon" className="flex-shrink-0">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto"></div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">{t.noOrders}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const TimeIcon = order.delivery_window === 'morning' ? Sunrise : Sunset;
            
            return (
              <Card key={order.id}>
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
                      <p className="text-xs sm:text-sm text-gray-600">
                        {getClientName(order.site_id)}
                      </p>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 mb-3">
                    {order.site_id && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <span className="text-gray-500">{t.site}:</span>
                        <span className="font-medium text-gray-900">{getSiteName(order.site_id)}</span>
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
                    {order.delivery_method && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <Truck className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <span className="text-gray-500">{t.deliveryMethod}:</span>
                        <span className="font-medium text-gray-900">
                          {order.delivery_method === 'self' ? t.self : t.external}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {order.notes && (
                    <div className="mb-3 pt-3 border-t border-gray-100">
                      <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500">{t.notes}:</p>
                          <p className="text-xs sm:text-sm text-gray-700 mt-1">{order.notes}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t border-gray-100">
                    {order.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => updateOrderStatus(order.id, 'approved')}
                          className="bg-green-600 hover:bg-green-700 text-white flex-1"
                        >
                          <CheckCircle className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                          {t.approve}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateOrderStatus(order.id, 'rejected')}
                          className="flex-1"
                        >
                          <XCircle className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                          {t.reject}
                        </Button>
                      </>
                    )}
                    {order.status === 'approved' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => updateOrderStatus(order.id, 'completed')}
                          className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
                        >
                          <CheckCircle className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                          {t.markCompleted}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateOrderStatus(order.id, 'pending')}
                          className="flex-1"
                        >
                          <Clock className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                          {t.returnToPending}
                        </Button>
                      </>
                    )}
                    {order.status === 'rejected' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateOrderStatus(order.id, 'pending')}
                        className="w-full"
                      >
                        <Clock className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                        {t.returnToPending}
                      </Button>
                    )}
                    {order.status === 'completed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateOrderStatus(order.id, 'approved')}
                        className="w-full"
                      >
                        <Clock className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                        {t.returnToApproved}
                      </Button>
                    )}
                  </div>

                  {/* Created Date */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-400">
                      {t.createdAt} {formatDate(order.created_at)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      {editingOrder && (
        <OrderEditDialog
          order={editingOrder}
          isOpen={isEditDialogOpen}
          onClose={() => {
            setEditingOrder(null);
            setIsEditDialogOpen(false);
          }}
          onSave={() => {
            setEditingOrder(null);
            setIsEditDialogOpen(false);
            loadData();
          }}
        />
      )}
    </div>
  );
};