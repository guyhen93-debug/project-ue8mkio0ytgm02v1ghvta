import { Order, Site, Client } from '@/entities';

export interface OrderValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface CreateOrderData {
  client_id: string;
  site_id: string;
  product_id: string;
  quantity_tons: number;
  delivery_date: string;
  delivery_window: 'morning' | 'afternoon';
  delivery_method: 'self' | 'external';
  notes?: string;
}

export class OrderService {
  static async validateOrder(data: CreateOrderData): Promise<OrderValidationResult> {
    const errors: string[] = [];

    // Validate required fields
    if (!data.site_id) {
      errors.push('site_required');
    }
    if (!data.delivery_window) {
      errors.push('window_required');
    }

    // Get site information for region-based validation
    if (data.site_id) {
      try {
        const site = await Site.get(data.site_id);
        
        // Apply quantity constraints for external delivery
        if (data.delivery_method === 'external') {
          // Must be multiples of 20
          if (data.quantity_tons % 20 !== 0) {
            errors.push('multiples_of_20');
          }
          
          // Minimum 40 tons for sites outside Eilat
          if (site.region_type === 'outside_eilat' && data.quantity_tons < 40) {
            errors.push('min_outside_eilat');
          }
        }
      } catch (error) {
        console.error('Error fetching site for validation:', error);
        errors.push('site_not_found');
      }
    }

    // Validate delivery date is not in the past
    const deliveryDate = new Date(data.delivery_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (deliveryDate < today) {
      errors.push('past_date');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static async generateOrderNumber(): Promise<string> {
    try {
      // Get the latest order to determine next number
      const orders = await Order.list('-created_at', 1);
      
      if (orders.length === 0) {
        return '2001';
      }
      
      const lastOrder = orders[0];
      const lastNumber = parseInt(lastOrder.order_number || '2000');
      return (lastNumber + 1).toString();
    } catch (error) {
      console.error('Error generating order number:', error);
      return '2001';
    }
  }

  static async createOrder(data: CreateOrderData, userEmail: string): Promise<any> {
    // Validate the order
    const validation = await this.validateOrder(data);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Generate order number
    const orderNumber = await this.generateOrderNumber();

    // Create the order
    const orderData = {
      order_number: orderNumber,
      client_id: data.client_id,
      site_id: data.site_id,
      product_id: data.product_id,
      quantity_tons: data.quantity_tons,
      delivery_date: data.delivery_date,
      delivery_window: data.delivery_window,
      delivery_method: data.delivery_method,
      notes: data.notes || '',
      status: 'pending' as const,
      unlinked_site: false,
      created_by: userEmail
    };

    return await Order.create(orderData);
  }

  static async getUserSites(userEmail: string): Promise<any[]> {
    try {
      // For now, we'll get all sites. In a real app, this would be filtered by user's client
      const sites = await Site.filter({ is_active: true }, '-created_at');
      return sites;
    } catch (error) {
      console.error('Error loading user sites:', error);
      return [];
    }
  }

  static async getOrdersWithRelations(userEmail?: string, isAdmin: boolean = false): Promise<any[]> {
    try {
      let orders = [];
      
      if (isAdmin) {
        try {
          orders = await Order.list('-created_at');
        } catch (error) {
          console.error('Error loading all orders:', error);
          orders = [];
        }
      } else if (userEmail) {
        try {
          orders = await Order.filter({ created_by: userEmail }, '-created_at');
        } catch (error) {
          console.error('Error loading user orders:', error);
          orders = [];
        }
      }

      // If no orders found, return empty array
      if (!orders || orders.length === 0) {
        return [];
      }

      // Enrich orders with site and client information
      const enrichedOrders = await Promise.all(
        orders.map(async (order) => {
          try {
            let site = null;
            let client = null;
            let siteName = 'Unknown Site';
            let clientName = 'Unknown Client';
            let regionType = 'unknown';
            let unlinkedSite = order.unlinked_site || false;

            // Try to get site information if site_id exists
            if (order.site_id && !order.unlinked_site) {
              try {
                site = await Site.get(order.site_id);
                if (site) {
                  siteName = site.site_name || 'Unknown Site';
                  regionType = site.region_type || 'unknown';
                  
                  // Try to get client information
                  if (site.client_id) {
                    try {
                      client = await Client.get(site.client_id);
                      if (client) {
                        clientName = client.name || 'Unknown Client';
                      }
                    } catch (clientError) {
                      console.error('Error fetching client:', clientError);
                    }
                  }
                }
              } catch (siteError) {
                console.error('Error fetching site:', siteError);
                unlinkedSite = true;
              }
            }

            // Handle legacy orders that might have site_name directly
            if (!site && order.site_name) {
              siteName = order.site_name;
              unlinkedSite = true;
            }

            return {
              ...order,
              site_name: siteName,
              client_name: clientName,
              region_type: regionType,
              unlinked_site: unlinkedSite,
              // Ensure we have the new field names with fallbacks
              quantity_tons: order.quantity_tons || order.quantity || 0,
              delivery_window: order.delivery_window || order.time_slot || 'morning',
              delivery_method: order.delivery_method || order.delivery_type || 'self'
            };
          } catch (error) {
            console.error('Error enriching order:', error);
            // Return order with safe defaults
            return {
              ...order,
              site_name: order.site_name || 'Unknown Site',
              client_name: 'Unknown Client',
              region_type: 'unknown',
              unlinked_site: true,
              quantity_tons: order.quantity_tons || order.quantity || 0,
              delivery_window: order.delivery_window || order.time_slot || 'morning',
              delivery_method: order.delivery_method || order.delivery_type || 'self'
            };
          }
        })
      );

      return enrichedOrders;
    } catch (error) {
      console.error('Error loading orders with relations:', error);
      return [];
    }
  }

  static formatDeliveryWindow(window: string, language: string): string {
    const windows = {
      he: {
        morning: 'בוקר (07:00–12:00)',
        afternoon: 'צהריים (12:00–17:00)'
      },
      en: {
        morning: 'Morning (07:00–12:00)',
        afternoon: 'Afternoon (12:00–17:00)'
      }
    };

    return windows[language as keyof typeof windows]?.[window as keyof typeof windows.en] || window;
  }
}