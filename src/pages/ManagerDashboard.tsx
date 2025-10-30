import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { mockDataService } from '@/services/mockDataService';
import { toast } from '@/hooks/use-toast';
import { Package, Calendar, MapPin, Truck, Building, Plus, Minus } from 'lucide-react';

const ManagerDashboard: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [quarryFilter, setQuarryFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [reduceAmount, setReduceAmount] = useState('');
  const [reductionReason, setReductionReason] = useState('');
  const [showReduceDialog, setShowReduceDialog] = useState(false);
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, statusFilter, quarryFilter]);

  const loadOrders = async () => {
    try {
      const allOrders = await mockDataService.getOrders({}, '-created_at');
      setOrders(allOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterOrders = () => {
    let result = [...orders];
    
    if (statusFilter !== 'all') {
      result = result.filter(order => order.status === statusFilter);
    }
    
    if (quarryFilter !== 'all') {
      result = result.filter(order => order.quarry_or_crossing === quarryFilter);
    }
    
    setFilteredOrders(result);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await mockDataService.updateOrder(orderId, { status: newStatus });
      
      // Find the order to get client info
      const order = orders.find(o => o.id === orderId);
      if (order) {
        // Create notification for client
        await mockDataService.createNotification({
          user_id: order.client_id,
          order_id: orderId,
          title: t(`order_${newStatus}`),
          message: t('order_status_notification', { orderNumber: order.order_number, status: t(newStatus) }),
          type: `order_${newStatus}`,
          read: false
        });
      }

      // Reload orders
      await loadOrders();
      
      toast({
        title: t('order_updated'),
        description: t('notification_sent'),
      });
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: t('error'),
        description: t('order_update_failed'),
        variant: 'destructive',
      });
    }
  };

  const handleReduceQuantity = async () => {
    if (!selectedOrder || !reduceAmount || !reductionReason) return;

    try {
      const result = await mockDataService.reduceOrderQuantity(
        selectedOrder.id,
        parseInt(reduceAmount),
        reductionReason,
        user.id
      );

      if (result.success) {
        toast({
          title: t('quantity_reduced'),
          description: t('quantity_reduction_success'),
        });
        setShowReduceDialog(false);
        setReduceAmount('');
        setReductionReason('');
        setSelectedOrder(null);
        await loadOrders();
      } else {
        toast({
          title: t('error'),
          description: t(result.error || 'unknown_error'),
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error reducing quantity:', error);
      toast({
        title: t('error'),
        description: t('unknown_error'),
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusCounts = () => {
    return {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      approved: orders.filter(o => o.status === 'approved').length,
      completed: orders.filter(o => o.status === 'completed').length
    };
  };

  const statusCounts = getStatusCounts();

  if (isLoading) {
    return (
      <Layout title={t('all_orders')}>
        <div className="px-4 py-8">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={t('all_orders')}>
      <div className="px-4 py-6">
        {/* Create New Order Button */}
        <div className="mb-6">
          <Button
            onClick={() => navigate('/create-order')}
            className="w-full h-12 bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-base shadow-lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            {t('create_new_order')}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{statusCounts.total}</div>
              <div className="text-sm text-gray-600">{t('total_orders')}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{statusCounts.pending}</div>
              <div className="text-sm text-gray-600">{t('pending')}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">{t('status')}:</span>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('all_status')}</SelectItem>
                    <SelectItem value="pending">{t('pending')}</SelectItem>
                    <SelectItem value="approved">{t('approved')}</SelectItem>
                    <SelectItem value="rejected">{t('rejected')}</SelectItem>
                    <SelectItem value="completed">{t('completed')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">{t('quarry_crossing')}:</span>
                <Select value={quarryFilter} onValueChange={setQuarryFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="default">{t('default_quarry')}</SelectItem>
                    <SelectItem value="shifolei_har">{t('shifolei_har')}</SelectItem>
                    <SelectItem value="yitzhak_rabin">{t('yitzhak_rabin')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t('no_orders')}
                </h3>
                <p className="text-gray-600">
                  {t('no_orders_filter')}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {t(order.product)}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {order.client_name} • {order.client_company}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {t('order_number')}{order.order_number}
                      </p>
                    </div>
                    <Badge className={getStatusColor(order.status)}>
                      {t(order.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Package className="h-4 w-4" />
                      <span>{order.quantity} {t('tons')}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(order.delivery_date)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-600">
                      <Truck className="h-4 w-4" />
                      <span>{t(order.delivery_type)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate">{order.delivery_location}</span>
                    </div>
                  </div>

                  {/* Distance info */}
                  {order.distance_km && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">{t('distance')}: </span>
                      {order.distance_km} {t('km')}
                    </div>
                  )}

                  {/* Notes Section */}
                  {order.notes && order.notes.trim() && (
                    <div className="pt-2 border-t">
                      <p className="text-sm text-gray-700">
                        <strong>{t('notes')}:</strong> {order.notes_preview || order.notes}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-3 border-t">
                    <Select
                      value={order.status}
                      onValueChange={(value) => updateOrderStatus(order.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">{t('pending')}</SelectItem>
                        <SelectItem value="approved">{t('approved')}</SelectItem>
                        <SelectItem value="rejected">{t('rejected')}</SelectItem>
                        <SelectItem value="completed">{t('completed')}</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowReduceDialog(true);
                      }}
                    >
                      <Minus className="h-4 w-4 mr-1" />
                      {t('reduce_quantity')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Reduce Quantity Dialog */}
        <Dialog open={showReduceDialog} onOpenChange={setShowReduceDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('reduce_quantity')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="reduce_amount">{t('reduce_by_tons')}</Label>
                <Input
                  id="reduce_amount"
                  type="number"
                  min="1"
                  max={selectedOrder?.quantity || 1}
                  value={reduceAmount}
                  onChange={(e) => setReduceAmount(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="reduction_reason">{t('reduction_reason')}</Label>
                <Input
                  id="reduction_reason"
                  value={reductionReason}
                  onChange={(e) => setReductionReason(e.target.value)}
                  placeholder={t('reduction_reason')}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleReduceQuantity}
                  disabled={!reduceAmount || !reductionReason}
                  className="flex-1"
                >
                  {t('confirm_reduction')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowReduceDialog(false)}
                  className="flex-1"
                >
                  {t('cancel')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default ManagerDashboard;