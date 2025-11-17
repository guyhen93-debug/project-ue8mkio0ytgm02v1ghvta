import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClientManagement } from '@/components/admin/ClientManagement';
import { SiteManagement } from '@/components/admin/SiteManagement';
import { ProductManagement } from '@/components/admin/ProductManagement';
import { OrderManagement } from '@/components/admin/OrderManagement';
import { UserManagement } from '@/components/admin/UserManagement';
import { useLanguage } from '@/contexts/LanguageContext';
import { Users, Building2, Package2, ClipboardList, UserCog } from 'lucide-react';

const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'orders');

  const translations = {
    he: {
      title: 'פאנל ניהול',
      orders: 'הזמנות',
      clients: 'לקוחות',
      sites: 'אתרים',
      products: 'מוצרים',
      users: 'משתמשים'
    },
    en: {
      title: 'Admin Panel',
      orders: 'Orders',
      clients: 'Clients',
      sites: 'Sites',
      products: 'Products',
      users: 'Users'
    }
  };

  const t = translations[language];

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  return (
    <Layout title={t.title}>
      <div className="p-3 sm:p-4 md:p-6 pb-24" dir={language === 'he' ? 'rtl' : 'ltr'}>
        <Card className="industrial-card">
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-xl sm:text-2xl font-bold">{t.title}</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 gap-2 h-auto bg-transparent p-0 mb-6">
                <TabsTrigger 
                  value="orders" 
                  className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black flex items-center gap-2 py-3 px-4"
                >
                  <ClipboardList className="w-4 h-4" />
                  <span>{t.orders}</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="clients"
                  className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black flex items-center gap-2 py-3 px-4"
                >
                  <Users className="w-4 h-4" />
                  <span>{t.clients}</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="sites"
                  className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black flex items-center gap-2 py-3 px-4"
                >
                  <Building2 className="w-4 h-4" />
                  <span>{t.sites}</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="products"
                  className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black flex items-center gap-2 py-3 px-4"
                >
                  <Package2 className="w-4 h-4" />
                  <span>{t.products}</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="users"
                  className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black flex items-center gap-2 py-3 px-4"
                >
                  <UserCog className="w-4 h-4" />
                  <span>{t.users}</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="orders" className="mt-0">
                <OrderManagement />
              </TabsContent>

              <TabsContent value="clients" className="mt-0">
                <ClientManagement />
              </TabsContent>

              <TabsContent value="sites" className="mt-0">
                <SiteManagement />
              </TabsContent>

              <TabsContent value="products" className="mt-0">
                <ProductManagement />
              </TabsContent>

              <TabsContent value="users" className="mt-0">
                <UserManagement />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AdminPanel;