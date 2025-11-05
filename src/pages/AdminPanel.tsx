import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProductManagement from '@/components/admin/ProductManagement';
import { Building, MapPin, Package, ShoppingCart, Settings } from 'lucide-react';

// Import existing components
import ClientManagement from '@/components/admin/ClientManagement';
import SiteManagement from '@/components/admin/SiteManagement';
import OrderManagement from '@/components/admin/OrderManagement';

const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  if (user?.role !== 'manager') {
    return (
      <Layout title={t('admin_panel')}>
        <div className="px-4 py-8 text-center">
          <h2 className="text-xl font-bold text-red-600">{t('access_denied')}</h2>
          <p className="text-gray-600 mt-2">{t('manager_only_access')}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={t('admin_panel')}>
      <div className="px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('admin_panel')}</h1>
          <p className="text-gray-600">{t('manage_all_system_data')}</p>
        </div>

        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              {t('orders')}
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              {t('products')}
            </TabsTrigger>
            <TabsTrigger value="clients" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              {t('clients')}
            </TabsTrigger>
            <TabsTrigger value="sites" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {t('sites')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="mt-6">
            <OrderManagement />
          </TabsContent>

          <TabsContent value="products" className="mt-6">
            <ProductManagement />
          </TabsContent>

          <TabsContent value="clients" className="mt-6">
            <ClientManagement />
          </TabsContent>

          <TabsContent value="sites" className="mt-6">
            <SiteManagement />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default AdminPanel;