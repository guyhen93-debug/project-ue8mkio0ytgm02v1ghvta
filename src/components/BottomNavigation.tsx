import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Home, Package, Mail, User as UserIcon } from 'lucide-react';

export const BottomNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();

  const translations = {
    he: {
      home: 'בית',
      orders: 'הזמנות',
      inbox: 'דואר',
      profile: 'פרופיל'
    },
    en: {
      home: 'Home',
      orders: 'Orders',
      inbox: 'Inbox',
      profile: 'Profile'
    }
  };

  const t = translations[language];

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/manager-dashboard', icon: Home, label: t.home },
    { path: '/create-order', icon: Package, label: t.orders },
    { path: '/inbox', icon: Mail, label: t.inbox },
    { path: '/profile', icon: UserIcon, label: t.profile }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
      <div className="max-w-7xl mx-auto px-2">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                  active 
                    ? 'text-yellow-600' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className={`h-6 w-6 mb-1 transition-all ${active ? 'scale-110' : ''}`} />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default BottomNavigation;