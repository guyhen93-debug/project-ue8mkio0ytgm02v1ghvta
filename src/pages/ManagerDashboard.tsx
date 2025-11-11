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
import { 
  Package, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp, 
  AlertCircle,
  Calendar,
  Truck,
  FileText,
  Box
} from 'lucide-react';

// רשימת מוצרים סטטית
const PRODUCTS = [
  { id: 'p_new_sand_0_4', name: 'חול חדש 0-4' },
  { id: 'p_new_sand_0_6', name: 'חול חדש 0-6' },
  { id: 'p_washed_sand_0_2', name: 'חול שטוף 0-2' },
  { id: 'p_washed_sand_0_4', name: 'חול שטוף 0-4' },
  { id: 'granite_4_10', name: 'גרניט 4-10' },
  { id: 'granite_10_20', name: 'גרניט 10-20' },
  { id: 'granite_20_40', name: 'גרניט 20-40' },
  { id: 'granite_10_60', name: 'גרניט 10-60' },
  { id: 'granite_40_80', name: 'גרניט 40-80' },
  { id: 'granite_dust', name: 'אבק גרניט' },
  { id: 'gravel_4_25', name: 'חצץ 4-25' },
  { id: 'gravel_25_60', name: 'חצץ 25-60' },
  { id: 'gravel_dust', name: 'אבק חצץ' }
];

const ManagerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    completed: 0
  });

  useEffect(() => {
    loadUserAndOrders();
  }, []);

  const loadUserAndOrders = async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading user and orders, attempt:', retryCount + 1);
      
      // טעינת משתמש עם retry
      let currentUser;
      try {
        currentUser = await superdevClient.auth.me();
        console.log('Current user:', currentUser);
        setUser(currentUser);
      } catch (userError) {
        console.error('Error loading user:', userError);
        if (retryCount < 2) {
          console.log('Retrying user load...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          return loadUserAndOrders(retryCount + 1);
        }
        throw new Error('נכשל בטעינת פרטי המשתמש');
      }
      
      // טעינת הזמנות
      try {
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
      } catch (ordersError) {
        console.error('Error loading orders:', ordersError);
        if (retryCount < 2) {
          console.log('Retrying orders load...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          return loadUserAndOrders(retryCount + 1);
        }
        throw new Error('נכשל בטעינת ההזמנות');
      }
      
    } catch (error: any) {
      console.error('Error loading data:', error);
      setError(error.message || 'אירעה שגיאה בטעינת הנתונים');
      toast({
        title: 'שגיאה',
        description: error.message || 'נכשל בטעינת הנתונים. אנא נסה שוב.',
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

  const getProductName = (productId: string) => {
    const product = PRODUCTS.find(p => p.id === productId);
    return product?.name || productId;
  };

  if (loading) {
    return (
      <Layout title="דשבורד מנהל">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto mb-4"></div>
            <p className="text-gray-600">טוען נתונים...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="דשבורד מנהל">
        <div className="flex items-center justify-center min-h-[400px] p-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">שגיאה בטעינת הנתונים</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <Button 
                  onClick={() => loadUserAndOrders()}
                  className="piter-yellow"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  נסה שוב
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const recentOrders = orders.slice(0, 5);

  return (
    <Layout title="דשבורד מנהל">
      <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 pb-24">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">שלום, {user?.full_name || 'מנהל'}</h1>
            <p className="text-sm sm:text-base text-gray-600">סקירה כללית של המערכת</p>
          </div>
          <Button 
            onClick={() => loadUserAndOrders()}
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            רענן
          </Button>
        </div>

        {/* סטטיסטיקות */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
          <CardHeader className="p-3 sm:p-6 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg sm:text-xl font-bold">הזמנות אחרונות</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin')}
                className="text-xs sm:text-sm"
              >
                הצג הכל
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0 space-y-3">
            {recentOrders.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <Package className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                <p className="text-sm sm:text-base text-gray-600 font-medium">אין הזמנות עדיין</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">הזמנות חדשות יופיעו כאן</p>
              </div>
            ) : (
              recentOrders.map((order) => (
                <OrderCard 
                  key={order.id} 
                  order={order} 
                  onUpdateStatus={updateOrderStatus}
                  getProductName={getProductName}
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

// קומפוננט כרטיס הזמנה
const OrderCard: React.FC<{ 
  order: any; 
  onUpdateStatus: (id: string, status: string) => void;
  getProductName: (productId: string) => string;
}> = ({ 
  order, 
  onUpdateStatus,
  getProductName
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
    <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-all">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-3">
        <div className="flex-1 w-full">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-bold text-sm sm:text-base text-gray-900">
              הזמנה #{order.order_number || order.id.slice(-6)}
            </h3>
            <Badge className={`${getStatusColor(order.status)} text-xs`}>
              {getStatusText(order.status)}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-gray-600">לקוח: {order.created_by}</p>
        </div>
        
        {/* כפתורי אישור/דחייה */}
        {order.status === 'pending' && (
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              size="sm"
              onClick={() => onUpdateStatus(order.id, 'approved')}
              className="bg-green-600 hover:bg-green-700 text-white h-8 px-2 sm:px-3 flex-1 sm:flex-none text-xs sm:text-sm"
            >
              <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
              אשר
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onUpdateStatus(order.id, 'rejected')}
              className="h-8 px-2 sm:px-3 flex-1 sm:flex-none text-xs sm:text-sm"
            >
              <XCircle className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
              דחה
            </Button>
          </div>
        )}
      </div>

      {/* פרטי ההזמנה עם אייקונים */}
      <div className="space-y-2">
        {/* מוצר */}
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <Box className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <span className="text-gray-500">מוצר:</span>
          <span className="font-medium text-gray-900">
            {getProductName(order.product_id)}
          </span>
        </div>
        
        {/* כמות */}
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <Package className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <span className="text-gray-500">כמות:</span>
          <span className="font-medium text-gray-900">
            {order.quantity_tons} טון
          </span>
        </div>
        
        {/* תאריך אספקה */}
        {order.delivery_date && (
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <span className="text-gray-500">תאריך אספקה:</span>
            <span className="font-medium text-gray-900">
              {formatDate(order.delivery_date)}
            </span>
          </div>
        )}
        
        {/* חלון זמן */}
        {order.delivery_window && (
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <span className="text-gray-500">חלון זמן:</span>
            <span className="font-medium text-gray-900">
              {order.delivery_window === 'morning' ? 'בוקר' : 'אחר הצהריים'}
            </span>
          </div>
        )}
        
        {/* שיטת אספקה */}
        {order.delivery_method && (
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <Truck className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <span className="text-gray-500">שיטת אספקה:</span>
            <span className="font-medium text-gray-900">
              {order.delivery_method === 'self' ? 'עצמי' : 'חיצוני'}
            </span>
          </div>
        )}
      </div>

      {/* הערות */}
      {order.notes && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-start gap-2">
            <FileText className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-gray-500">הערות:</p>
              <p className="text-xs sm:text-sm text-gray-700 mt-1">{order.notes}</p>
            </div>
          </div>
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