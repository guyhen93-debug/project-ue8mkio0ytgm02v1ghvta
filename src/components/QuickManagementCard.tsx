import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Settings, Users, Building2, Package2, ClipboardList } from 'lucide-react';

const QuickManagementCard: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();

  const translations = {
    he: {
      title: 'ניהול מהיר',
      orders: 'ניהול הזמנות',
      clients: 'ניהול לקוחות',
      sites: 'ניהול אתרים',
      products: 'ניהול מוצרים',
      ordersDesc: 'צפה וערוך הזמנות',
      clientsDesc: 'נהל לקוחות',
      sitesDesc: 'נהל אתרי בניה',
      productsDesc: 'נהל מוצרים'
    },
    en: {
      title: 'Quick Management',
      orders: 'Manage Orders',
      clients: 'Manage Clients',
      sites: 'Manage Sites',
      products: 'Manage Products',
      ordersDesc: 'View and edit orders',
      clientsDesc: 'Manage clients',
      sitesDesc: 'Manage construction sites',
      productsDesc: 'Manage products'
    }
  };

  const t = translations[language];
  const isRTL = language === 'he';

  const managementItems = [
    {
      icon: ClipboardList,
      label: t.orders,
      description: t.ordersDesc,
      onClick: () => navigate('/admin?tab=orders'),
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: Users,
      label: t.clients,
      description: t.clientsDesc,
      onClick: () => navigate('/admin?tab=clients'),
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: Building2,
      label: t.sites,
      description: t.sitesDesc,
      onClick: () => navigate('/admin?tab=sites'),
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      icon: Package2,
      label: t.products,
      description: t.productsDesc,
      onClick: () => navigate('/admin?tab=products'),
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  return (
    <Card className="industrial-card">
      <CardHeader className="p-3 sm:p-6">
        <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
          <Settings className="w-5 h-5 text-yellow-500" />
          {t.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-6 pt-0">
        <div className="grid grid-cols-2 gap-3">
          {managementItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                onClick={item.onClick}
                className={`${item.bgColor} p-4 rounded-lg text-${isRTL ? 'right' : 'left'} hover:shadow-md transition-all hover:scale-105`}
              >
                <Icon className={`w-6 h-6 ${item.color} mb-2`} />
                <div className="font-semibold text-sm text-gray-900 mb-1">
                  {item.label}
                </div>
                <div className="text-xs text-gray-600">
                  {item.description}
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickManagementCard;