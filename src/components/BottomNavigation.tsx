import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Home, Plus, Bell, User } from 'lucide-react';

export const BottomNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useLanguage();

  const getHomeRoute = () => {
    return user?.role === 'client' ? '/client' : '/manager';
  };

  const navItems = [
    {
      icon: Home,
      label: t('home'),
      path: getHomeRoute(),
      active: location.pathname === getHomeRoute()
    },
    ...(user?.role === 'client' ? [{
      icon: Plus,
      label: t('new_order'),
      path: '/create-order',
      active: location.pathname === '/create-order'
    }] : []),
    {
      icon: Bell,
      label: t('notifications'),
      path: '/notifications',
      active: location.pathname === '/notifications'
    },
    {
      icon: User,
      label: t('profile'),
      path: '/profile',
      active: location.pathname === '/profile'
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="max-w-md mx-auto px-4">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors ${
                  item.active
                    ? 'text-yellow-600 bg-yellow-50'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};