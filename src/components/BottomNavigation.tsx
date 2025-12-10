import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Notification } from '@/entities';
import { Home, ClipboardList, Mail, User as UserIcon, Settings } from 'lucide-react';

export const BottomNavigation: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { language } = useLanguage();
    const { user, isManager } = useAuth();
    const [unreadNotifications, setUnreadNotifications] = useState(0);

    const translations = {
        he: {
            home: 'בית',
            myOrders: 'ההזמנות שלי',
            inbox: 'דואר',
            profile: 'פרופיל',
            admin: 'ניהול'
        },
        en: {
            home: 'Home',
            myOrders: 'My Orders',
            inbox: 'Inbox',
            profile: 'Profile',
            admin: 'Admin'
        }
    };

    const t = translations[language];

    // Load unread notifications count
    useEffect(() => {
        if (user) {
            loadUnreadCount();
            // Poll every 30 seconds
            const interval = setInterval(loadUnreadCount, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const loadUnreadCount = async () => {
        if (!user) return;

        try {
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Request timeout')), 5000)
            );

            const notificationsPromise = Notification.filter(
                { recipient_email: user.email, is_read: false },
                '-created_at',
                100
            );

            const notifications = await Promise.race([notificationsPromise, timeoutPromise]);
            setUnreadNotifications(notifications?.length || 0);
        } catch (error) {
            console.log('Could not load notification count');
        }
    };

    // Determine home path based on user role
    const getHomePath = () => {
        if (!user) return '/manager-dashboard';
        return isManager ? '/manager-dashboard' : '/client-dashboard';
    };

    const homePath = getHomePath();

    const isActive = (path: string) => {
        if (path === homePath) {
            return location.pathname === '/manager-dashboard' || location.pathname === '/client-dashboard';
        }
        return location.pathname === path;
    };

    // Define navigation items based on user role
    const getNavItems = () => {
        const baseItems = [
            { path: homePath, icon: Home, label: t.home, showBadge: true },
            { path: '/order-history', icon: ClipboardList, label: t.myOrders, showBadge: false },
            { path: '/inbox', icon: Mail, label: t.inbox, showBadge: false },
            { path: '/profile', icon: UserIcon, label: t.profile, showBadge: false }
        ];

        // Add admin button for managers
        if (isManager) {
            return [
                ...baseItems.slice(0, 3),
                { path: '/admin', icon: Settings, label: t.admin, showBadge: false },
                ...baseItems.slice(3)
            ];
        }

        return baseItems;
    };

    const navItems = getNavItems();

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
                                className={`relative flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                                    active
                                        ? 'text-yellow-600'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                <div className="relative">
                                    <Icon className={`h-6 w-6 mb-1 transition-all ${active ? 'scale-110' : ''}`} />
                                    {item.showBadge && unreadNotifications > 0 && (
                                        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                                            {unreadNotifications > 9 ? '9+' : unreadNotifications}
                                        </div>
                                    )}
                                </div>
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