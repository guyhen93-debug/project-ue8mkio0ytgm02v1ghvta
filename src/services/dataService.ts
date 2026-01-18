import { Order, Site, Client } from '@/entities';

export interface DataServiceResult<T> {
  success: boolean;
  data: T;
  error?: string;
}

export class DataService {
  private static retryCount = 3;
  private static retryDelay = 1000;

  static async withRetry<T>(
    operation: () => Promise<T>,
    retries: number = this.retryCount
  ): Promise<DataServiceResult<T>> {
    for (let i = 0; i <= retries; i++) {
      try {
        const data = await operation();
        return { success: true, data };
      } catch (error) {
        console.error(`Attempt ${i + 1} failed:`, error);
        
        if (i === retries) {
          return {
            success: false,
            data: null as T,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * (i + 1)));
      }
    }
    
    return {
      success: false,
      data: null as T,
      error: 'Max retries exceeded'
    };
  }

  static async loadOrders(userEmail?: string, isAdmin: boolean = false): Promise<DataServiceResult<any[]>> {
    return this.withRetry(async () => {
      if (isAdmin) {
        return await Order.list('-created_at');
      } else if (userEmail) {
        return await Order.filter({ created_by: userEmail }, '-created_at');
      }
      return [];
    });
  }

  static async loadClients(): Promise<DataServiceResult<any[]>> {
    return this.withRetry(async () => {
      return await Client.list('-created_at');
    });
  }

  static async loadSites(): Promise<DataServiceResult<any[]>> {
    return this.withRetry(async () => {
      return await Site.list('-created_at');
    });
  }

  static async loadActiveSites(): Promise<DataServiceResult<any[]>> {
    return this.withRetry(async () => {
      return await Site.filter({ is_active: true }, '-created_at');
    });
  }

  static async getSite(siteId: string): Promise<DataServiceResult<any>> {
    return this.withRetry(async () => {
      return await Site.get(siteId);
    });
  }

  static async getClient(clientId: string): Promise<DataServiceResult<any>> {
    return this.withRetry(async () => {
      return await Client.get(clientId);
    });
  }

  static async createOrder(orderData: any): Promise<DataServiceResult<any>> {
    return this.withRetry(async () => {
      return await Order.create(orderData);
    });
  }

  static async updateOrder(orderId: string, updateData: any): Promise<DataServiceResult<any>> {
    return this.withRetry(async () => {
      return await Order.update(orderId, updateData);
    });
  }

  static async deleteOrder(orderId: string): Promise<DataServiceResult<boolean>> {
    return this.withRetry(async () => {
      await Order.delete(orderId);
      return true;
    });
  }

  static async createClient(clientData: any): Promise<DataServiceResult<any>> {
    return this.withRetry(async () => {
      return await Client.create(clientData);
    });
  }

  static async updateClient(clientId: string, updateData: any): Promise<DataServiceResult<any>> {
    return this.withRetry(async () => {
      return await Client.update(clientId, updateData);
    });
  }

  static async createSite(siteData: any): Promise<DataServiceResult<any>> {
    return this.withRetry(async () => {
      return await Site.create(siteData);
    });
  }

  static async updateSite(siteId: string, updateData: any): Promise<DataServiceResult<any>> {
    return this.withRetry(async () => {
      return await Site.update(siteId, updateData);
    });
  }

  // Enhanced method to get orders with relations that handles failures gracefully
  // Now returns DataServiceResult for proper error handling
  static async getOrdersWithRelations(userEmail?: string, isAdmin: boolean = false): Promise<DataServiceResult<any[]>> {
    try {
      // Load orders
      const ordersResult = await this.loadOrders(userEmail, isAdmin);
      if (!ordersResult.success) {
        return {
          success: false,
          data: [],
          error: ordersResult.error || 'Failed to load orders'
        };
      }

      if (!ordersResult.data || ordersResult.data.length === 0) {
        return { success: true, data: [] };
      }

      const orders = ordersResult.data;

      // Load sites and clients in parallel
      const [sitesResult, clientsResult] = await Promise.all([
        this.loadSites(),
        this.loadClients()
      ]);

      const sites = sitesResult.success ? sitesResult.data : [];
      const clients = clientsResult.success ? clientsResult.data : [];

      // Create lookup maps for better performance
      const siteMap = new Map(sites.map(site => [site.id, site]));
      const clientMap = new Map(clients.map(client => [client.id, client]));

      // Enrich orders with site and client information
      const enrichedOrders = orders.map(order => {
        let siteName = 'Unknown Site';
        let clientName = 'Unknown Client';
        let regionType = 'unknown';
        let unlinkedSite = order.unlinked_site || false;
        let orphanedReference = false; // Track if this order has orphaned references

        // Try to get site information
        if (order.site_id && !order.unlinked_site) {
          const site = siteMap.get(order.site_id);
          if (site) {
            siteName = site.site_name || 'Unknown Site';
            regionType = site.region_type || 'unknown';

            // Try to get client information
            if (site.client_id) {
              const client = clientMap.get(site.client_id);
              if (client) {
                clientName = client.name || 'Unknown Client';
              } else {
                // Site references a non-existent client (orphaned reference)
                orphanedReference = true;
                clientName = 'System (Orphaned)';
                console.warn(`Order ${order.order_number || order.id} has site ${order.site_id} with orphaned client_id: ${site.client_id}`);
              }
            }
          } else {
            // Order references a non-existent site (orphaned reference)
            unlinkedSite = true;
            orphanedReference = true;
            siteName = 'Unlinked (Orphaned)';
            console.warn(`Order ${order.order_number || order.id} references non-existent site: ${order.site_id}`);
          }
        }

        // Try to get client information directly from order if available
        if (order.client_id && !orphanedReference) {
          const client = clientMap.get(order.client_id);
          if (client) {
            clientName = client.name || 'Unknown Client';
          } else {
            // Order references a non-existent client directly (orphaned reference)
            orphanedReference = true;
            clientName = 'System (Orphaned)';
            console.warn(`Order ${order.order_number || order.id} has orphaned client_id: ${order.client_id}`);
          }
        }

        // Handle legacy orders that might have site_name directly
        if (!siteMap.get(order.site_id) && order.site_name) {
          siteName = order.site_name;
          unlinkedSite = true;
        }

        return {
          ...order,
          site_name: siteName,
          client_name: clientName,
          region_type: regionType,
          unlinked_site: unlinkedSite,
          orphaned_reference: orphanedReference, // Flag for UI to show warning
          // Ensure we have the new field names with fallbacks
          quantity_tons: order.quantity_tons || order.quantity || 0,
          delivery_window: order.delivery_window || order.time_slot || 'morning',
          delivery_method: order.delivery_method || order.delivery_type || 'self'
        };
      });

      // Log summary of orphaned references
      const orphanedCount = enrichedOrders.filter(o => o.orphaned_reference).length;
      if (orphanedCount > 0) {
        console.warn(`⚠️  Found ${orphanedCount} orders with orphaned references. Consider using the Data Cleanup tool at /admin/data-cleanup`);
      }

      return { success: true, data: enrichedOrders };
    } catch (error) {
      console.error('Error in getOrdersWithRelations:', error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Failed to load orders with relations'
      };
    }
  }
}