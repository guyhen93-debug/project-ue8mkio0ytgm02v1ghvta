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
                <Card className="industrial-card">
                    <CardHeader className="p-3 sm:p-6 flex flex-row items-center justify-between space-y-0">
                        <div className="flex items-center gap-2">
                            <ClipboardList className="w-5 h-5 text-yellow-600" />
                            <CardTitle className="text-xl sm:text-2xl font-bold">{t.manageOrders}</CardTitle>
                        </div>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-yellow-500 text-yellow-700 hover:bg-yellow-50 h-8 sm:h-9"
                            onClick={() => console.log('Export to Excel clicked')}
                        >
                            <Download className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                            {t.exportExcel}
                        </Button>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-6 pt-0">
                        <div className="bg-gray-50/50 rounded-xl border border-gray-100 p-1">
                            <OrderManagement />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
};

export default ManagerOrders;
