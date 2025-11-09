import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import StatCard from '@/components/StatCard';
import RecentOrdersList from '@/components/RecentOrdersList';
import { Button } from '@/components/ui/button';
import { Order } from '@/entities';
import { Package, Clock, CheckCircle, XCircle, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ClientDashboard = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const userOrders = await Order.filter(
        { created_by: user.email },
        '-created_at',
        100
      );
      
      setOrders(userOrders);
      
      // Calculate statistics
      const total = userOrders.length;
      const pending = userOrders.filter(o => o.status === 'pending').length;
      const approved = userOrders.filter(o => o.status === 'approved').length;
      const rejected = userOrders.filter(o => o.status === 'rejected').length;
      
      setStats({ total, pending, approved, rejected });
    } catch (error) {
      console.error('Error loading orders:', error);
      toast({
        title: t('error'),
        description: t('failed_to_load_orders'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = () => {
    navigate('/create-order');
  };

  const handleViewAllOrders = () => {
    navigate('/client-dashboard');
  };

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <div className="mobile-container mobile-padding">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {t('welcome')}, {user.full_name || user.name}
          </h1>
          <p className="text-gray-600">
            {t('client_dashboard_subtitle')}
          </p>
        </div>

        {/* Quick Action Button */}
        <div className="mb-6">
          <Button
            onClick={handleCreateOrder}
            className="w-full piter-yellow h-12 text-base font-semibold"
          >
            <Plus className="h-5 w-5 ml-2" />
            {t('create_new_order')}
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <StatCard
            title={t('total_orders')}
            value={stats.total}
            icon={Package}
            description={t('all_time')}
          />
          <StatCard
            title={t('pending')}
            value={stats.pending}
            icon={Clock}
            description={t('awaiting_approval')}
          />
          <StatCard
            title={t('approved')}
            value={stats.approved}
            icon={CheckCircle}
            description={t('ready_for_delivery')}
          />
          <StatCard
            title={t('rejected')}
            value={stats.rejected}
            icon={XCircle}
            description={t('need_revision')}
          />
        </div>

        {/* Recent Orders */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">{t('loading')}</p>
          </div>
        ) : (
          <RecentOrdersList
            orders={orders}
            onViewAll={handleViewAllOrders}
          />
        )}
      </div>
    </Layout>
  );
};

export default ClientDashboard;