import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Order, User } from '@/entities';
import { Plus, MapPin, Calendar, Package, Clock, FileText, Search, RefreshCw, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const ManagerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUserAndOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, statusFilter, searchTerm]);

  const loadUserAndOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const currentUser = await User.me();
      setUser(currentUser);
      
      const allOrders = await Order.list('-created_at', 100);
      console.log('Loaded orders:', allOrders.length);
      setOrders(allOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
      setError('נכשל בטעינת ההזמנות');
      toast({
        title: 'שגיאה',
        description: 'נכשל בטעינת ההזמנות',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(order => 
        (order.order_number && order.order_number.toLowerCase().includes(term)) ||
        order.created_by.toLowerCase().includes(term) ||
        (order.notes && order.notes.toLowerCase().includes(term))
      );
    }
    
    setFilteredOrders(filtered);
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
      <Layout title="כל ההזמנות">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto mb-4"></div>
            <p className="text-gray-600">טוען...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="כל ההזמנות">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <Package className="w-16 h-16 text-red-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">שגיאה בטעינת הנתונים</h3>
            <p className="text-gray-600 mb-4 text-sm">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button 
                onClick={loadUserAndOrders} 
                className="bg-yellow-500 hover:bg-yellow-600 text-black"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                נסה שוב
              </Button>
              <Button 
                onClick={() => navigate('/create-order')}
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                צור הזמנה
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="כל ההזמנות">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">כל ההזמנות</h1>
            <p className="text-gray-600">סה"כ הזמנות: {orders.length}</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              onClick={loadUserAndOrders}
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              רענן
            </Button>
            <Button 
              onClick={() => navigate('/create-order')}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium flex-1 sm:flex-none"
            >
              <Plus className="w-4 h-4 mr-2" />
              צור הזמנה
            </Button>
            <Button 
              onClick={() => navigate('/admin')}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium flex-1 sm:flex-none"
            >
              פאנל ניהול
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="חיפוש הזמנות..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10 text-right"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="text-right">
              <SelectValue placeholder="סינון לפי סטטוס" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">הכל</SelectItem>
              <SelectItem value="pending">ממתין</SelectItem>
              <SelectItem value="approved">אושר</SelectItem>
              <SelectItem value="rejected">נדחה</SelectItem>
              <SelectItem value="completed">הושלם</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              לא נמצאו הזמנות
            </h3>
            <p className="text-gray-600 mb-4">
              {orders.length === 0 ? 'אין הזמנות עדיין' : 'אין הזמנות התואמות את הסינון'}
            </p>
            {orders.length === 0 && (
              <Button 
                onClick={() => navigate('/create-order')}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium"
              >
                <Plus className="w-4 h-4 mr-2" />
                צור הזמנה ראשונה
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg font-semibold">
                        הזמנה #{order.order_number || order.id.slice(-6)}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        לקוח: {order.created_by}
                      </p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(order.created_at), 'dd/MM/yyyy HH:mm', { locale: he })}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusText(order.status)}
                      </Badge>
                      {order.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => updateOrderStatus(order.id, 'approved')}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            אשר
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateOrderStatus(order.id, 'rejected')}
                          >
                            דחה
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
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
                      <FileText className="w-4 h-4 text-gray-500 mt-1" />
                      <span className="text-sm text-gray-600">{order.notes}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ManagerDashboard;