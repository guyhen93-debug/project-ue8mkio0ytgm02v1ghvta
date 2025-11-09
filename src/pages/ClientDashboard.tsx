import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Order, Site, Client } from '@/entities';
import { superdevClient } from '@/lib/superdev/client';
import { Package, Clock, CheckCircle, XCircle, Plus, Calendar, MapPin, Truck, Sun, Sunset } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

const ClientDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  useEffect(() => {
    loadUserAndOrders();
  }, []);

  const loadUserAndOrders = async () => {
    try {
      setLoading(true);
      const currentUser = await superdevClient.auth.me();
      console.log('Current user:', currentUser);
      setUser(currentUser);

      if (currentUser?.email) {
        const [userOrders, allSites, allClients] = await Promise.all([
          Order.filter({ created_by: currentUser.email }, '-created_at', 100),
          Site.list('-created_at', 1000),
          Client.list('-created_at', 1000)
        ]);
        
        console.log('User orders:', userOrders);
        setOrders(userOrders);
        setSites(allSites);
        setClients(allClients);
        
        const total = userOrders.length;
        const pending = userOrders.filter((o: any) => o.status === 'pending').length;
        const approved = userOrders.filter((o: any) => o.status === 'approved').length;
        const rejected = userOrders.filter((o: any) => o.status === 'rejected').length;
        
        setStats({ total, pending, approved, rejected });
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'שגיאה',
        description: 'נכשל בטעינת הנתונים',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getProductName = (productId: string) => {
    const productMap: Record<string, string> = {
      'granite_10_60': 'גרניט 10-60',
      'granite_0_10': 'גרניט 0-10',
      'p_new_sand_0_4': 'חול חדש 0-4',
      'sand_0_4': 'חול 0-4',
      'sand_dune': 'חול דיונות',
      'gravel_10_20': 'חצץ 10-20',
      'gravel_20_40': 'חצץ 20-40'
    };
    return productMap[productId] || productId;
  };

  const getSiteName = (siteId: string) => {
    const site = sites.find(s => s.id === siteId);
    return site?.site_name || 'לא ידוע';
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || 'לא ידוע';
  };

  const getDeliveryWindowText = (window: string) => {
    return window === 'morning' ? 'בוקר' : 'צהריים';
  };

  const getDeliveryMethodText = (method: string) => {
    return method === 'self' ? 'משלוח עצמי' : 'הובלה חיצונית';
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

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: 'ממתין לאישור',
      approved: 'אושר',
      rejected: 'נדחה',
      completed: 'הושלם'
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return (
      <Layout title="דשבורד לקוח">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto mb-4"></div>
            <p className="text-gray-600">טוען...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout title="דשבורד לקוח">
        <div className="p-4">
          <p className="text-center text-gray-600">אנא התחבר למערכת</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="דשבורד לקוח">
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            שלום, {user.full_name || user.name || user.email}
          </h1>
          <p className="text-gray-600">
            ניהול הזמנות ומעקב אחר סטטוס
          </p>
        </div>

        {/* Quick Action Button */}
        <Button
          onClick={() => navigate('/create-order')}
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-black h-12 text-base font-semibold"
        >
          <Plus className="h-5 w-5 ml-2" />
          צור הזמנה חדשה
        </Button>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                סה"כ הזמנות
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-gray-500" />
                <span className="text-2xl font-bold">{stats.total}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">כל הזמנים</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                ממתין
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                <span className="text-2xl font-bold">{stats.pending}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">ממתין לאישור</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                אושר
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-2xl font-bold">{stats.approved}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">מוכן למשלוח</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                נדחה
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <span className="text-2xl font-bold">{stats.rejected}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">דורש תיקון</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">הזמנות אחרונות</h2>
          </div>

          {orders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">אין הזמנות עדיין</p>
                <Button
                  onClick={() => navigate('/create-order')}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black"
                >
                  <Plus className="h-4 w-4 ml-2" />
                  צור הזמנה ראשונה
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 5).map((order) => (
                <Card key={order.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold text-gray-900">
                          הזמנה #{order.order_number || order.id.slice(-6)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(order.created_at), 'dd/MM/yyyy', { locale: he })}
                        </p>
                      </div>
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusText(order.status)}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      {/* Product */}
                      <div className="flex items-center gap-2 text-gray-700">
                        <Package className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        <span className="font-medium">{getProductName(order.product_id)}</span>
                        <span className="text-gray-500">•</span>
                        <span>{order.quantity_tons} טון</span>
                      </div>
                      
                      {/* Site */}
                      {order.site_id && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0" />
                          <span>{getSiteName(order.site_id)}</span>
                        </div>
                      )}
                      
                      {/* Delivery Date and Time */}
                      {order.delivery_date && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
                          <span>
                            {format(new Date(order.delivery_date), 'dd/MM/yyyy', { locale: he })}
                          </span>
                          {order.delivery_window && (
                            <>
                              <span className="text-gray-500">•</span>
                              {order.delivery_window === 'morning' ? (
                                <Sun className="h-4 w-4 text-yellow-500" />
                              ) : (
                                <Sunset className="h-4 w-4 text-orange-500" />
                              )}
                              <span>{getDeliveryWindowText(order.delivery_window)}</span>
                            </>
                          )}
                        </div>
                      )}
                      
                      {/* Delivery Method */}
                      {order.delivery_method && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <Truck className="h-4 w-4 text-gray-500 flex-shrink-0" />
                          <span>{getDeliveryMethodText(order.delivery_method)}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ClientDashboard;