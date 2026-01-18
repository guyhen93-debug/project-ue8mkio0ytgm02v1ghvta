/**
 * Shared Zod validation schemas for the application
 * These schemas ensure type safety and validation consistency
 * across frontend and can be shared with backend
 */

import { z } from 'zod';

// ==================== Client Schema ====================
export const ClientSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Client name is required'),
  is_active: z.boolean().default(true),
  category: z.enum(['manager', 'client']).optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const CreateClientSchema = ClientSchema.omit({ id: true, created_at: true, updated_at: true });
export const UpdateClientSchema = CreateClientSchema.partial();

export type Client = z.infer<typeof ClientSchema>;
export type CreateClientData = z.infer<typeof CreateClientSchema>;
export type UpdateClientData = z.infer<typeof UpdateClientSchema>;

// ==================== Site Schema ====================
export const RegionTypeSchema = z.enum(['eilat', 'outside_eilat']);

export const SiteSchema = z.object({
  id: z.string(),
  client_id: z.string(),
  site_name: z.string().min(1, 'Site name is required'),
  region_type: RegionTypeSchema,
  contact_name: z.string().optional().default(''),
  contact_phone: z.string().optional().default(''),
  is_active: z.boolean().default(true),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const CreateSiteSchema = SiteSchema.omit({ id: true, created_at: true, updated_at: true });
export const UpdateSiteSchema = CreateSiteSchema.partial();

export type Site = z.infer<typeof SiteSchema>;
export type RegionType = z.infer<typeof RegionTypeSchema>;
export type CreateSiteData = z.infer<typeof CreateSiteSchema>;
export type UpdateSiteData = z.infer<typeof UpdateSiteSchema>;

// ==================== Product Schema ====================
export const ProductSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Product name is required'),
  display_name_he: z.string().optional(),
  size_label: z.string().optional(),
  description_en: z.string().optional(),
  description_he: z.string().optional(),
  image_url: z.string().optional().default('/favicon.ico'),
  is_active: z.boolean().default(true),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const CreateProductSchema = ProductSchema.omit({ id: true, created_at: true, updated_at: true });
export const UpdateProductSchema = CreateProductSchema.partial();

export type Product = z.infer<typeof ProductSchema>;
export type CreateProductData = z.infer<typeof CreateProductSchema>;
export type UpdateProductData = z.infer<typeof UpdateProductSchema>;

// ==================== Order Schema ====================
export const DeliveryWindowSchema = z.enum(['morning', 'afternoon']);
export const DeliveryMethodSchema = z.enum(['self', 'external']);
export const OrderStatusSchema = z.enum(['pending', 'approved', 'in_transit', 'rejected', 'completed']);

export const OrderSchema = z.object({
  id: z.string(),
  order_number: z.string(),
  client_id: z.string(),
  site_id: z.string().optional(),
  product_id: z.string(),
  quantity_tons: z.number().positive('Quantity must be positive'),
  delivery_date: z.string(),
  delivery_window: DeliveryWindowSchema,
  delivery_method: DeliveryMethodSchema,
  status: OrderStatusSchema.default('pending'),
  notes: z.string().optional().default(''),
  unlinked_site: z.boolean().optional().default(false),
  quarry_or_crossing: z.string().optional(),

  // Delivery tracking
  is_delivered: z.boolean().optional().default(false),
  delivered_at: z.string().optional(),
  delivery_note_number: z.string().optional(),
  driver_name: z.string().optional(),
  actual_delivery_date: z.string().optional(),
  delivered_quantity_tons: z.number().optional(),

  // Client confirmation
  is_client_confirmed: z.boolean().optional().default(false),
  client_confirmed_at: z.string().optional(),

  // Rating
  rating: z.number().min(1).max(5).optional(),
  rating_comment: z.string().optional(),
  rated_at: z.string().optional(),

  // Metadata
  created_by: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const CreateOrderSchema = z.object({
  client_id: z.string().min(1, 'Client is required'),
  site_id: z.string().optional(),
  product_id: z.string().min(1, 'Product is required'),
  quantity_tons: z.number().positive('Quantity must be positive'),
  delivery_date: z.string().min(1, 'Delivery date is required'),
  delivery_window: DeliveryWindowSchema,
  delivery_method: DeliveryMethodSchema,
  notes: z.string().optional(),
});

export const UpdateOrderSchema = OrderSchema.partial().omit({ id: true, order_number: true, created_at: true });

export type Order = z.infer<typeof OrderSchema>;
export type DeliveryWindow = z.infer<typeof DeliveryWindowSchema>;
export type DeliveryMethod = z.infer<typeof DeliveryMethodSchema>;
export type OrderStatus = z.infer<typeof OrderStatusSchema>;
export type CreateOrderData = z.infer<typeof CreateOrderSchema>;
export type UpdateOrderData = z.infer<typeof UpdateOrderSchema>;

// ==================== User Schema ====================
export const UserRoleSchema = z.enum(['client', 'manager']);
export const LanguageSchema = z.enum(['en', 'he']);

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  company: z.string().optional(),
  role: UserRoleSchema.default('client'),
  language: LanguageSchema.default('he'),
  reminders_enabled: z.boolean().optional().default(true),
  reminders_delay_hours: z.number().optional().default(24),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type User = z.infer<typeof UserSchema>;
export type UserRole = z.infer<typeof UserRoleSchema>;
export type Language = z.infer<typeof LanguageSchema>;

// ==================== Notification Schema ====================
export const NotificationTypeSchema = z.enum([
  'new_order',
  'order_status_changed',
  'order_delivered',
  'reminder',
  'system'
]);

export const NotificationSchema = z.object({
  id: z.string(),
  recipient_email: z.string().email(),
  type: NotificationTypeSchema,
  message: z.string(),
  order_id: z.string().optional(),
  is_read: z.boolean().default(false),
  created_at: z.string().optional(),
});

export type Notification = z.infer<typeof NotificationSchema>;
export type NotificationType = z.infer<typeof NotificationTypeSchema>;

// ==================== Message Schema ====================
export const MessageSchema = z.object({
  id: z.string(),
  sender_email: z.string().email(),
  recipient_email: z.string().email(),
  subject: z.string().optional(),
  content: z.string().min(1, 'Message content is required'),
  is_read: z.boolean().default(false),
  thread_id: z.string().optional(),
  order_id: z.string().optional(),
  parent_message_id: z.string().optional(),
  created_at: z.string().optional(),
});

export type Message = z.infer<typeof MessageSchema>;

// ==================== Validation Helpers ====================

/**
 * Validate external delivery requirements
 */
export function validateExternalDelivery(quantity: number, regionType?: RegionType): string[] {
  const errors: string[] = [];

  if (quantity < 20) {
    errors.push('minimum_quantity_external');
  }

  if (quantity % 20 !== 0) {
    errors.push('quantity_multiple_twenty');
  }

  if (regionType === 'outside_eilat' && quantity < 40) {
    errors.push('outside_eilat_min');
  }

  return errors;
}

/**
 * Validate delivery date
 */
export function validateDeliveryDate(
  deliveryDate: string,
  deliveryWindow: DeliveryWindow
): { valid: boolean; error?: string } {
  const now = new Date();
  const orderDate = new Date(deliveryDate);

  // Check if date is in the past
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  orderDate.setHours(0, 0, 0, 0);

  if (orderDate < today) {
    return { valid: false, error: 'past_date' };
  }

  // Check if it's today and time slot is in the past or after hours
  if (orderDate.getTime() === today.getTime()) {
    const currentHour = now.getHours();
    if (currentHour >= 17) {
      return { valid: false, error: 'invalid_time' };
    }
    if (deliveryWindow === 'morning' && currentHour >= 12) {
      return { valid: false, error: 'morning_slot_passed' };
    }
  }

  return { valid: true };
}

/**
 * Parse and validate order data
 */
export function parseCreateOrderData(data: unknown): { success: true; data: CreateOrderData } | { success: false; errors: z.ZodError } {
  const result = CreateOrderSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}
