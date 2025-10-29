import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { NotificationBadge } from './NotificationBadge';
import { Home, Plus, Bell, User } from 'lucide-react';

export const BottomNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useLanguage();

  if (!user) return null;

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    {
      path: user.role === 'client' ? '/client' : '/manager',
      icon: Home,
      label: t('home'),
      show: true
    },
    {
      path: '/create-order',
      icon: Plus,
      label: t('new_order'),
      show: true
    },
    {
      path: '/notifications',
      icon: Bell,
      label: t('notifications'),
      show: true,
      withBadge: true
    },
    {
      path: '/profile',
      icon: User,
      label: t('profile'),
      show: true
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="max-w-md mx-auto px-4">
        <div className="flex items-center justify-around py-2">
          {navItems.filter(item => item.show).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            const content = (
              <button
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors ${
                  active 
                    ? 'text-yellow-600 bg-yellow-50' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className={`h-6 w-6 ${active ? 'text-yellow-600' : 'text-gray-600'}`} />
                <span className={`text-xs mt-1 font-medium ${active ? 'text-yellow-600' : 'text-gray-600'}`}>
                  {item.label}
                </span>
              </button>
            );

            return (
              <div key={item.path}>
                {item.withBadge ? (
                  <NotificationBadge>
                    {content}
                  </NotificationBadge>
                ) : (
                  content
                )}
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
};