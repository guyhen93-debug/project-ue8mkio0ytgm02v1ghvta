import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import OrderManagement from '@/components/admin/OrderManagement';
import ClientManagement from '@/components/admin/ClientManagement';
import SiteManagement from '@/components/admin/SiteManagement';
import ProductManagement from '@/components/admin/ProductManagement';
import { superdevClient } from '@/lib/superdev/client';
import { Package, Users, MapPin, Settings } from 'lucide-react';

const AdminPanel = () => {
  const navigate = useNavigate();
  const [user, setUser] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      setLoading(true);
      const currentUser = await superdevClient.auth.me();
      console.log('Admin panel - Current user:', currentUser);
      console.log('Admin panel - User role:', currentUser?.role);
      setUser(currentUser);
      
      // Check if user is manager
      if (currentUser && currentUser.role !== 'manager') {
        console.log('Access denied - user is not a manager');
        navigate('/client-dashboard');
      }
    } catch (error) {
      console.error('Error loading user:', error);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout title="פאנל ניהול">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto mb-4"></div>
            <p className="text-gray-600">טוען...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user || user.role !== 'manager') {
    return (
      <Layout title="פאנל ניהול">
        <div className="p-4">
          <Card>
            <CardContent className="py-12 text-center">
              <Settings className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">גישה נדחתה - דף זה מיועד למנהלים בלבד</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="פאנל ניהול">
      <div className="p-4 space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">פאנל ניהול</h1>
          <p className="text-gray-600">ניהול הזמנות, לקוחות, אתרים ומוצרים</p>
        </div>

        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">הזמנות</span>
            </TabsTrigger>
            <TabsTrigger value="clients" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">לקוחות</span>
            </TabsTrigger>
            <TabsTrigger value="sites" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">אתרים</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">מוצרים</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <OrderManagement />
          </TabsContent>

          <TabsContent value="clients">
            <ClientManagement />
          </TabsContent>

          <TabsContent value="sites">
            <SiteManagement />
          </TabsContent>

          <TabsContent value="products">
            <ProductManagement />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default AdminPanel;