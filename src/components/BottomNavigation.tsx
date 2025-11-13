import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Home, Package, Settings, Mail, User as UserIcon } from 'lucide-react';
import { User } from '@/entities';

export const BottomNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const translations = {
    he: {
      home: 'בית',
      orders: 'הזמנות',
      inbox: 'דואר',
      admin: 'ניהול',
      profile: 'פרופיל'
    },
    en: {
      home: 'Home',
      orders: 'Orders',
      inbox: 'Inbox',
      admin: 'Admin',
      profile: 'Profile'
    }
  };

  const t = translations[language];

  useEffect(() => {
    loadUserRole();
  }, []);

  const loadUserRole = async () => {
    try {
      const currentUser = await User.me();
      setUserRole(currentUser.role || 'client');
    } catch (error) {
      console.error('Error loading user role:', error);
      setUserRole('client');
    } finally {
      setIsLoading(false);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  // Define all navigation items
  const allNavItems = [
    { path: '/manager-dashboard', icon: Home, label: t.home, showForAll: true },
    { path: '/create-order', icon: Package, label: t.orders, showForAll: true },
    { path: '/inbox', icon: Mail, label: t.inbox, showForAll: true },
    { path: '/admin', icon: Settings, label: t.admin, showForAll: false },
    { path: '/profile', icon: UserIcon, label: t.profile, showForAll: true }
  ];

  // Filter navigation items based on user role
  const visibleNavItems = allNavItems.filter(item => {
    if (item.showForAll) return true;
    // Show admin only for managers and administrators
    return userRole === 'manager' || userRole === 'administrator';
  });

  // Don't render until we know the user role to prevent flickering
  if (isLoading) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
        <div className="max-w-7xl mx-auto px-2">
          <div className="flex justify-around items-center h-16">
            {/* Show skeleton while loading */}
            {allNavItems.filter(item => item.showForAll).map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.path}
                  className="flex flex-col items-center justify-center flex-1 h-full text-gray-400"
                >
                  <Icon className="h-6 w-6 mb-1 opacity-50" />
                  <span className="text-xs font-medium opacity-50">{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
      <div className="max-w-7xl mx-auto px-2">
        <div className="flex justify-around items-center h-16">
          {visibleNavItems.map((item) => {
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