import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ClientManagement from '@/components/admin/ClientManagement';
import SiteManagement from '@/components/admin/SiteManagement';
import ProductManagement from '@/components/admin/ProductManagement';
import OrderManagement from '@/components/admin/OrderManagement';
import { superdevClient } from '@/lib/superdev/client';
import { Building2, MapPin, Package, FileText, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const AdminPanel = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isManager, setIsManager] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      setLoading(true);
      const currentUser = await superdevClient.auth.me();
      console.log('Admin panel - Current user:', currentUser);
      console.log('Admin panel - User role:', currentUser?.role);
      
      setUser(currentUser);
      
      const userIsManager = currentUser?.role === 'manager';
      console.log('Admin panel - Is manager:', userIsManager);
      setIsManager(userIsManager);
    } catch (error) {
      console.error('Error loading user:', error);
      setIsManager(false);
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

  if (!isManager) {
    return (
      <Layout title="פאנל ניהול">
        <div className="p-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              הגישה נדחתה - הגישה למנהלים בלבד
            </AlertDescription>
          </Alert>
          <div className="mt-4 text-center text-gray-600">
            <p>משתמש: {user?.email || 'לא מזוהה'}</p>
            <p>תפקיד: {user?.role || 'לא מוגדר'}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="פאנל ניהול">
      <div className="p-2 sm:p-4 space-y-4 sm:space-y-6 pb-24">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">פאנל ניהול</h1>
          <p className="text-sm sm:text-base text-gray-600">ניהול לקוחות, אתרים, מוצרים והזמנות</p>
        </div>

        <Tabs defaultValue="orders" className="w-full" dir="rtl">
          <TabsList className="grid w-full grid-cols-4 mb-4 sm:mb-6 h-auto">
            <TabsTrigger value="orders" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-1.5 px-1 sm:px-3">
              <FileText className="h-4 w-4 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">הזמנות</span>
            </TabsTrigger>
            <TabsTrigger value="clients" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-1.5 px-1 sm:px-3">
              <Building2 className="h-4 w-4 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">לקוחות</span>
            </TabsTrigger>
            <TabsTrigger value="sites" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-1.5 px-1 sm:px-3">
              <MapPin className="h-4 w-4 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">אתרים</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-1.5 px-1 sm:px-3">
              <Package className="h-4 w-4 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">מוצרים</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-4 mt-0">
            <OrderManagement />
          </TabsContent>

          <TabsContent value="clients" className="space-y-4 mt-0">
            <ClientManagement />
          </TabsContent>

          <TabsContent value="sites" className="space-y-4 mt-0">
            <SiteManagement />
          </TabsContent>

          <TabsContent value="products" className="space-y-4 mt-0">
            <ProductManagement />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default AdminPanel;