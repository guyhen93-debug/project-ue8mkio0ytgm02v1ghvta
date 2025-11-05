import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { mockDataService } from '@/services/mockDataService';
import { toast } from '@/hooks/use-toast';
import { Edit, Search, Filter, ShoppingCart } from 'lucide-react';
import OrderEditDialog from './OrderEditDialog';

const OrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter]);

  const loadOrders = async () => {
    try {
      const orderList = await mockDataService.getOrders({}, '-created_at');
      setOrders(orderList);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.order_number.toString().includes(searchTerm) ||
        order.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  };

  const handleEditOrder = (order: any) => {
    setEditingOrder(order);
    setShowEditDialog(true);
  };

  const handleOrderSaved = () => {
    loadOrders();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              {t('order_management')}
            </CardTitle>
            <Badge variant="outline">
              {filteredOrders.length} {t('orders')}
            </Badge>
          </div>
          
          {/* Filters */}
          <div className="flex gap-4 mt-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t('search_orders')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('all_statuses')}</SelectItem>
                <SelectItem value="pending">{t('pending')}</SelectItem>
                <SelectItem value="approved">{t('approved')}</SelectItem>
                <SelectItem value="rejected">{t('rejected')}</SelectItem>
                <SelectItem value="completed">{t('completed')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium">
                      {t('order')} #{order.order_number}
                    </h4>
                    <Badge className={getStatusColor(order.status)}>
                      {t(order.status)}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">{t('client')}:</span> {order.client_name}
                    </div>
                    <div>
                      <span className="font-medium">{t('quantity')}:</span> {order.quantity} {t('tons')}
                    </div>
                    <div>
                      <span className="font-medium">{t('delivery_date')}:</span> {formatDate(order.delivery_date)}
                    </div>
                    <div>
                      <span className="font-medium">{t('delivery_type')}:</span> {t(order.delivery_type)}
                    </div>
                  </div>
                  
                  {order.notes && (
                    <p className="text-sm text-gray-500 mt-2 truncate">
                      {order.notes}
                    </p>
                  )}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditOrder(order)}
                  className="ml-4"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            {filteredOrders.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm || statusFilter !== 'all' 
                  ? t('no_orders_found') 
                  : t('no_orders_yet')
                }
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Order Dialog */}
      {editingOrder && (
        <OrderEditDialog
          order={editingOrder}
          isOpen={showEditDialog}
          onClose={() => {
            setShowEditDialog(false);
            setEditingOrder(null);
          }}
          onSave={handleOrderSaved}
        />
      )}
    </div>
  );
};

export default OrderManagement;