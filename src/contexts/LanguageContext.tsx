import React, { createContext, useContext, useState, useEffect } from 'react';

interface LanguageContextType {
  language: 'en' | 'he';
  setLanguage: (lang: 'en' | 'he') => void;
  t: (key: string, params?: Record<string, any>) => string;
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
    'enter_email': 'Enter your email',
    'enter_password': 'Enter your password',
    'enter_credentials': 'Enter your credentials to access your dashboard',
    'demo_credentials': 'Demo Credentials',
    'login_failed': 'Login Failed',
    'invalid_credentials': 'Invalid email or password. Please try again.',
    'login_error': 'An error occurred during login. Please try again.',
    'client': 'Client',
    'manager': 'Manager',
    
    // Navigation
    'home': 'Home',
    'new_order': 'New Order',
    'notifications': 'Notifications',
    'profile': 'Profile',
    'dashboard': 'Dashboard',
    'orders': 'Orders',
    'inbox': 'Inbox',
    'admin': 'Admin',
    
    // Orders
    'create_order': 'Create Order',
    'create_new_order': 'Create New Order',
    'order_details': 'Order Details',
    'product': 'Product',
    'quantity': 'Quantity',
    'delivery_date': 'Delivery Date',
    'delivery_type': 'Delivery Type',
    'delivery_location': 'Delivery Location',
    'status': 'Status',
    'submit_order': 'Submit Order',
    'order_submitted': 'Order Submitted',
    'order_submitted_description': 'Order submitted successfully. Awaiting manager approval.',
    'select_product': 'Select a product',
    'enter_quantity': 'Enter quantity in tons',
    'time': 'Time',
    'enter_address': 'Enter the complete delivery address',
    'additional_notes': 'Additional Notes',
    'special_instructions': 'Any special instructions or notes',
    'start_creating_order': 'Start by creating your first order',
    'minimum_quantity_external': 'External delivery requires minimum 20 tons.',
    'quantity_multiple_twenty': 'External delivery quantity must be in multiples of 20 tons.',
    'distance_minimum_40': 'For deliveries at or beyond ~43 km from the quarry, minimum order is 40 tons.',
    'morning_shift': 'Morning (07:00–12:00)',
    'afternoon_shift': 'Afternoon (12:00–17:00)',
    'truck_access': 'Full trailer truck access available',
    'share_location': 'Share Location',
    'has_notes': 'Has notes...',
    'notes': 'Notes',
    'order_number': 'Order #',
    'no_trailer_access_note': 'No full trailer access - double only',
    'quarry_crossing': 'Quarry/Crossing',
    'select_quarry': 'Select quarry or crossing',
    'default_quarry': 'Default',
    'shifolei_har': 'Shifolei Har',
    'yitzhak_rabin': 'Yitzhak Rabin Crossing',
    
    // Products
    'p_new_sand_0_4': 'Sand (0-4 mm)',
    'sesame_4_9_5': 'Sesame (4-9.5 mm)',
    'lentil_9_5_19': 'Lentil (9.5-19 mm)',
    'polia_19_25': 'Polia (19-25 mm)',
    'granite_10_60': 'Granite Stone (10-60 cm)',
    'product_preview': 'Product Preview',
    'product_description': 'Description',
    
    // Delivery Types
    'self_transport': 'Self Transport',
    'external': 'External (by Piter Noufi)',
    
    // Status
    'pending': 'Pending',
    'approved': 'Approved',
    'rejected': 'Rejected',
    'completed': 'Completed',
    'awaiting_approval': 'Awaiting Approval',
    'delivered': 'Delivered',
    'all': 'All',
    
    // Filter options
    'all_orders': 'All Orders',
    'all_status': 'All Status',
    'filter_by_status': 'Filter by Status',
    
    // Time display
    'morning': 'Morning',
    'afternoon': 'Afternoon',
    
    // Site names
    'site_name': 'Site Name',
    
    // Validation & Errors
    'validation_error': 'Validation Error',
    'error': 'Error',
    'past_date_error': 'Cannot schedule delivery for a past date.',
    'morning_slot_passed': 'Morning time slot has already passed for today.',
    'after_hours_error': 'Selected time slot is outside operating hours (07:00-17:00).',
    'external_multiple_20': 'External deliveries must be in multiples of 20 tons and at least 20.',
    'past_date': 'Cannot schedule a past date.',
    'after_hours': 'Selected slot outside operating hours (07:00-17:00).',
    'order_submission_failed': 'Failed to submit order. Please try again.',
    'order_update_failed': 'Failed to update order status.',
    'unknown_error': 'An unknown error occurred.',
    
