import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Notification, Message } from '@/entities';
import { Home, MessageCircle, Bell, User, Settings } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showBottomNav?: boolean;
  className?: string;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  title, 
  showBottomNav = true, 
  className = "" 
}) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Load unread counts
  useEffect(() => {
    if (user?.email) {
      console.log('Loading unread counts for user:', user.email);
      loadUnreadCounts();
    }
  }, [user?.email]);

  // Listen for notification and message updates
  useEffect(() => {
    const handleUpdate = () => {
      console.log('Update event received');
      if (user?.email) {
        loadUnreadCounts();
      }
    };

    window.addEventListener('notificationRead', handleUpdate);
    window.addEventListener('messageRead', handleUpdate);
    return () => {
      window.removeEventListener('notificationRead', handleUpdate);
      window.removeEventListener('messageRead', handleUpdate);
    };
  }, [user?.email]);

  // Refresh when navigating between pages
  useEffect(() => {
    if (user?.email) {
      console.log('Route changed to:', location.pathname);
      // Small delay to allow for any pending operations
      const timer = setTimeout(() => {
        loadUnreadCounts();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, user?.email]);

  const loadUnreadCounts = async () => {
    try {
      console.log('Starting to load unread counts...');
      
      // Load notifications
      try {
        console.log('Querying notifications for:', user?.email);
        const notifications = await Notification.filter({
          recipient_email: user?.email,
          is_read: false
        });
        console.log('Raw unread notifications:', notifications);
        console.log('Unread notifications count:', notifications.length);
        setUnreadNotifications(notifications.length);
      } catch (notificationError) {
        console.error('Error loading notifications:', notificationError);
        setUnreadNotifications(0);
      }

      // Load messages
      try {
        console.log('Querying messages for:', user?.email);
        const messages = await Message.filter({
          recipient_email: user?.email,
          is_read: false
        });
        console.log('Raw unread messages:', messages);
        console.log('Unread messages count:', messages.length);
        setUnreadMessages(messages.length);
      } catch (messageError) {
        console.error('Error loading messages:', messageError);
        setUnreadMessages(0);
      }
    } catch (error) {
      console.error('Error in loadUnreadCounts:', error);
      setUnreadNotifications(0);
      setUnreadMessages(0);
    }
  };

  // Force refresh function for debugging
  const forceRefresh = () => {
    console.log('Force refreshing counts...');
    loadUnreadCounts();
  };

  const navItems = [
    {
      icon: Home,
      label: t('home'),
      path: user?.role === 'manager' ? '/manager' : '/client',
      active: location.pathname === (user?.role === 'manager' ? '/manager' : '/client')
    },
    {
      icon: MessageCircle,
      label: t('inbox'),
      path: '/inbox',
      active: location.pathname === '/inbox',
      badge: unreadMessages > 0 ? unreadMessages : undefined
    },
    {
      icon: Bell,
      label: t('notifications'),
      path: '/notifications',
      active: location.pathname === '/notifications',
      badge: unreadNotifications > 0 ? unreadNotifications : undefined
    },
    {
      icon: User,
      label: t('profile'),
      path: '/profile',
      active: location.pathname === '/profile'
    }
  ];

  if (user?.role === 'manager') {
    navItems.splice(3, 0, {
      icon: Settings,
      label: t('admin'),
      path: '/admin',
      active: location.pathname === '/admin'
    });
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>  
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="px-4 py-3 flex justify-between items-center">
          <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
          {/* Debug button - remove in production */}
          {process.env.NODE_ENV === 'development' && (
            <button 
              onClick={forceRefresh}
              className="text-xs bg-gray-200 px-2 py-1 rounded"
            >
              Refresh (N:{unreadNotifications} M:{unreadMessages})
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className={showBottomNav ? "pb-20" : ""}>
        {children}
      </main>

      {/* Bottom Navigation */}
      {showBottomNav && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
          <div className="flex items-center justify-around py-2">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center p-2 min-w-0 flex-1 relative ${
                  item.active 
                    ? 'text-yellow-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <item.icon className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium truncate">{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px] font-bold">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
};