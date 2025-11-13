import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Order, Client, Site, Product } from '@/entities';
import { useLanguage } from '@/contexts/LanguageContext';
import { Package, CheckCircle, Clock, XCircle, Plus } from 'lucide-react';
import RecentOrdersList from '@/components/RecentOrdersList';
import { StatCard } from '@/components/StatCard';

const ManagerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const translations = {
    he: {
      title: 'דשבורד מנהל',
      totalOrders: 'סה״כ הזמנות',
      pendingOrders: 'ממתינות לאישור',
      approvedOrders: 'הזמנות מאושרות',
      rejectedOrders: 'הזמנות נדחו',
      recentOrders: 'הזמנות אחרונות',
      createOrder: 'צור הזמנה חדשה'
    },
    en: {
      title: 'Manager Dashboard',
      totalOrders: 'Total Orders',
      pendingOrders: 'Pending Approval',
      approvedOrders: 'Approved Orders',
      rejectedOrders: 'Rejected Orders',
      recentOrders: 'Recent Orders',
      createOrder: 'Create New Order'
    }
  };

  const t = translations[language];
  const isRTL = language === 'he';

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const allOrders = await Order.list('-created_at', 1000);
      setOrders(allOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const approvedOrders = orders.filter(o => o.status === 'approved').length;
  const rejectedOrders = orders.filter(o => o.status === 'rejected').length;

  return (
    <Layout title={t.title}>
      <div className="p-3 sm:p-4 md:p-6 pb-24" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Quick Action */}
        <div className="mb-6">
          <Button 
            className="piter-yellow w-full sm:w-auto"
            onClick={() => navigate('/create-order')}
          >
            <Plus className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t.createOrder}
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <StatCard
            title={t.totalOrders}
            value={totalOrders}
            icon={Package}
            color="blue"
          />
          <StatCard
            title={t.pendingOrders}
            value={pendingOrders}
            icon={Clock}
            color="yellow"
          />
          <StatCard
            title={t.approvedOrders}
            value={approvedOrders}
            icon={CheckCircle}
            color="green"
          />
          <StatCard
            title={t.rejectedOrders}
            value={rejectedOrders}
            icon={XCircle}
            color="red"
          />
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