    // Admin functions
    'reduce_quantity': 'Reduce Quantity',
    'reduce_by_tons': 'Reduce by (tons)',
    'reduction_reason': 'Reason for reduction',
    'confirm_reduction': 'Confirm Reduction',
    'quantity_reduced': 'Quantity Reduced',
    'quantity_reduction_success': 'Order quantity reduced successfully.',
    'invalid_reduction_amount': 'Invalid reduction amount.',
    'order_not_found': 'Order not found.',
    
    // Messages/Inbox
    'send_message': 'Send Message',
    'type_message': 'Type your message...',
    'no_messages': 'No messages',
    'mark_as_read': 'Mark as read',
    'reply': 'Reply',
    'message_sent': 'Message sent successfully',
    'unread_messages': 'unread messages',
    'select_order': 'Select Order',
    
    // Common
    'tons': 'tons',
    'client_name': 'Client Name',
    'company': 'Company',
    'phone': 'Phone',
    'name': 'Name',
    'email': 'Email',
    'role': 'Role',
    'logout': 'Logout',
    'filter': 'Filter',
    'sort': 'Sort',
    'my_orders': 'My Orders',
    'no_orders': 'No orders found',
    'no_orders_filter': 'No orders match the current filter',
    'loading': 'Loading...',
    'save': 'Save',
    'cancel': 'Cancel',
    'confirm': 'Confirm',
    'delete': 'Delete',
    'edit': 'Edit',
    'view': 'View',
    'ok': 'OK',
    'close': 'Close',
    'update_status': 'Update Status',
    'order_updated': 'Order Updated',
    'notification_sent': 'Notification sent to client',
    'total_orders': 'Total Orders',
    'created': 'Created',
    'customer': 'Customer',
    'settings': 'Settings',
    'language': 'Language',
    'switch_to': 'Switch to',
    'about_company': 'About Piter Noufi Ltd.',
    'company_description': 'Leading quarry company providing high-quality construction materials for projects across the region. Specializing in sand, gravel, and stone products with reliable delivery services.',
    'website': 'Website',
    'industry': 'Industry',
    'construction_materials': 'Construction Materials',
    'profile_information': 'Profile Information',
    'profile_updated': 'Profile updated successfully',
    'no_notifications': 'No notifications',
    'all_caught_up': 'You\'re all caught up! New notifications will appear here.',
    'mark_all_read': 'Mark all read',
    'just_now': 'Just now',
    'hours_ago': 'h ago',
    'new': 'new',
    'distance': 'Distance',
    'km': 'km',
    
    // Site-related translations
    'sites': 'Sites',
    'region_type': 'Region Type',
    'contact_name': 'Contact Name',
    'contact_phone': 'Contact Phone',
    'select_site': 'Select a site',
    'select_client': 'Select a client',
    'eilat': 'Eilat',
    'outside_eilat': 'Outside Eilat',
    'admin_panel': 'Admin Panel',

    // Client management translations
    'clients_management': 'Client Management',
    'add_client': 'Add Client',
    'edit_client': 'Edit Client',
    'client_category': 'Client Category',
    'is_active': 'Is Active',
    'active': 'Active',
    'inactive': 'Inactive',
    'client_created': 'Client Created',
    'client_created_successfully': 'Client created successfully',
    'client_updated': 'Client Updated',
    'client_updated_successfully': 'Client updated successfully',
    'client_deleted': 'Client Deleted',
    'client_deleted_successfully': 'Client deleted successfully',
    'confirm_delete_client': 'Are you sure you want to delete this client?',

    // Site management translations
    'sites_management': 'Site Management',
    'add_site': 'Add Site',
    'edit_site': 'Edit Site',
    'site_created': 'Site Created',
    'site_created_successfully': 'Site created successfully',
    'site_updated': 'Site Updated',
    'site_updated_successfully': 'Site updated successfully',
    'site_deleted': 'Site Deleted',
    'site_deleted_successfully': 'Site deleted successfully',
    'confirm_delete_site': 'Are you sure you want to delete this site?',

