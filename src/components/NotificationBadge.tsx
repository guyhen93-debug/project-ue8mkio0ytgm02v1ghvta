import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Notification, User } from '@/entities';

interface NotificationBadgeProps {
  children: React.ReactNode;
  className?: string;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({ children, className = '' }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Safe auth access - won't crash if AuthProvider is not available
  let user = null;
  try {
    const auth = useAuth();
    user = auth?.user;
  } catch (error) {
    // AuthProvider not available yet, that's okay
    console.log('AuthProvider not ready yet');
  }

  useEffect(() => {
    if (user) {
      loadUnreadCount();
      // Poll for updates every 30 seconds
      const interval = setInterval(loadUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadUnreadCount = async () => {
    if (!user) return;
    
    try {
      const notifications = await Notification.filter(
        { recipient_email: user.email, is_read: false },
        '-created_at',
        100
      );
      setUnreadCount(notifications?.length || 0);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {children}
      {unreadCount > 0 && (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
          {unreadCount > 9 ? '9+' : unreadCount}
        </div>
      )}
    </div>
  );
};