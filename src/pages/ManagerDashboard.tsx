import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import StatCard from '@/components/StatCard';
import { QuickManagementTools } from '@/components/admin/QuickManagementTools';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Order } from '@/entities';
import { superdevClient } from '@/lib/superdev/client';
import { Package, RefreshCw, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';

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

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await Order.update(orderId, { status: newStatus });
      await loadUserAndOrders();
      toast({
        title: 'הזמנה עודכנה',
        description: `ההזמנה ${newStatus === 'approved' ? 'אושרה' : 'נדחתה'} בהצלחה`
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
      <div className="p-4 space-y-6 pb-24">
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
          />
          <StatCard
            title="ממתינות לאישור"
            value={stats.pending}
            icon={Clock}
          />
          <StatCard
            title="אושרו היום"
            value={stats.approved}
            icon={CheckCircle}
          />
          <StatCard
            title="הושלמו"
            value={stats.completed}
            icon={TrendingUp}
          />
        </div>

        {/* הזמנות אחרונות */}
        <Card className="industrial-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold">הזמנות אחרונות</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin')}
              >
                הצג הכל
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentOrders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">אין הזמנות עדיין</p>
                <p className="text-sm text-gray-500 mt-1">הזמנות חדשות יופיעו כאן</p>
              </div>
            ) : (
              recentOrders.map((order) => (
                <OrderCard 
                  key={order.id} 
                  order={order} 
                  onUpdateStatus={updateOrderStatus}
                />
              ))
            )}
          </CardContent>
        </Card>

        {/* כלי ניהול מהירים */}
        <QuickManagementTools />
      </div>
    </Layout>
  );
};

// קומפוננט כרטיס הזמנה - זהה לעיצוב של הלקוח עם כפתורי ניהול
const OrderCard: React.FC<{ order: any; onUpdateStatus: (id: string, status: string) => void }> = ({ 
  order, 
  onUpdateStatus 
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'status-pending';
      case 'approved':
        return 'status-approved';
      case 'rejected':
        return 'status-rejected';
      case 'completed':
        return 'status-completed';
      default:
        return 'bg-gray-100 text-gray-800';
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-gray-900">
              הזמנה #{order.order_number || order.id.slice(-6)}
            </h3>
            <Badge className={getStatusColor(order.status)}>
              {getStatusText(order.status)}
            </Badge>
          </div>
          <p className="text-sm text-gray-600">לקוח: {order.created_by}</p>
        </div>
        
        {/* כפתורי אישור/דחייה - רק להזמנות ממתינות */}
        {order.status === 'pending' && (
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => onUpdateStatus(order.id, 'approved')}
              className="bg-green-600 hover:bg-green-700 text-white h-8 px-3"
            >
              <CheckCircle className="w-4 h-4 ml-1" />
              אשר
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onUpdateStatus(order.id, 'rejected')}
              className="h-8 px-3"
            >
              <XCircle className="w-4 h-4 ml-1" />
              דחה
            </Button>
          </div>
        )}
      </div>

      {/* פרטי ההזמנה */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-gray-500">כמות:</span>
          <span className="font-medium text-gray-900 mr-2">
            {order.quantity_tons} טון
          </span>
        </div>
        
        {order.delivery_date && (
          <div>
            <span className="text-gray-500">תאריך אספקה:</span>
            <span className="font-medium text-gray-900 mr-2">
              {formatDate(order.delivery_date)}
            </span>
          </div>
        )}
        
        {order.delivery_window && (
          <div>
            <span className="text-gray-500">חלון זמן:</span>
            <span className="font-medium text-gray-900 mr-2">
              {order.delivery_window === 'morning' ? 'בוקר' : 'אחר הצהריים'}
            </span>
          </div>
        )}
        
        {order.delivery_method && (
          <div>
            <span className="text-gray-500">שיטת אספקה:</span>
            <span className="font-medium text-gray-900 mr-2">
              {order.delivery_method === 'self' ? 'עצמי' : 'חיצוני'}
            </span>
          </div>
        )}
      </div>

      {/* הערות */}
      {order.notes && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">הערות:</p>
          <p className="text-sm text-gray-700 mt-1">{order.notes}</p>
        </div>
      )}

      {/* תאריך יצירה */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-400">
          נוצר ב-{formatDate(order.created_at)}
        </p>
      </div>
    </div>
  );
};

export default ManagerDashboard;