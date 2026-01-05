import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  he: {
    // Navigation
    dashboard: 'לוח בקרה',
    create_order: 'הזמנה חדשה',
    inbox: 'תיבת דואר',
    notifications: 'התראות',
    profile: 'פרופיל',
    admin_panel: 'פאנל ניהול',
    logout: 'התנתק',
    
    // Dashboard
    welcome: 'שלום',
    client_dashboard_subtitle: 'נהל את ההזמנות שלך ועקוב אחר הסטטוס',
    manager_dashboard_subtitle: 'נהל הזמנות ועקוב אחר פעילות',
    total_orders: 'סה"כ הזמנות',
    all_time: 'מתחילת השימוש',
    awaiting_approval: 'ממתינות לאישור',
    ready_for_delivery: 'מוכנות לאספקה',
    need_revision: 'דורשות תיקון',
    recent_orders: 'הזמנות אחרונות',
    no_orders_yet: 'אין הזמנות עדיין',
    view_all: 'צפה בהכל',
    all_orders: 'כל ההזמנות',
    
    // Order Status
    pending: 'ממתין',
    approved: 'מאושר',
    rejected: 'נדחה',
    completed: 'הושלם',
    
    // Order Form
    create_new_order: 'צור הזמנה חדשה',
    client: 'לקוח',
    select_client: 'בחר לקוח',
    site: 'אתר',
    select_site: 'בחר אתר',
    product: 'מוצר',
    select_product: 'בחר מוצר',
    quantity: 'כמות',
    tons: 'טון',
    delivery_date: 'תאריך אספקה',
    delivery_window: 'חלון אספקה',
    morning: 'בוקר',
    afternoon: 'אחר הצהריים',
    delivery_method: 'שיטת אספקה',
    self: 'עצמי',
    external: 'חיצוני',
    notes: 'הערות',
    submit_order: 'שלח הזמנה',
    cancel: 'ביטול',
    
    // Regions
    eilat: 'אילת',
    outside_eilat: 'מחוץ לאילת',
    
    // Messages
    loading: 'טוען...',
    error: 'שגיאה',
    success: 'הצלחה',
    failed_to_load_orders: 'שגיאה בטעינת ההזמנות',
    order_created: 'הזמנה נוצרה',
    order_created_successfully: 'ההזמנה נוצרה בהצלחה',
    order_updated: 'הזמנה עודכנה',
    order_updated_successfully: 'ההזמנה עודכנה בהצלחה',
    order_deleted: 'הזמנה נמחקה',
    order_deleted_successfully: 'ההזמנה נמחקה בהצלחה',
    
    // Common
    save: 'שמור',
    delete: 'מחק',
    edit: 'ערוך',
    close: 'סגור',
    confirm: 'אשר',
    search: 'חפש',
    filter: 'סנן',
    all: 'הכל',
    new: 'חדש',
    
    // Notifications
    mark_all_read: 'סמן הכל כנקרא',
    no_notifications: 'אין התראות',
    all_caught_up: 'הכל מעודכן',
    notification_deleted: 'התראה נמחקה',
    notification_deleted_successfully: 'ההתראה נמחקה בהצלחה',
    notification_sent: 'התראה נשלחה',
    confirm_delete: 'אשר מחיקה',
    confirm_delete_notification: 'האם אתה בטוח שברצונך למחוק התראה זו?',
    
    // Notification Types
    order_approved: 'הזמנה אושרה',
    order_rejected: 'הזמנה נדחתה',
    order_completed: 'הזמנה הושלמה',
    
    // Time
    just_now: 'עכשיו',
    hours_ago: ' שעות',
    
    // Errors
    try_again: 'נסה שוב',
    refresh: 'רענן',
    update_failed: 'העדכון נכשל',
    delete_failed: 'המחיקה נכשלה',
    error_loading_data: 'שגיאה בטעינת הנתונים',
    no_orders_found: 'לא נמצאו הזמנות',
    no_orders_match_filter: 'אין הזמנות התואמות את הסינון',
    create_first_order: 'צור הזמנה ראשונה',
    
    // Search & Filter
    search_orders: 'חפש הזמנות',
    filter_by_status: 'סנן לפי סטטוס',
    filter_by_region: 'סנן לפי אזור',
    
    // Order Details
    order_number: 'הזמנה מספר ',
    customer: 'לקוח',
    created_at: 'נוצר ב',
    
    // Profile & Settings
    field_mode: 'מצב שטח',
    field_mode_description: 'פונטים גדולים יותר ותצוגה ברורה יותר לשימוש בשטח',
    display_settings: 'הגדרות תצוגה',
  },
  en: {
    // Navigation
    dashboard: 'Dashboard',
    create_order: 'New Order',
    inbox: 'Inbox',
    notifications: 'Notifications',
    profile: 'Profile',
    admin_panel: 'Admin Panel',
    logout: 'Logout',
    
    // Dashboard
    welcome: 'Welcome',
    client_dashboard_subtitle: 'Manage your orders and track their status',
    manager_dashboard_subtitle: 'Manage orders and track activity',
    total_orders: 'Total Orders',
    all_time: 'All Time',
    awaiting_approval: 'Awaiting Approval',
    ready_for_delivery: 'Ready for Delivery',
    need_revision: 'Need Revision',
    recent_orders: 'Recent Orders',
    no_orders_yet: 'No orders yet',
    view_all: 'View All',
    all_orders: 'All Orders',
    
    // Order Status
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    completed: 'Completed',
    
    // Order Form
    create_new_order: 'Create New Order',
    client: 'Client',
    select_client: 'Select Client',
    site: 'Site',
    select_site: 'Select Site',
    product: 'Product',
    select_product: 'Select Product',
    quantity: 'Quantity',
    tons: 'tons',
    delivery_date: 'Delivery Date',
    delivery_window: 'Delivery Window',
    morning: 'Morning',
    afternoon: 'Afternoon',
    delivery_method: 'Delivery Method',
    self: 'Self',
    external: 'External',
    notes: 'Notes',
    submit_order: 'Submit Order',
    cancel: 'Cancel',
    
    // Regions
    eilat: 'Eilat',
    outside_eilat: 'Outside Eilat',
    
    // Messages
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    failed_to_load_orders: 'Failed to load orders',
    order_created: 'Order Created',
    order_created_successfully: 'Order created successfully',
    order_updated: 'Order Updated',
    order_updated_successfully: 'Order updated successfully',
    order_deleted: 'Order Deleted',
    order_deleted_successfully: 'Order deleted successfully',
    
    // Common
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
    confirm: 'Confirm',
    search: 'Search',
    filter: 'Filter',
    all: 'All',
    new: 'New',
    
    // Notifications
    mark_all_read: 'Mark All Read',
    no_notifications: 'No Notifications',
    all_caught_up: 'All Caught Up',
    notification_deleted: 'Notification Deleted',
    notification_deleted_successfully: 'Notification deleted successfully',
    notification_sent: 'Notification Sent',
    confirm_delete: 'Confirm Delete',
    confirm_delete_notification: 'Are you sure you want to delete this notification?',
    
    // Notification Types
    order_approved: 'Order Approved',
    order_rejected: 'Order Rejected',
    order_completed: 'Order Completed',
    
    // Time
    just_now: 'Just now',
    hours_ago: ' hours ago',
    
    // Errors
    try_again: 'Try Again',
    refresh: 'Refresh',
    update_failed: 'Update failed',
    delete_failed: 'Delete failed',
    error_loading_data: 'Error loading data',
    no_orders_found: 'No orders found',
    no_orders_match_filter: 'No orders match the filter',
    create_first_order: 'Create First Order',
    
    // Search & Filter
    search_orders: 'Search Orders',
    filter_by_status: 'Filter by Status',
    filter_by_region: 'Filter by Region',
    
    // Order Details
    order_number: 'Order #',
    customer: 'Customer',
    created_at: 'Created at',
    
    // Profile & Settings
    field_mode: 'Field Mode',
    field_mode_description: 'Larger text and clearer view for on-site use',
    display_settings: 'Display Settings',
  },
};

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<string>('he');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'he';
    setLanguageState(savedLanguage);
    document.documentElement.dir = savedLanguage === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = savedLanguage;
  }, []);

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };

  const t = (key: string): string => {
    return (translations[language as keyof typeof translations] || translations.he)?.[key as keyof (typeof translations)['he']] || key;
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
    // Graceful fallback: default to Hebrew without crashing the app
    const fallbackLang = 'he';
    return {
      language: fallbackLang,
      setLanguage: () => {
        // no-op in fallback; real updates require provider
        console.warn('useLanguage called outside LanguageProvider. Using fallback language only.');
      },
      t: (key: string) => (translations[fallbackLang] as any)?.[key] || key,
      isRTL: true,
    };
  }
  return context;
};
