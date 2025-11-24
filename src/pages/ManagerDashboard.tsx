import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Order } from '@/entities';
import { useLanguage } from '@/contexts/LanguageContext';
import { Plus, AlertCircle, RefreshCw, Sparkles } from 'lucide-react';
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
      
      console.log('Loading orders...');
      const allOrders = await Order.list('-created_at', 1000);
      console.log('Orders loaded successfully:', allOrders?.length || 0);
      
      setOrders(allOrders || []);
    } catch (error: any) {
      console.error('Error loading orders:', error);
      
      // Only show error if it's not an auth issue
      if (!error?.message?.includes('401') && !error?.message?.includes('Unauthorized')) {
        setError(t.error);
      }
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
        {/* Highlighted Quick Action */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 rounded-lg blur opacity-30 animate-pulse"></div>
            <Button 
              className="relative w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold text-lg py-6 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
              onClick={() => navigate('/create-order')}
            >
              <Sparkles className={`w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'} animate-pulse`} />
              {t.createOrder}
              <Plus className={`w-5 h-5 ${isRTL ? 'mr-2' : 'ml-2'}`} />
            </Button>
          </div>
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