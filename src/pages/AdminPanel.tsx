import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Order, Client, Site } from '@/entities';
import { OrderService } from '@/services/orderService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { Settings, Users, MapPin, Package, Search, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { he, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import ProductManagement from '@/components/admin/ProductManagement';

const AdminPanel: React.FC = () => {
  const { t, language, isRTL } = useLanguage();
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [editingSite, setEditingSite] = useState<any>(null);

  useEffect(() => {
    if (user?.role !== 'manager') {
      return;
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordersData, clientsData, sitesData] = await Promise.all([
        OrderService.getOrdersWithRelations(undefined, true),
        Client.list('-created_at'),
        Site.list('-created_at')
      ]);
      
      setOrders(ordersData);
      setClients(clientsData);
      setSites(sitesData);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await Order.update(orderId, { status: newStatus });
      await loadData();
      toast({
        title: t('order_updated'),
        description: t('order_updated_successfully')
      });
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: t('error'),
        description: t('update_failed'),
        variant: 'destructive'
      });
    }
  };

  const deleteOrder = async (orderId: string) => {
    try {
      await Order.delete(orderId);
      await loadData();
      toast({
        title: t('order_deleted'),
        description: t('order_deleted_successfully')
      });
    } catch (error) {
      console.error('Error deleting order:', error);
      toast({
        title: t('error'),
        description: t('delete_failed'),
        variant: 'destructive'
      });
    }
  };

  const saveOrder = async (orderData: any) => {
    try {
      if (editingOrder.id) {
        await Order.update(editingOrder.id, orderData);
        toast({
          title: t('order_updated'),
          description: t('order_updated_successfully')
        });
      }
      setEditingOrder(null);
      await loadData();
    } catch (error) {
      console.error('Error saving order:', error);
      toast({
        title: t('error'),
        description: t('save_failed'),
        variant: 'destructive'
      });
    }
  };

  const saveClient = async (clientData: any) => {
    try {
      if (editingClient?.id) {
        await Client.update(editingClient.id, clientData);
        toast({
          title: t('client_updated'),
          description: t('client_updated_successfully')
        });
      } else {
        await Client.create({ ...clientData, is_active: true });
        toast({
          title: t('client_created'),
          description: t('client_created_successfully')
        });
      }
      setEditingClient(null);
      await loadData();
    } catch (error) {
      console.error('Error saving client:', error);
      toast({
        title: t('error'),
        description: t('save_failed'),
        variant: 'destructive'
      });
    }
  };

  const saveSite = async (siteData: any) => {
    try {
      if (editingSite?.id) {
        await Site.update(editingSite.id, siteData);
        toast({
          title: t('site_updated'),
          description: t('site_updated_successfully')
        });
      } else {
        await Site.create({ ...siteData, is_active: true });
        toast({
          title: t('site_created'),
          description: t('site_created_successfully')
        });
      }
      setEditingSite(null);
      await loadData();
    } catch (error) {
      console.error('Error saving site:', error);
      toast({
        title: t('error'),
        description: t('save_failed'),
        variant: 'destructive'
      });
    }
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

  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm === '' || 
      (order.order_number && order.order_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      order.created_by.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.site_name && order.site_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.client_name && order.client_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (user?.role !== 'manager') {
    return (
      <Layout title={t('admin_panel')}>
        <div className="p-4">
          <Card>
            <CardContent className="p-8 text-center">
              <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t('access_denied')}
              </h3>
              <p className="text-gray-600">{t('manager_only_access')}</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout title={t('admin_panel')}>
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
    <Layout title={t('admin_panel')}>
      <div className={cn(
        "p-4 space-y-6",
        isRTL ? "rtl" : "ltr"
      )} dir={isRTL ? "rtl" : "ltr"}>
        {/* Header */}
        <div className={cn(isRTL ? "text-right" : "text-left")}>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{t('admin_panel')}</h1>
          <p className="text-gray-600 mt-2">{t('manage_all_system_data')}</p>
        </div>

        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className={cn(
            "grid w-full grid-cols-2 md:grid-cols-4 gap-1",
            isRTL ? "text-right" : "text-left"
          )}>
            <TabsTrigger value="orders" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
              <Package className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">{t('orders')}</span>
              <span className="sm:hidden">({orders.length})</span>
              <span className="hidden sm:inline">({orders.length})</span>
            </TabsTrigger>
            <TabsTrigger value="clients" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
              <Users className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">{t('clients_management')}</span>
              <span className="sm:hidden">{t('clients')}</span>
              <span>({clients.length})</span>
            </TabsTrigger>
            <TabsTrigger value="sites" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
              <MapPin className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">{t('sites_management')}</span>
              <span className="sm:hidden">{t('sites')}</span>
              <span>({sites.length})</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
              <Package className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">{t('product_management')}</span>
              <span className="sm:hidden">{t('products')}</span>
            </TabsTrigger>
          </TabsList>

          {/* Orders Management */}
          <TabsContent value="orders" className="space-y-4">
            {/* ... existing orders management code */}
          </TabsContent>

          {/* Clients Management */}
          <TabsContent value="clients" className="space-y-4">
            {/* ... existing clients management code */}
          </TabsContent>

          {/* Sites Management */}
          <TabsContent value="sites" className="space-y-4">
            {/* ... existing sites management code */}
          </TabsContent>

          {/* Products Management */}
          <TabsContent value="products" className="space-y-4">
            <ProductManagement />
          </TabsContent>
        </Tabs>

        {/* ... existing dialog components */}
      </div>
    </Layout>
  );
};

export default AdminPanel;