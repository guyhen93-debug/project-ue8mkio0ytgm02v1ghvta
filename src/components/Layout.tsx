import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from './LanguageToggle';
import { BottomNavigation } from './BottomNavigation';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showBottomNav?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  title, 
  showBottomNav = true 
}) => {
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();

  return (
    <div className={`min-h-screen bg-gray-50 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-sm">PN</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                {title || 'Piter Noufi'}
              </h1>
              {user && (
                <p className="text-xs text-gray-500">
                  {user.name} • {user.company}
                </p>
              )}
            </div>
          </div>
          <LanguageToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      {showBottomNav && user && <BottomNavigation />}
    </div>
  );
};