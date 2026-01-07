import React from 'react';
import Layout from '@/components/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { OrderManagement } from '@/components/admin/OrderManagement';
import { ClipboardList, Download } from 'lucide-react';

const ManagerOrders: React.FC = () => {
    const { language } = useLanguage();
    
    const translations = {
        he: {
            title: 'הזמנות',
            manageOrders: 'ניהול הזמנות',
            exportExcel: 'ייצוא לאקסל'
        },
        en: {
            title: 'Orders',
            manageOrders: 'Order Management',
            exportExcel: 'Export to Excel'
        }
    };

    const t = translations[language];
    const isRTL = language === 'he';

    return (
        <Layout title={t.title}>
            <div className="p-3 sm:p-4 md:p-6 pb-24" dir={isRTL ? 'rtl' : 'ltr'}>
                <OrderManagement />
            </div>
        </Layout>
    );
};

export default ManagerOrders;
