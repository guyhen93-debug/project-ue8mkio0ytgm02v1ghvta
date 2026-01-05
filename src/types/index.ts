export interface Order {
  id: string;
  order_number: string;
  client_id: string;
  site_id: string;
  product_id: string;
  quantity_tons: number;
  delivery_date: string;
  delivery_window: 'morning' | 'afternoon' | string;
  delivery_method: 'self' | 'external' | string;
  supplier: 'shifuli_har' | 'maavar_rabin' | string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'in_transit' | string;
  notes?: string;
  created_at: string;
  created_by: string;
  is_delivered?: boolean;
  actual_delivery_date?: string;
  delivery_note_number?: string;
  driver_name?: string;
  delivered_quantity_tons?: number;
  truck_access_space?: boolean;
  is_client_confirmed?: boolean;
  client_confirmed_at?: string;
  rating?: number;
  rating_comment?: string;
  updated_at?: string;
  delivered_at?: string;
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  name?: string;        // some places use name from entity
  company?: string;
  role: 'client' | 'manager' | string;
  reminders_enabled?: boolean;
  reminders_delay_hours?: number;
}

export interface Client {
  id: string;
  name: string;
  created_by: string;
  is_active: boolean;
}

export interface Site {
  id: string;
  client_id: string;
  site_name: string;
  region_type: 'eilat' | 'outside_eilat' | string;
  contact_name?: string;
  contact_phone?: string;
  is_active: boolean;
}

export interface Product {
  id: string;
  product_id: string;
  name_he: string;
  name_en: string;
  size: string;
  supplier: 'shifuli_har' | 'maavar_rabin' | string;
  image_url?: string;
  is_active: boolean;
}

export interface Notification {
  id: string;
  recipient_email: string;
  type: string;
  message: string;
  is_read: boolean;
  order_id?: string;
  created_at: string;
}
