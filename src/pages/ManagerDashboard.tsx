import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Order, Site, Product } from '@/entities';
import { useLanguage } from '@/contexts/LanguageContext';
import { ClipboardList, CheckCircle, XCircle, Clock, Plus, Settings } from 'lucide-react';
import RecentOrdersList from '@/components/RecentOrdersList';
import { StatCard } from '@/components/StatCard';

const ManagerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [orders, setOrders] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const translations = {
    he: {
      title: 'דשבורד מנהל',
      welcome: 'ברוך הבא',
      totalOrders: 'סה״כ הזמנות',
      pendingOrders: 'ממתינות לאישור',
      approvedOrders: 'הזמנות מאושרות',
      completedOrders: 'הזמנות שהושלמו',
      recentOrders: 'הזמנות אחרונות',
      viewAll: 'צפה בכל ההזמנות',
      adminPanel: 'פאנל ניהול',
      noOrders: 'אין הזמנות במערכת'
    },
    en: {
      title: 'Manager Dashboard',
      welcome: 'Welcome',
      totalOrders: 'Total Orders',
      pendingOrders: 'Pending Approval',
      approvedOrders: 'Approved Orders',
      completedOrders: 'Completed Orders',
      recentOrders: 'Recent Orders',
      viewAll: 'View All Orders',
      adminPanel: 'Admin Panel',
      noOrders: 'No orders in the system'
    }
  };

  const t = translations[language];
  const isRTL = language === 'he';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordersData, sitesData, productsData] = await Promise.all([
        Order.list('-created_at', 1000),
        Site.list('-created_at', 1000),
        Product.list('-created_at', 1000)
      ]);
      console.log('Loaded orders:', ordersData.length);
      setOrders(ordersData);
      setSites(sitesData);
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    approved: orders.filter(o => o.status === 'approved').length,
    completed: orders.filter(o => o.status === 'completed').length
  };

  const recentOrders = orders.slice(0, 5);

  return (
    <Layout title={t.title}>
      <div className="p-3 sm:p-4 md:p-6 pb-24" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Quick Actions */}
        <div className="mb-6 flex gap-3">
          <Button 
            className="piter-yellow flex-1 sm:flex-none"
            onClick={() => navigate('/admin?tab=orders')}
          >
            <ClipboardList className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t.viewAll}
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate('/admin')}
            className="flex-1 sm:flex-none"
          >
            <Settings className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t.adminPanel}
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <StatCard
            title={t.totalOrders}
            value={stats.total}
            icon={ClipboardList}
            color="blue"
          />
          <StatCard
            title={t.pendingOrders}
            value={stats.pending}
            icon={Clock}
            color="yellow"
          />
          <StatCard
            title={t.approvedOrders}
            value={stats.approved}
            icon={CheckCircle}
            color="green"
          />
          <StatCard
            title={t.completedOrders}
            value={stats.completed}
            icon={CheckCircle}
            color="blue"
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
              <RecentOrdersList limit={5} />
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ManagerDashboard;