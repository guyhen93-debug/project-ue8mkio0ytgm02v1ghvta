import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireAuth?: boolean;
    requireManager?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
    children, 
    requireAuth = true,
    requireManager = false 
}) => {
    const { user, loading, isManager } = useAuth();
    const { t, language } = useLanguage();
    const { toast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        // Only redirect after loading is complete
        if (!loading) {
            if (requireAuth && !user) {
                console.log('No user found, redirecting to login...');
                // The platform handles login page redirect normally, but we ensure it goes to /
                // since there is no custom login page.
                // In this environment, User.login() is typically what triggers the login flow.
                return;
            }

            if (requireManager && !isManager) {
                console.log('User is not a manager, redirecting...');
                
                toast({
                    title: language === 'he' ? "אין הרשאה" : "No permission",
                    description: language === 'he' ? "אין לך גישה לעמוד זה" : "You don't have access to this page",
                    variant: "destructive",
                });

                navigate(user ? '/client-dashboard' : '/', { replace: true });
                return;
            }
        }
    }, [user, loading, requireAuth, requireManager, isManager, navigate, toast, language]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-20 h-20 bg-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <span className="text-black font-bold text-2xl">PN</span>
                    </div>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">{t('loading')}</p>
                </div>
            </div>
        );
    }

    if (requireAuth && !user) {
        return null; // Will be handled by the system auth or effect
    }

    if (requireManager && !isManager) {
        return null; // Will redirect to appropriate dashboard
    }

    return <>{children}</>;
};
