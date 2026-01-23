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
      // Direct count of unread items
      const unread = await Notification.filter(
        { recipient_email: user.email, is_read: false },
        '-created_at',
        20
      );
      
      setUnreadCount(unread?.length || 0);
    } catch (error) {
      console.log('NotificationBadge: Could not load count (silent)');
    }
  };

  return (
    <div className={`relative ${className}`}>
      {children}
      {unreadCount > 0 && (
        <span 
          className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 min-w-[1rem] px-1 flex items-center justify-center border-2 border-white shadow-sm z-10"
          style={{ transform: 'translate(25%, -25%)' }}
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </div>
  );
};