    // Admin panel translations
    'manage_all_system_data': 'Manage all system data and configurations',
    'access_denied': 'Access Denied',
    'manager_only_access': 'This area is restricted to managers only',
    'search_orders': 'Search orders...',
    'all_statuses': 'All Statuses',
    'no_orders_found': 'No orders found',
    'no_orders_yet': 'No orders yet',

    // Error messages
    'outside_eilat_min': 'For sites outside Eilat, a minimum of 40 tons is required for external delivery.',
    'unlinked_site': 'This site is not linked to an active client.',
    'invalid_time': 'Orders allowed only between 07:00–17:00.',
    
    // Dynamic notifications
    'order_approved': 'Order Approved',
    'order_rejected': 'Order Rejected',
    'order_completed': 'Order Completed',
    'order_status_notification': 'Your order #{orderNumber} has been {status}',

    // Product management
    'product_management': 'Product Management',
    'add_product': 'Add Product',
    'edit_product': 'Edit Product',
    'product_name_en': 'Product Name (English)',
    'product_name_he': 'Product Name (Hebrew)',
    'size_label': 'Size Label',
    'description_en': 'Description (English)',
    'description_he': 'Description (Hebrew)',
    'image_url': 'Image URL',
    'product_created': 'Product Created',
    'product_created_successfully': 'Product created successfully',
    'product_updated': 'Product Updated',
    'product_updated_successfully': 'Product updated successfully',
    'product_deleted': 'Product Deleted',
    'product_deleted_successfully': 'Product deleted successfully',
    'confirm_delete_product': 'Are you sure you want to delete this product?',
    
    // Order management
    'edit_order': 'Edit Order',
    'order_updated_successfully': 'Order updated successfully',
    'order_deleted': 'Order Deleted',
    'order_deleted_successfully': 'Order deleted successfully',
    'confirm_delete_order': 'Are you sure you want to delete this order?',
    'save_changes': 'Save Changes',
    
    // Messaging
    'send_reply': 'Send Reply',
    'type_reply': 'Type your reply...',
    'reply_sent': 'Reply Sent',
    'reply_sent_successfully': 'Reply sent successfully',
    'reply_failed': 'Failed to send reply',
    'message_deleted': 'Message Deleted',
    'message_deleted_successfully': 'Message deleted successfully',
    'confirm_delete_message': 'Are you sure you want to delete this message?',
    'general_message': 'General Message',
    'you': 'You',
    'from': 'From',
    'recipient': 'Recipient',
    'subject': 'Subject',
    'message': 'Message',
    'optional': 'Optional',
    'select_message': 'Select a message to view',
    
    // Notifications
    'notification_deleted': 'Notification Deleted',
    'notification_deleted_successfully': 'Notification deleted successfully',
    'confirm_delete_notification': 'Are you sure you want to delete this notification?',
    
