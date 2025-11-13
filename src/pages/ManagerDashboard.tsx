import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Order } from '@/entities';
import { useLanguage } from '@/contexts/LanguageContext';
import { Plus, AlertCircle, RefreshCw } from 'lucide-react';
import RecentOrdersList from '@/components/RecentOrdersList';
import NotificationsCard from '@/components/NotificationsCard';
import QuickManagementCard from '@/components/QuickManagementCard';

const ManagerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const translations = {
    he: {
      title: 'דשבורד מנהל',
      recentOrders: 'הזמנות אחרונות',
      createOrder: 'צור הזמנה חדשה',
      error: 'שגיאה בטעינת הזמנות',
      retry: 'נסה שוב'
    },
    en: {
      title: 'Manager Dashboard',
      recentOrders: 'Recent Orders',
      createOrder: 'Create New Order',
      error: 'Error loading orders',
      retry: 'Retry'
    }
  };

  const t = translations[language];
  const isRTL = language === 'he';

  useEffect(() => {
    loadOrders();
  }, [retryCount]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 8000)
      );
      
      const ordersPromise = Order.list('-created_at', 1000);
      const allOrders = await Promise.race([ordersPromise, timeoutPromise]);
      
      setOrders(allOrders || []);
    } catch (error) {
      console.error('Error loading orders:', error);
      setError(t.error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  return (
    <Layout title={t.title}>
      <div className="p-3 sm:p-4 md:p-6 pb-24" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Quick Action */}
        <div className="mb-6">
          <Button 
            className="bg-yellow-500 hover:bg-yellow-600 text-black w-full sm:w-auto"
            onClick={() => navigate('/create-order')}
          >
            <Plus className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t.createOrder}
          </Button>
        </div>

        {/* Quick Management Tools */}
        <div className="mb-6">
          <QuickManagementCard />
        </div>

        {/* Notifications Card */}
        <div className="mb-6">
          <NotificationsCard />
        </div>

        {/* Recent Orders */}
        <Card className="industrial-card">
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">{t.recentOrders}</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto"></div>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 mx-auto mb-3 text-red-400" />
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={handleRetry} variant="outline" className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  {t.retry}
                </Button>
              </div>
            ) : (
              <RecentOrdersList limit={100} />
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ManagerDashboard;