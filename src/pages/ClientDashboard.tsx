import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Order, Site, Product, User } from '@/entities';
import { useLanguage } from '@/contexts/LanguageContext';
import { ClipboardList, CheckCircle, Clock, Plus } from 'lucide-react';
import RecentOrdersList from '@/components/RecentOrdersList';
import { StatCard } from '@/components/StatCard';

const ClientDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [orders, setOrders] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const translations = {
    he: {
      title: 'דשבורד לקוח',
      welcome: 'ברוך הבא',
      myOrders: 'ההזמנות שלי',
      totalOrders: 'סה״כ הזמנות',
      pendingOrders: 'ממתינות לאישור',
      approvedOrders: 'הזמנות מאושרות',
      recentOrders: 'הזמנות אחרונות',
      createOrder: 'צור הזמנה חדשה',
      noOrders: 'אין לך הזמנות עדיין'
    },
    en: {
      title: 'Client Dashboard',
      welcome: 'Welcome',
      myOrders: 'My Orders',
      totalOrders: 'Total Orders',
      pendingOrders: 'Pending Approval',
      approvedOrders: 'Approved Orders',
      recentOrders: 'Recent Orders',
      createOrder: 'Create New Order',
      noOrders: 'You have no orders yet'
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
      const currentUser = await User.me();
      setUser(currentUser);

      const [ordersData, sitesData, productsData] = await Promise.all([
        Order.filter({ created_by: currentUser.email }, '-created_at', 1000),
        Site.list('-created_at', 1000),
        Product.list('-created_at', 1000)
      ]);
      
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
    approved: orders.filter(o => o.status === 'approved').length
  };

  const recentOrders = orders.slice(0, 5);

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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
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

export default ClientDashboard;