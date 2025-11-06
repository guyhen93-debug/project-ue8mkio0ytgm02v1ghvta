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
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className={cn(isRTL ? "text-right" : "text-left")}>
          <h1 className="text-3xl font-bold text-gray-900">{t('admin_panel')}</h1>
          <p className="text-gray-600 mt-2">{t('manage_all_system_data')}</p>
        </div>

        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className={cn(
            "grid w-full grid-cols-4",
            isRTL ? "text-right" : "text-left"
          )}>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              {t('orders')} ({orders.length})
            </TabsTrigger>
            <TabsTrigger value="clients" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              {t('clients_management')} ({clients.length})
            </TabsTrigger>
            <TabsTrigger value="sites" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {t('sites_management')} ({sites.length})
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              {t('product_management')}
            </TabsTrigger>
          </TabsList>

          {/* Orders Management */}
          <TabsContent value="orders" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
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
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className={cn(
                  "w-full sm:w-48",
                  isRTL ? "text-right" : "text-left"
                )}>
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

            {filteredOrders.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {t('no_orders_found')}
                  </h3>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredOrders.map((order) => (
                  <Card key={order.id}>
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div className={cn(
                          "flex-1 space-y-2",
                          isRTL ? "text-right" : "text-left"
                        )}>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">
                              {t('order_number')}{order.order_number || order.id.slice(-6)}
                            </h3>
                            <Badge className={getStatusColor(order.status)}>
                              {t(order.status)}
                            </Badge>
                            {order.unlinked_site && (
                              <Badge variant="outline" className="text-xs">
                                {isRTL ? "לא מקושר" : "Unlinked"}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {t('customer')}: {order.created_by}
                          </p>
                          <p className="text-sm text-gray-600">
                            {t('client')}: {order.client_name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {t('site')}: {order.site_name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {t('product')}: {t(order.product_id)} - {order.quantity_tons} {t('tons')}
                          </p>
                          <p className="text-sm text-gray-600">
                            {t('delivery')}: {OrderService.formatDeliveryWindow(order.delivery_window, language)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {format(new Date(order.created_at), 'PPP', { 
                              locale: language === 'he' ? he : enUS 
                            })}
                          </p>
                          {order.notes && (
                            <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                              <span className="font-medium">
                                {isRTL ? "הערות:" : "Notes:"}
                              </span> {order.notes}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex flex-col gap-2 w-full sm:w-auto">
                          {order.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => updateOrderStatus(order.id, 'approved')}
                                className="bg-green-600 hover:bg-green-700 text-white flex-1 sm:flex-none"
                              >
                                {t('approved')}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => updateOrderStatus(order.id, 'rejected')}
                                className="flex-1 sm:flex-none"
                              >
                                {t('rejected')}
                              </Button>
                            </div>
                          )}
                          
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1 sm:flex-none"
                              onClick={() => setEditingOrder(order)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>{t('confirm_delete')}</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {t('confirm_delete_order')}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteOrder(order.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    {t('delete')}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Clients Management */}
          <TabsContent value="clients" className="space-y-4">
            <div className={cn(
              "flex justify-between items-center",
              isRTL ? "text-right" : "text-left"
            )}>
              <h2 className="text-xl font-semibold">{t('clients_management')}</h2>
              <Button 
                className="bg-yellow-500 hover:bg-yellow-600 text-black"
                onClick={() => setEditingClient({})}
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('add_client')}
              </Button>
            </div>
            
            {clients.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {t('no_clients_found')}
                  </h3>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {clients.map((client) => (
                  <Card key={client.id}>
                    <CardContent className="p-4">
                      <div className={cn(
                        "flex justify-between items-start",
                        isRTL ? "text-right" : "text-left"
                      )}>
                        <div>
                          <h3 className="font-semibold">{client.name}</h3>
                          <p className="text-sm text-gray-600">
                            {t('sites')}: {sites.filter(s => s.client_id === client.id).length}
                          </p>
                          <p className="text-sm text-gray-600">
                            {t('status')}: {client.is_active ? t('active') : t('inactive')}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setEditingClient(client)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Sites Management */}
          <TabsContent value="sites" className="space-y-4">
            <div className={cn(
              "flex justify-between items-center",
              isRTL ? "text-right" : "text-left"
            )}>
              <h2 className="text-xl font-semibold">{t('sites_management')}</h2>
              <Button 
                className="bg-yellow-500 hover:bg-yellow-600 text-black"
                onClick={() => setEditingSite({})}
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('add_site')}
              </Button>
            </div>
            
            {sites.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {t('no_sites_found')}
                  </h3>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {sites.map((site) => {
                  const client = clients.find(c => c.id === site.client_id);
                  return (
                    <Card key={site.id}>
                      <CardContent className="p-4">
                        <div className={cn(
                          "flex justify-between items-start",
                          isRTL ? "text-right" : "text-left"
                        )}>
                          <div>
                            <h3 className="font-semibold">{site.site_name}</h3>
                            <p className="text-sm text-gray-600">
                              {t('client')}: {client?.name || 'Unknown'}
                            </p>
                            <p className="text-sm text-gray-600">
                              {t('region')}: {t(site.region_type)}
                            </p>
                            <p className="text-sm text-gray-600">
                              {t('contact')}: {site.contact_name} - {site.contact_phone}
                            </p>
                            <p className="text-sm text-gray-600">
                              {t('status')}: {site.is_active ? t('active') : t('inactive')}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setEditingSite(site)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Products Management */}
          <TabsContent value="products" className="space-y-4">
            <div className={cn(
              "flex justify-between items-center",
              isRTL ? "text-right" : "text-left"
            )}>
              <h2 className="text-xl font-semibold">{t('product_management')}</h2>
            </div>
            
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t('product_management')}
                </h3>
                <p className="text-gray-600">
                  {t('products_managed_in_code')}
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Order Dialog */}
        {editingOrder && (
          <Dialog open={!!editingOrder} onOpenChange={() => setEditingOrder(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{t('edit_order')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t('status')}</Label>
                    <Select 
                      value={editingOrder.status} 
                      onValueChange={(value) => setEditingOrder({...editingOrder, status: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">{t('pending')}</SelectItem>
                        <SelectItem value="approved">{t('approved')}</SelectItem>
                        <SelectItem value="rejected">{t('rejected')}</SelectItem>
                        <SelectItem value="completed">{t('completed')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t('quantity')} ({t('tons')})</Label>
                    <Input 
                      type="number"
                      value={editingOrder.quantity_tons} 
                      onChange={(e) => setEditingOrder({...editingOrder, quantity_tons: parseFloat(e.target.value)})}
                    />
                  </div>
                </div>
                <div>
                  <Label>{t('notes')}</Label>
                  <Textarea 
                    value={editingOrder.notes || ''} 
                    onChange={(e) => setEditingOrder({...editingOrder, notes: e.target.value})}
                    rows={3}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setEditingOrder(null)}>
                    {t('cancel')}
                  </Button>
                  <Button onClick={() => saveOrder(editingOrder)}>
                    {t('save')}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Edit Client Dialog */}
        {editingClient && (
          <Dialog open={!!editingClient} onOpenChange={() => setEditingClient(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingClient.id ? t('edit_client') : t('add_client')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>{t('client_name')}</Label>
                  <Input 
                    value={editingClient.name || ''} 
                    onChange={(e) => setEditingClient({...editingClient, name: e.target.value})}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setEditingClient(null)}>
                    {t('cancel')}
                  </Button>
                  <Button onClick={() => saveClient(editingClient)}>
                    {t('save')}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Edit Site Dialog */}
        {editingSite && (
          <Dialog open={!!editingSite} onOpenChange={() => setEditingSite(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingSite.id ? t('edit_site') : t('add_site')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>{t('client')}</Label>
                  <Select 
                    value={editingSite.client_id || ''} 
                    onValueChange={(value) => setEditingSite({...editingSite, client_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('select_client')} />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t('site_name')}</Label>
                  <Input 
                    value={editingSite.site_name || ''} 
                    onChange={(e) => setEditingSite({...editingSite, site_name: e.target.value})}
                  />
                </div>
                <div>
                  <Label>{t('region_type')}</Label>
                  <Select 
                    value={editingSite.region_type || ''} 
                    onValueChange={(value) => setEditingSite({...editingSite, region_type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('select_region')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="eilat">{t('eilat')}</SelectItem>
                      <SelectItem value="outside_eilat">{t('outside_eilat')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t('contact_name')}</Label>
                  <Input 
                    value={editingSite.contact_name || ''} 
                    onChange={(e) => setEditingSite({...editingSite, contact_name: e.target.value})}
                  />
                </div>
                <div>
                  <Label>{t('contact_phone')}</Label>
                  <Input 
                    value={editingSite.contact_phone || ''} 
                    onChange={(e) => setEditingSite({...editingSite, contact_phone: e.target.value})}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setEditingSite(null)}>
                    {t('cancel')}
                  </Button>
                  <Button onClick={() => saveSite(editingSite)}>
                    {t('save')}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </Layout>
  );
};

export default AdminPanel;