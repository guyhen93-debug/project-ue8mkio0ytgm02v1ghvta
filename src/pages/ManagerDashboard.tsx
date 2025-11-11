import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { StatCard } from '@/components/StatCard';
import { QuickManagementTools } from '@/components/admin/QuickManagementTools';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Order } from '@/entities';
import { superdevClient } from '@/lib/superdev/client';
import { Package, Calendar, FileText, RefreshCw, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

const ManagerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    completed: 0
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
      
      const allOrders = await Order.list('-created_at', 100);
      console.log('Loaded orders:', allOrders.length);
      setOrders(allOrders);
      
      // חישוב סטטיסטיקות
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      setStats({
        total: allOrders.length,
        pending: allOrders.filter(o => o.status === 'pending').length,
        approved: allOrders.filter(o => {
          const orderDate = new Date(o.updated_at || o.created_at);
          orderDate.setHours(0, 0, 0, 0);
          return o.status === 'approved' && orderDate.getTime() === today.getTime();
        }).length,
        completed: allOrders.filter(o => o.status === 'completed').length
      });
    } catch (error) {
      console.error('Error loading orders:', error);
      toast({
        title: 'שגיאה',
        description: 'נכשל בטעינת ההזמנות',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
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

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: 'ממתין',
      approved: 'אושר',
      rejected: 'נדחה',
      completed: 'הושלם'
    };
    return statusMap[status] || status;
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await Order.update(orderId, { status: newStatus });
      await loadUserAndOrders();
      toast({
        title: 'הזמנה עודכנה',
        description: 'הסטטוס עודכן בהצלחה'
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: 'שגיאה',
        description: 'נכשל בעדכון ההזמנה',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <Layout title="דשבורד מנהל">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto mb-4"></div>
            <p className="text-gray-600">טוען...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const recentOrders = orders.slice(0, 5);

  return (
    <Layout title="דשבורד מנהל">
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">שלום, {user?.full_name || 'מנהל'}</h1>
            <p className="text-gray-600">סקירה כללית של המערכת</p>
          </div>
          <Button 
            onClick={loadUserAndOrders}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            רענן
          </Button>
        </div>

        {/* סטטיסטיקות */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="סה״כ הזמנות"
            value={stats.total}
            icon={Package}
            color="blue"
          />
          <StatCard
            title="ממתינות לאישור"
            value={stats.pending}
            icon={Clock}
            color="yellow"
          />
          <StatCard
            title="אושרו היום"
            value={stats.approved}
            icon={CheckCircle}
            color="green"
          />
          <StatCard
            title="הושלמו"
            value={stats.completed}
            icon={TrendingUp}
            color="purple"
          />
        </div>

        {/* הזמנות אחרונות */}
        <Card className="industrial-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-bold">הזמנות אחרונות</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/manager-dashboard')}
            >
              הצג הכל
            </Button>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">אין הזמנות עדיין</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900">
                            הזמנה #{order.order_number || order.id.slice(-6)}
                          </span>
                          <Badge className={getStatusColor(order.status)}>
                            {getStatusText(order.status)}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          לקוח: {order.created_by}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(order.created_at), 'dd/MM/yyyy HH:mm', { locale: he })}
                        </p>
                      </div>
                      {order.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => updateOrderStatus(order.id, 'approved')}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateOrderStatus(order.id, 'rejected')}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-right">
                        <Package className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700">{order.quantity_tons} טון</span>
                      </div>

                      {order.delivery_date && (
                        <div className="flex items-center gap-2 text-right">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-700">
                            {format(new Date(order.delivery_date), 'dd/MM/yyyy', { locale: he })}
                          </span>
                        </div>
                      )}

                      {order.notes && (
                        <div className="flex items-start gap-2 text-right">
                          <FileText className="w-4 h-4 text-gray-500 mt-0.5" />
                          <span className="text-gray-600 text-xs">{order.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* כלי ניהול מהירים */}
        <QuickManagementTools />
      </div>
    </Layout>
  );
};

export default ManagerDashboard;