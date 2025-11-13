import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Order, Site, Product, User, Client } from '@/entities';
import { useLanguage } from '@/contexts/LanguageContext';
import { ClipboardList, CheckCircle, Clock, Plus, Package } from 'lucide-react';
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
  const [userClient, setUserClient] = useState<any>(null);

  const translations = {
    he: {
      title: 'דשבורד לקוח',
      welcome: 'ברוך הבא',
      myOrders: 'ההזמנות שלי',
      totalOrders: 'סה״כ הזמנות',
      pendingOrders: 'ממתינות לאישור',
      approvedOrders: 'הזמנות מאושרות',
      completedOrders: 'הזמנות שהושלמו',
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
      completedOrders: 'Completed Orders',
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

      const [allClients, sitesData, productsData] = await Promise.all([
        Client.list('-created_at', 1000),
        Site.list('-created_at', 1000),
        Product.list('-created_at', 1000)
      ]);

      // Find user's client
      let matchingClient = allClients.find(c => 
        c.created_by === currentUser.email || 
        (currentUser.company && c.name === currentUser.company)
      );

      if (!matchingClient && currentUser.email) {
        matchingClient = allClients.find(c => 
          currentUser.email.toLowerCase().includes(c.name.toLowerCase()) ||
          c.name.toLowerCase().includes(currentUser.email.split('@')[0].toLowerCase())
        );
      }

      if (matchingClient) {
        setUserClient(matchingClient);
        
        // Load client's orders
        const clientOrders = await Order.filter({ client_id: matchingClient.id }, '-created_at', 1000);
        setOrders(clientOrders);
      }
      
      setSites(sitesData);
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const approvedOrders = orders.filter(o => o.status === 'approved').length;
  const completedOrders = orders.filter(o => o.status === 'completed').length;

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
            title={t.completedOrders}
            value={completedOrders}
            icon={ClipboardList}
            color="purple"
          />
        </div>

        {/* Recent Orders */}
        <Card className="industrial-card">
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">{t.myOrders}</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto"></div>
              </div>
            ) : userClient ? (
              <RecentOrdersList limit={100} clientId={userClient.id} />
            ) : (
              <div className="text-center py-12 text-gray-500">
                {t.noOrders}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ClientDashboard;