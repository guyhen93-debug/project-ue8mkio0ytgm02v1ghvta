import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { mockDataService } from '@/services/mockDataService';
import { Plus, Package, Calendar, MapPin, Truck } from 'lucide-react';

const ClientDashboard: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    loadOrders();
  }, [user]);

  const loadOrders = async () => {
    try {
      if (user) {
        const userOrders = await mockDataService.getOrders({ client_id: user.id }, '-created_at');
        setOrders(userOrders);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <Layout title={t('my_orders')}>
        <div className="px-4 py-8 bg-gray-50 min-h-screen">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl p-6 animate-pulse shadow-sm">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={t('my_orders')}>
      <div className="px-4 py-6 bg-gray-50 min-h-screen">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="shadow-lg border-0">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-gray-900 mb-1">{orders.length}</div>
              <div className="text-base font-semibold text-gray-600">{t('orders')}</div>
            </CardContent>
          </Card>
          <Card className="shadow-lg border-0">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {orders.filter(o => o.status === 'approved').length}
              </div>
              <div className="text-base font-semibold text-gray-600">{t('approved')}</div>
            </CardContent>
          </Card>
        </div>

        {/* Create Order Button */}
        <Button
          onClick={() => navigate('/create-order')}
          className="w-full mb-6 h-14 bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-lg shadow-lg rounded-xl"
          size="lg"
        >
          <Plus className="mr-3 h-6 w-6" />
          {t('create_order')}
        </Button>

        {/* Orders List */}
        <div className="space-y-4">
          {orders.length === 0 ? (
            <Card className="shadow-lg border-0">
              <CardContent className="p-8 text-center">
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {t('no_orders')}
                </h3>
                <p className="text-gray-600 mb-6 text-lg">
                  {t('start_creating_order')}
                </p>
                <Button
                  onClick={() => navigate('/create-order')}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-lg h-12 px-8 shadow-lg"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  {t('create_order')}
                </Button>
              </CardContent>
            </Card>
          ) : (
            orders.map((order) => (
              <Card key={order.id} className="hover:shadow-xl transition-all duration-200 shadow-lg border-0">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-bold">
                      {t(order.product)}
                    </CardTitle>
                    <Badge className={`${getStatusColor(order.status)} font-semibold border`}>
                      {t(order.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 text-base text-gray-700">
                    <Package className="h-5 w-5 text-gray-500" />
                    <span className="font-semibold">{order.quantity} {t('tons')}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-base text-gray-700">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    <span>{formatDate(order.delivery_date)}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-base text-gray-700">
                    <Truck className="h-5 w-5 text-gray-500" />
                    <span>{t(order.delivery_type)}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-base text-gray-700">
                    <MapPin className="h-5 w-5 text-gray-500" />
                    <span className="truncate">{order.delivery_location}</span>
                  </div>
                  
                  <div className="text-sm text-gray-500 pt-3 border-t border-gray-100">
                    {t('order_number')}{order.id.slice(-6)} • {new Date(order.created_at).toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US')}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ClientDashboard;