    // General
    'confirm_delete': 'Confirm Delete',
    'save_failed': 'Failed to save',
    'delete_failed': 'Failed to delete',
    'update_failed': 'Failed to update',
  },
  he: {
    // Auth
    'login': 'התחברות',
    'email_or_phone': 'אימייל או טלפון',
    'password': 'סיסמה',
    'forgot_password': 'שכחתי סיסמה',
    'welcome_back': 'ברוכים השבים',
    'login_to_continue': 'התחברו כדי להמשיך לדשבורד שלכם',
    'enter_email': 'הזינו את האימייל שלכם',
    'enter_password': 'הזינו את הסיסמה שלכם',
    'enter_credentials': 'הזינו את פרטי ההתחברות שלכם כדי לגשת לדשבורד',
    'demo_credentials': 'פרטי התחברות לדוגמה',
    'login_failed': 'התחברות נכשלה',
    'invalid_credentials': 'אימייל או סיסמה שגויים. אנא נסו שוב.',
    'login_error': 'אירעה שגיאה במהלך ההתחברות. אנא נסו שוב.',
    'client': 'לקוח',
    'manager': 'מנהל',
    
    // Navigation
    'home': 'בית',
    'new_order': 'הזמנה חדשה',
    'notifications': 'התראות',
    'profile': 'פרופיל',
    'dashboard': 'דשבורד',
    'orders': 'הזמנות',
    'inbox': 'תיבת דואר',
    'admin': 'ניהול',
    
    // Orders
    'create_order': 'יצירת הזמנה',
    'create_new_order': 'יצירת הזמנה חדשה',
    'order_details': 'פרטי הזמנה',
    'product': 'מוצר',
    'quantity': 'כמות (טון)',
    'delivery_date': 'תאריך אספקה',
    'delivery_type': 'סוג אספקה',
    'delivery_location': 'מיקום אספקה',
    'status': 'סטטוס',
    'submit_order': 'שלח הזמנה',
    'order_submitted': 'הזמנה נשלחה',
    'order_submitted_description': 'ההזמנה נשלחה בהצלחה. ממתינה לאישור מנהל.',
    'select_product': 'בחר מוצר',
    'enter_quantity': 'הזן כמות בטון',
    'time': 'זמן',
    'enter_address': 'הזן כתובת אספקה מלאה',
    'additional_notes': 'הערות נוספות',
    'special_instructions': 'הנחיות מיוחדות או הערות',
    'start_creating_order': 'התחל ביצירת ההזמנה הראשונה שלך',
    'minimum_quantity_external': 'הזמנה בהובלה חיצונית מחייבת מינימום של 20 טון.',
    'quantity_multiple_twenty': 'כמות בהובלה חיצונית חייבת להיות בכפולות של 20 טון.',
    'distance_minimum_40': 'לאספקות החל מ-43 ק"מ ומעלה מהמחצבה, המינימום להזמנה הוא 40 טון.',
    'morning_shift': 'בוקר (07:00–12:00)',
    'afternoon_shift': 'צהריים (12:00–17:00)',
    'truck_access': 'יש מקום לפריקת פול טריילר (עגלה)',
    'share_location': 'שתף מיקום',
    'has_notes': 'יש הערות...',
    'notes': 'הערות',
    'order_number': 'הזמנה מס\' ',
    'no_trailer_access_note': 'אין מקום לפול טריילר - דאבל בלבד',
    'quarry_crossing': 'מחצבה/מעבר',
    'select_quarry': 'בחר מחצבה או מעבר',
    'default_quarry': 'ברירת מחדל',
    'shifolei_har': 'שיפולי הר',
    'yitzhak_rabin': 'מעבר יצחק רבין',
    
    // Products
    'p_new_sand_0_4': 'חול מחצבה (0-4) מ"מ',
    'sesame_4_9_5': 'שומשום (4-9.5) מ"מ',
    'lentil_9_5_19': 'עדש (9.5–19) מ"מ',
    'polia_19_25': 'פוליה (19-25) מ"מ',
    'granite_10_60': 'אבן גרניט (10-60) ס"מ',
    'product_preview': 'תצוגה מקדימה של המוצר',
    'product_description': 'תיאור',
    
    // Delivery Types
    'self_transport': 'הובלה עצמית',
    'external': 'חיצונית (על ידי פיטר נופי)',
    
    // Status
    'pending': 'ממתין לאישור',
    'approved': 'מאושר',
    'rejected': 'נדחה',
    'completed': 'הושלם',
    'awaiting_approval': 'ממתין לאישור',
    'delivered': 'סופקה',
    'all': 'הכל',
    
    // Filter options
    'all_orders': 'כל ההזמנות',
    'all_status': 'כל הסטטוסים',
    'filter_by_status': 'סינון לפי סטטוס',
    
    // Time display
    'morning': 'בוקר',
    'afternoon': 'צהריים',
    
    // Site names
    'site_name': 'שם האתר',
    
    // Validation & Errors
    'validation_error': 'שגיאת אימות',
    'error': 'שגיאה',
    'past_date_error': 'לא ניתן לתזמן אספקה לתאריך שעבר.',
    'morning_slot_passed': 'משמרת הבוקר כבר עברה להיום.',
    'after_hours_error': 'המשמרת הנבחרת מחוץ לשעות הפעילות (07:00-17:00).',
    'external_multiple_20': 'הובלה חיצונית ניתנת להזמנה בכפולות של 20 טון בלבד (מינימום 20).',
    'past_date': 'לא ניתן לקבוע תאריך בעבר.',
    'after_hours': 'הבחירה מחוץ לשעות הפעילות (07:00-17:00).',
    'order_submission_failed': 'נכשל בשליחת ההזמנה. אנא נסו שוב.',
    'order_update_failed': 'נכשל בעדכון סטטוס ההזמנה.',
    'unknown_error': 'אירעה שגיאה לא ידועה.',
    
    // Admin functions
    'reduce_quantity': 'הפחת כמות',
    'reduce_by_tons': 'הפחת ב (טון)',
    'reduction_reason': 'סיבת ההפחתה',
    'confirm_reduction': 'אשר הפחתה',
    'quantity_reduced': 'כמות הופחתה',
    'quantity_reduction_success': 'כמות ההזמנה הופחתה בהצלחה.',
    'invalid_reduction_amount': 'כמות הפחתה לא תקינה.',
    'order_not_found': 'הזמנה לא נמצאה.',
    
    // Messages/Inbox
    'send_message': 'שלח הודעה',
    'type_message': 'הקלד את ההודעה שלך...',
    'no_messages': 'אין הודעות',
    'mark_as_read': 'סמן כנקרא',
    'reply': 'השב',
    'message_sent': 'הודעה נשלחה בהצלחה',
    'unread_messages': 'הודעות לא נקראו',
    'select_order': 'בחר הזמנה',
    
    // Common
    'tons': 'טון',
    'client_name': 'שם הלקוח',
    'company': 'חברה',
    'phone': 'טלפון',
    'name': 'שם',
    'email': 'אימייל',
    'role': 'תפקיד',
    'logout': 'התנתקות',
    'filter': 'סינון',
    'sort': 'מיון',
    'my_orders': 'ההזמנות שלי',
    'no_orders': 'לא נמצאו הזמנות',
    'no_orders_filter': 'אין הזמנות התואמות לסינון הנוכחי',
    'loading': 'טוען...',
    'save': 'שמור',
    'cancel': 'ביטול',
    'confirm': 'אישור',
    'delete': 'מחק',
    'edit': 'ערוך',
    'view': 'צפה',
    'ok': 'אישור',
    'close': 'סגור',
    'update_status': 'עדכן סטטוס',
    'order_updated': 'הזמנה עודכנה',
    'notification_sent': 'התראה נשלחה ללקוח',
    'total_orders': 'סה"כ הזמנות',
    'created': 'נוצר',
    'customer': 'לקוח',
    'settings': 'הגדרות',
    'language': 'שפה',
    'switch_to': 'עבור ל',
    'about_company': 'אודות פיטר נופי בע"מ',
    'company_description': 'חברת מחצבות מובילה המספקת חומרי בנייה איכותיים לפרויקטים ברחבי האזור. מתמחים במוצרי חול, חצץ ואבן עם שירותי משלוח אמינים.',
    'website': 'אתר אינטרנט',
    'industry': 'תעשייה',
    'construction_materials': 'חומרי בנייה',
    'profile_information': 'מידע פרופיל',
    'profile_updated': 'הפרופיל עודכן בהצלחה',
    'no_notifications': 'אין התראות',
    'all_caught_up': 'הכל מעודכן! התראות חדשות יופיעו כאן.',
    'mark_all_read': 'סמן הכל כנקרא',
    'just_now': 'עכשיו',
    'hours_ago': 'שעות',
    'new': 'חדש',
    'distance': 'מרחק',
    'km': 'ק"מ',
    
    // Site-related translations
    'sites': 'אתרים',
    'region_type': 'סוג אזור',
    'contact_name': 'שם איש קשר',
    'contact_phone': 'טלפון איש קשר',
    'select_site': 'בחר אתר',
    'select_client': 'בחר לקוח',
    'eilat': 'אילת',
    'outside_eilat': 'מחוץ לאילת',
    'admin_panel': 'פאנל ניהול',

    // Client management translations
    'clients_management': 'ניהול לקוחות',
    'add_client': 'הוסף לקוח',
    'edit_client': 'ערוך לקוח',
    'client_category': 'קטגוריית לקוח',
    'is_active': 'פעיל',
    'active': 'פעיל',
    'inactive': 'לא פעיל',
    'client_created': 'לקוח נוצר',
    'client_created_successfully': 'הלקוח נוצר בהצלחה',
    'client_updated': 'לקוח עודכן',
    'client_updated_successfully': 'הלקוח עודכן בהצלחה',
    'client_deleted': 'לקוח נמחק',
    'client_deleted_successfully': 'הלקוח נמחק בהצלחה',
    'confirm_delete_client': 'האם אתה בטוח שברצונך למחוק את הלקוח הזה?',

    // Site management translations
    'sites_management': 'ניהול אתרים',
    'add_site': 'הוסף אתר',
    'edit_site': 'ערוך אתר',
    'site_created': 'אתר נוצר',
    'site_created_successfully': 'האתר נוצר בהצלחה',
    'site_updated': 'אתר עודכן',
    'site_updated_successfully': 'האתר עודכן בהצלחה',
    'site_deleted': 'אתר נמחק',
    'site_deleted_successfully': 'האתר נמחק בהצלחה',
    'confirm_delete_site': 'האם אתה בטוח שברצונך למחוק את האתר הזה?',

    // Admin panel translations
    'manage_all_system_data': 'נהל את כל נתוני המערכת והתצורות',
    'access_denied': 'גישה נדחתה',
    'manager_only_access': 'אזור זה מוגבל למנהלים בלבד',
    'search_orders': 'חפש הזמנות...',
    'all_statuses': 'כל הסטטוסים',
    'no_orders_found': 'לא נמצאו הזמנות',
    'no_orders_yet': 'אין הזמנות עדיין',

    // Error messages
    'outside_eilat_min': 'לאתרים שמחוץ לאילת נדרש מינימום של 40 טון בהובלה חיצונית.',
    'unlinked_site': 'אתר זה אינו משויך ללקוח פעיל.',
    'invalid_time': 'ניתן להזמין רק בין השעות 07:00–17:00.',

    // Dynamic notifications
    'order_approved': 'הזמנה אושרה',
    'order_rejected': 'הזמנה נדחתה',
    'order_completed': 'הזמנה הושלמה',
    'order_status_notification': 'הזמנה מס\' {orderNumber} {status}',

    // Product management
    'product_management': 'ניהול מוצרים',
    'add_product': 'הוסף מוצר',
    'edit_product': 'ערוך מוצר',
    'product_name_en': 'שם המוצר (אנגלית)',
    'product_name_he': 'שם המוצר (עברית)',
    'size_label': 'תווית גודל',
    'description_en': 'תיאור (אנגלית)',
    'description_he': 'תיאור (עברית)',
    'image_url': 'כתובת תמונה',
    'product_created': 'מוצר נוצר',
    'product_created_successfully': 'המוצר נוצר בהצלחה',
    'product_updated': 'מוצר עודכן',
    'product_updated_successfully': 'המוצר עודכן בהצלחה',
    'product_deleted': 'מוצר נמחק',
    'product_deleted_successfully': 'המוצר נמחק בהצלחה',
    'confirm_delete_product': 'האם אתה בטוח שברצונך למחוק את המוצר הזה?',
    
    // Order management
    'edit_order': 'ערוך הזמנה',
    'order_updated_successfully': 'ההזמנה עודכנה בהצלחה',
    'order_deleted': 'הזמנה נמחקה',
    'order_deleted_successfully': 'ההזמנה נמחקה בהצלחה',
    'confirm_delete_order': 'האם אתה בטוח שברצונך למחוק את ההזמנה הזו?',
    'save_changes': 'שמור שינויים',
    
    // Messaging
    'send_reply': 'שלח תגובה',
    'type_reply': 'כתוב את התגובה שלך...',
    'reply_sent': 'תגובה נשלחה',
    'reply_sent_successfully': 'התגובה נשלחה בהצלחה',
    'reply_failed': 'שליחת התגובה נכשלה',
    'message_deleted': 'הודעה נמחקה',
    'message_deleted_successfully': 'ההודעה נמחקה בהצלחה',
    'confirm_delete_message': 'האם אתה בטוח שברצונך למחוק את ההודעה הזו?',
    'general_message': 'הודעה כללית',
    'you': 'אתה',
    'from': 'מאת',
    'recipient': 'נמען',
    'subject': 'נושא',
    'message': 'הודעה',
    'optional': 'אופציונלי',
    'select_message': 'בחר הודעה לצפייה',
    
    // Notifications
    'notification_deleted': 'התראה נמחקה',
    'notification_deleted_successfully': 'ההתראה נמחקה בהצלחה',
    'confirm_delete_notification': 'האם אתה בטוח שברצונך למחוק את ההתראה הזו?',
    
    // General
    'confirm_delete': 'אשר מחיקה',
    'save_failed': 'השמירה נכשלה',
    'delete_failed': 'המחיקה נכשלה',
    'update_failed': 'העדכון נכשל',
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<'en' | 'he'>('he'); // Default to Hebrew

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

  const t = (key: string, params?: Record<string, any>): string => {
    let translation = translations[language][key] || key;
    
    // Handle parameter substitution
    if (params) {
      Object.keys(params).forEach(param => {
        translation = translation.replace(`{${param}}`, params[param]);
      });
    }
    
    return translation;
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