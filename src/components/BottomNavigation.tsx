import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { mockDataService } from '@/services/mockDataService';
import { Home, Plus, Bell, MessageCircle, User } from 'lucide-react';

export const BottomNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [unreadCounts, setUnreadCounts] = useState({ notifications: 0, messages: 0 });

  useEffect(() => {
    if (user) {
      loadUnreadCounts();
      const interval = setInterval(loadUnreadCounts, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadUnreadCounts = async () => {
    if (user) {
      try {
        const notificationCount = await mockDataService.getUnreadNotificationCount(user.id);
        const messageCount = await mockDataService.getUnreadMessageCount(user.id);
        setUnreadCounts({ notifications: notificationCount, messages: messageCount });
      } catch (error) {
        console.error('Error loading unread counts:', error);
      }
    }
  };

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
      badgeCount: unreadCounts.notifications
    },
    {
      path: '/inbox',
      icon: MessageCircle,
      label: t('inbox'),
      show: true,
      badgeCount: unreadCounts.messages
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
      <div className="max-w-md mx-auto px-2">
        <div className="flex items-center justify-around py-2">
          {navItems.filter(item => item.show).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <div key={item.path} className="relative">
                <button
                  onClick={() => navigate(item.path)}
                  className={`flex flex-col items-center justify-center py-2 px-2 rounded-lg transition-colors ${
                    active 
                      ? 'text-yellow-600 bg-yellow-50' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${active ? 'text-yellow-600' : 'text-gray-600'}`} />
                  <span className={`text-xs mt-1 font-medium ${active ? 'text-yellow-600' : 'text-gray-600'}`}>
                    {item.label}
                  </span>
                </button>
                {item.badgeCount && item.badgeCount > 0 && (
                  <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {item.badgeCount > 9 ? '9+' : item.badgeCount}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
};