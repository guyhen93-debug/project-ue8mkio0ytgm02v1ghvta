import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClientManagement } from '@/components/admin/ClientManagement';
import { SiteManagement } from '@/components/admin/SiteManagement';
import { ProductManagement } from '@/components/admin/ProductManagement';
import { UserManagement } from '@/components/admin/UserManagement';
import { useLanguage } from '@/contexts/LanguageContext';
import { Users, Building2, Package2, UserCog } from 'lucide-react';

const AdminPanel: React.FC = () => {
    const { language } = useLanguage();
    const [managementTab, setManagementTab] = useState<'clients' | 'sites' | 'products' | 'users'>('clients');

    const translations = {
        he: {
            title: 'הגדרות מערכת',
            clients: 'לקוחות',
            sites: 'אתרים',
            products: 'מוצרים',
            users: 'משתמשים',
            manageClients: 'ניהול לקוחות',
            manageSites: 'ניהול אתרים',
            manageProducts: 'ניהול מוצרים',
            manageUsers: 'ניהול משתמשים'
        },
        en: {
            title: 'System Settings',
            clients: 'Clients',
            sites: 'Sites',
            products: 'Products',
            users: 'Users',
            manageClients: 'Client Management',
            manageSites: 'Site Management',
            manageProducts: 'Product Management',
            manageUsers: 'User Management'
        }
    };

    const t = translations[language];
    const isRTL = language === 'he';

    return (
        <Layout title={t.title}>
            <div className="p-3 sm:p-4 md:p-6 pb-24" dir={isRTL ? 'rtl' : 'ltr'}>
                <Card className="industrial-card">
                    <CardHeader className="p-3 sm:p-6">
                        <CardTitle className="text-xl sm:text-2xl font-bold">{t.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-6 pt-0">
                        <Tabs value={managementTab} onValueChange={(v) => setManagementTab(v as any)} className="w-full">
                            <TabsList className="flex w-full overflow-x-auto rounded-none border-b bg-transparent p-0 mb-6 h-auto no-scrollbar">
                                <TabsTrigger
                                    value="clients"
                                    className="flex-1 min-w-[100px] px-3 py-3 text-xs sm:text-sm font-medium rounded-none border-b-2 border-transparent data-[state=active]:bg-transparent data-[state=active]:text-black data-[state=active]:border-yellow-500 data-[state=active]:font-bold data-[state=active]:shadow-none transition-all flex flex-col sm:flex-row items-center gap-1.5"
                                >
                                    <Users className="w-4 h-4" />
                                    <span className="truncate">{t.manageClients}</span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="sites"
                                    className="flex-1 min-w-[100px] px-3 py-3 text-xs sm:text-sm font-medium rounded-none border-b-2 border-transparent data-[state=active]:bg-transparent data-[state=active]:text-black data-[state=active]:border-yellow-500 data-[state=active]:font-bold data-[state=active]:shadow-none transition-all flex flex-col sm:flex-row items-center gap-1.5"
                                >
                                    <Building2 className="w-4 h-4" />
                                    <span className="truncate">{t.manageSites}</span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="products"
                                    className="flex-1 min-w-[100px] px-3 py-3 text-xs sm:text-sm font-medium rounded-none border-b-2 border-transparent data-[state=active]:bg-transparent data-[state=active]:text-black data-[state=active]:border-yellow-500 data-[state=active]:font-bold data-[state=active]:shadow-none transition-all flex flex-col sm:flex-row items-center gap-1.5"
                                >
                                    <Package2 className="w-4 h-4" />
                                    <span className="truncate">{t.manageProducts}</span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="users"
                                    className="flex-1 min-w-[100px] px-3 py-3 text-xs sm:text-sm font-medium rounded-none border-b-2 border-transparent data-[state=active]:bg-transparent data-[state=active]:text-black data-[state=active]:border-yellow-500 data-[state=active]:font-bold data-[state=active]:shadow-none transition-all flex flex-col sm:flex-row items-center gap-1.5"
                                >
                                    <UserCog className="w-4 h-4" />
                                    <span className="truncate">{t.manageUsers}</span>
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="clients" className="animate-in fade-in duration-300">
                                <div className="bg-gray-50/50 rounded-xl border border-gray-100 p-1">
                                    <ClientManagement />
                                </div>
                            </TabsContent>

                            <TabsContent value="sites" className="animate-in fade-in duration-300">
                                <div className="bg-gray-50/50 rounded-xl border border-gray-100 p-1">
                                    <SiteManagement />
                                </div>
                            </TabsContent>

                            <TabsContent value="products" className="animate-in fade-in duration-300">
                                <div className="bg-gray-50/50 rounded-xl border border-gray-100 p-1">
                                    <ProductManagement />
                                </div>
                            </TabsContent>

                            <TabsContent value="users" className="animate-in fade-in duration-300">
                                <div className="bg-gray-50/50 rounded-xl border border-gray-100 p-1">
                                    <UserManagement />
                                </div>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
};

export default AdminPanel;
