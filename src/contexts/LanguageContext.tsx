import React, { createContext, useContext, useState, useEffect } from 'react';

interface LanguageContextType {
  language: 'en' | 'he';
  setLanguage: (lang: 'en' | 'he') => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  en: {
    // Auth
    'login': 'Login',
    'email_or_phone': 'Email or Phone',
    'password': 'Password',
    'forgot_password': 'Forgot Password',
    'welcome_back': 'Welcome Back',
    'login_to_continue': 'Login to continue to your dashboard',
    
    // Navigation
    'home': 'Home',
    'new_order': 'New Order',
    'notifications': 'Notifications',
    'profile': 'Profile',
    'dashboard': 'Dashboard',
    'orders': 'Orders',
    
    // Orders
    'create_order': 'Create Order',
    'order_details': 'Order Details',
    'product': 'Product',
    'quantity': 'Quantity',
    'delivery_date': 'Delivery Date',
    'delivery_type': 'Delivery Type',
    'delivery_location': 'Delivery Location',
    'status': 'Status',
    'submit_order': 'Submit Order',
    'order_submitted': 'Order submitted successfully. Awaiting manager approval.',
    
    // Products
    'sand_0_3': 'Sand 0-3 mm',
    'sesame_4_9_5': 'Sesame 4-9.5 mm',
    'lentil_9_5_19': 'Lentil 9.5-19 mm',
    'polia_19_25': 'Polia 19-25 mm',
    'granite_10_60': 'Granite Stone 10-60 cm',
    
    // Delivery Types
    'self_transport': 'Self Transport',
    'external': 'External (by Piter Noufi)',
    
    // Status
    'pending': 'Pending',
    'approved': 'Approved',
    'rejected': 'Rejected',
    'completed': 'Completed',
    
    // Common
    'tons': 'tons',
    'client_name': 'Client Name',
    'company': 'Company',
    'phone': 'Phone',
    'name': 'Name',
    'logout': 'Logout',
    'filter': 'Filter',
    'sort': 'Sort',
    'all_orders': 'All Orders',
    'my_orders': 'My Orders',
    'no_orders': 'No orders found',
    'loading': 'Loading...',
    'save': 'Save',
    'cancel': 'Cancel',
    'confirm': 'Confirm',
    'delete': 'Delete',
    'edit': 'Edit',
    'view': 'View',
    'update_status': 'Update Status',
    'order_updated': 'Order status updated successfully',
    'notification_sent': 'Notification sent to client',
  },
  he: {
    // Auth
    'login': 'התחברות',
    'email_or_phone': 'אימייל או טלפון',
    'password': 'סיסמה',
    'forgot_password': 'שכחתי סיסמה',
    'welcome_back': 'ברוכים השבים',
    'login_to_continue': 'התחברו כדי להמשיך לדשבורד שלכם',
    
    // Navigation
    'home': 'בית',
    'new_order': 'הזמנה חדשה',
    'notifications': 'התראות',
    'profile': 'פרופיל',
    'dashboard': 'דשבורד',
    'orders': 'הזמנות',
    
    // Orders
    'create_order': 'יצירת הזמנה',
    'order_details': 'פרטי הזמנה',
    'product': 'מוצר',
    'quantity': 'כמות',
    'delivery_date': 'תאריך אספקה',
    'delivery_type': 'סוג אספקה',
    'delivery_location': 'מיקום אספקה',
    'status': 'סטטוס',
    'submit_order': 'שלח הזמנה',
    'order_submitted': 'ההזמנה נשלחה בהצלחה. ממתינה לאישור מנהל.',
    
    // Products
    'sand_0_3': 'חול 0-3 מ"מ',
    'sesame_4_9_5': 'שומשום 4-9.5 מ"מ',
    'lentil_9_5_19': 'עדשים 9.5-19 מ"מ',
    'polia_19_25': 'פוליה 19-25 מ"מ',
    'granite_10_60': 'אבן גרניט 10-60 ס"מ',
    
    // Delivery Types
    'self_transport': 'הובלה עצמית',
    'external': 'חיצוני (על ידי פיטר נופי)',
    
    // Status
    'pending': 'ממתין',
    'approved': 'מאושר',
    'rejected': 'נדחה',
    'completed': 'הושלם',
    
    // Common
    'tons': 'טון',
    'client_name': 'שם לקוח',
    'company': 'חברה',
    'phone': 'טלפון',
    'name': 'שם',
    'logout': 'התנתקות',
    'filter': 'סינון',
    'sort': 'מיון',
    'all_orders': 'כל ההזמנות',
    'my_orders': 'ההזמנות שלי',
    'no_orders': 'לא נמצאו הזמנות',
    'loading': 'טוען...',
    'save': 'שמור',
    'cancel': 'ביטול',
    'confirm': 'אישור',
    'delete': 'מחק',
    'edit': 'ערוך',
    'view': 'צפה',
    'update_status': 'עדכן סטטוס',
    'order_updated': 'סטטוס ההזמנה עודכן בהצלחה',
    'notification_sent': 'התראה נשלחה ללקוח',
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<'en' | 'he'>('en');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as 'en' | 'he';
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.dir = language === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  const isRTL = language === 'he';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};