import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Notification } from '@/entities';

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
    return <div className={className}>{children}</div>;
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
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 5000)
      );
      
      const notificationsPromise = Notification.filter(
        { recipient_email: user.email, is_read: false },
        '-created_at',
        100
      );
      
      const notifications = await Promise.race([notificationsPromise, timeoutPromise]);
      setUnreadCount(notifications?.length || 0);
    } catch (error) {
      // Silently fail - this is just a badge, no need to show errors
      console.log('Could not load notification count (this is okay)');
      // Keep the previous count instead of resetting to 0
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