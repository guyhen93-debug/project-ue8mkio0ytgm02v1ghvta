import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Notification, Message } from '@/entities';
import { superdevClient } from '@/lib/superdev/client';
import { Home, MessageCircle, Bell, User, Settings } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showBottomNav?: boolean;
  className?: string;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  title, 
  showBottomNav = true, 
  className = "" 
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [isLoadingCounts, setIsLoadingCounts] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await superdevClient.auth.me();
      setUser(currentUser);
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

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
      const timer = setTimeout(() => {
        loadUnreadCounts();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, user?.email]);

  const loadUnreadCounts = async () => {
    if (isLoadingCounts) return;
    
    try {
      setIsLoadingCounts(true);
      console.log('Starting to load unread counts...');
      
      try {
        console.log('Querying notifications for:', user?.email);
        const notifications = await withRetry(async () => {
          return await Notification.filter({
            recipient_email: user?.email,
            is_read: false
          });
        });
        
        if (notifications !== null) {
          console.log('Raw unread notifications:', notifications);
          console.log('Unread notifications count:', notifications.length);
          setUnreadNotifications(notifications.length);
        } else {
          console.log('Failed to load notifications after retries, keeping current count');
        }
      } catch (notificationError) {
        console.error('Error loading notifications:', notificationError);
      }

      try {
        console.log('Querying messages for:', user?.email);
        const messages = await withRetry(async () => {
          return await Message.filter({
            recipient_email: user?.email,
            is_read: false
          });
        });
        
        if (messages !== null) {
          console.log('Raw unread messages:', messages);
          console.log('Unread messages count:', messages.length);
          setUnreadMessages(messages.length);
        } else {
          console.log('Failed to load messages after retries, keeping current count');
        }
      } catch (messageError) {
        console.error('Error loading messages:', messageError);
      }
    } catch (error) {
      console.error('Error in loadUnreadCounts:', error);
    } finally {
      setIsLoadingCounts(false);
    }
  };

  const withRetry = async <T,>(
    operation: () => Promise<T>, 
    maxRetries: number = 2, 
    delay: number = 1000
  ): Promise<T | null> => {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        console.log(`Operation failed, retry ${i + 1}/${maxRetries}:`, error);
        
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    console.error('Operation failed after all retries:', lastError);
    return null;
  };

  const forceRefresh = () => {
    console.log('Force refreshing counts...');
    loadUnreadCounts();
  };

  const navItems = [
    {
      icon: Home,
      label: 'בית',
      path: user?.role === 'manager' ? '/manager-dashboard' : '/client-dashboard',
      active: location.pathname === (user?.role === 'manager' ? '/manager-dashboard' : '/client-dashboard')
    },
    {
      icon: MessageCircle,
      label: 'הודעות',
      path: '/inbox',
      active: location.pathname === '/inbox',
      badge: unreadMessages > 0 ? unreadMessages : undefined
    },
    {
      icon: Bell,
      label: 'התראות',
      path: '/notifications',
      active: location.pathname === '/notifications',
      badge: unreadNotifications > 0 ? unreadNotifications : undefined
    },
    {
      icon: User,
      label: 'פרופיל',
      path: '/profile',
      active: location.pathname === '/profile'
    }
  ];

  if (user?.role === 'manager') {
    navItems.splice(3, 0, {
      icon: Settings,
      label: 'ניהול',
      path: '/admin',
      active: location.pathname === '/admin'
    });
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>  
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="px-4 py-3 flex justify-between items-center">
          <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
          {process.env.NODE_ENV === 'development' && (
            <button 
              onClick={forceRefresh}
              className={`text-xs px-2 py-1 rounded ${
                isLoadingCounts 
                  ? 'bg-yellow-200 text-yellow-800' 
                  : 'bg-gray-200 text-gray-700'
              }`}
              disabled={isLoadingCounts}
            >
              {isLoadingCounts ? 'טוען...' : `רענן (N:${unreadNotifications} M:${unreadMessages})`}
            </button>
          )}
        </div>
      </header>

      <main className={showBottomNav ? "pb-20" : ""}>
        {children}
      </main>

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

export default Layout;
export { Layout };