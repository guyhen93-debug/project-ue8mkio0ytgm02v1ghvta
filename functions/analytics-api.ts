import { createSuperdevClient } from 'npm:@superdevhq/client@0.1.51';

const superdev = createSuperdevClient({ 
  appId: Deno.env.get('SUPERDEV_APP_ID'), 
});

interface AnalyticsFilter {
  startDate?: string;
  endDate?: string;
  clientId?: string;
  siteId?: string;
  status?: string;
}

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    superdev.auth.setToken(token);
    
    const user = await superdev.auth.me();
    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Only managers can access analytics
    if (user.role !== 'manager') {
      return new Response(JSON.stringify({ success: false, error: 'Permission denied' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const url = new URL(req.url);
    const method = req.method;
    const body = method !== 'GET' ? await req.json() : null;

    // GET /analytics/dashboard - Get dashboard analytics
    if (method === 'GET' && url.pathname === '/dashboard') {
      try {
        const filter: AnalyticsFilter = body || {};
        
        // Build date filter
        let dateFilter = {};
        if (filter.startDate) {
          dateFilter = { created_at: { gte: filter.startDate } };
        }
        if (filter.endDate) {
          dateFilter = { ...dateFilter, created_at: { ...dateFilter.created_at, lte: filter.endDate } };
        }

        // Get all orders with filters
        const allOrders = await superdev.entities.Order.filter({
          ...dateFilter,
          ...(filter.clientId && { client_id: filter.clientId }),
          ...(filter.siteId && { site_id: filter.siteId }),
          ...(filter.status && { status: filter.status })
        });

        // Calculate metrics
        const totalOrders = allOrders.length;
        const pendingOrders = allOrders.filter(o => o.status === 'pending').length;
        const approvedOrders = allOrders.filter(o => o.status === 'approved').length;
        const rejectedOrders = allOrders.filter(o => o.status === 'rejected').length;
        const completedOrders = allOrders.filter(o => o.status === 'completed').length;

        const totalQuantity = allOrders.reduce((sum, order) => sum + (order.quantity_tons || 0), 0);
        const averageOrderSize = totalOrders > 0 ? totalQuantity / totalOrders : 0;

        // Orders by status
        const ordersByStatus = {
          pending: pendingOrders,
          approved: approvedOrders,
          rejected: rejectedOrders,
          completed: completedOrders
        };

        // Orders by delivery method
        const ordersByDeliveryMethod = {
          external: allOrders.filter(o => o.delivery_method === 'external').length,
          self: allOrders.filter(o => o.delivery_method === 'self').length
        };

        // Orders by region (requires site data)
        const sitesData = await superdev.entities.Site.list();
        const siteRegionMap = sitesData.reduce((map, site) => {
          map[site.id] = site.region_type;
          return map;
        }, {});

        const ordersByRegion = {
          eilat: 0,
          outside_eilat: 0,
          unknown: 0
        };

        allOrders.forEach(order => {
          if (order.site_id && siteRegionMap[order.site_id]) {
            ordersByRegion[siteRegionMap[order.site_id]]++;
          } else {
            ordersByRegion.unknown++;
          }
        });

        // Recent orders trend (last 30 days by day)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentOrders = allOrders.filter(order => 
          new Date(order.created_at) >= thirtyDaysAgo
        );

        const ordersTrend = [];
        for (let i = 29; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          
          const dayOrders = recentOrders.filter(order => 
            order.created_at.startsWith(dateStr)
          ).length;
          
          ordersTrend.push({
            date: dateStr,
            orders: dayOrders
          });
        }

        // Top clients by order count
        const clientOrderCounts = {};
        allOrders.forEach(order => {
          if (order.client_id) {
            clientOrderCounts[order.client_id] = (clientOrderCounts[order.client_id] || 0) + 1;
          }
        });

        const clientsData = await superdev.entities.Client.list();
        const topClients = Object.entries(clientOrderCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([clientId, count]) => {
            const client = clientsData.find(c => c.id === clientId);
            return {
              client_id: clientId,
              client_name: client?.name || 'Unknown',
              order_count: count
            };
          });

        const analytics = {
          summary: {
            totalOrders,
            pendingOrders,
            approvedOrders,
            rejectedOrders,
            completedOrders,
            totalQuantity,
            averageOrderSize: Math.round(averageOrderSize * 100) / 100
          },
          charts: {
            ordersByStatus,
            ordersByDeliveryMethod,
            ordersByRegion,
            ordersTrend,
            topClients
          }
        };

        return new Response(JSON.stringify({ success: true, data: analytics }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Error fetching analytics:', error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // GET /analytics/export - Export orders data
    if (method === 'GET' && url.pathname === '/export') {
      try {
        const filter: AnalyticsFilter = body || {};
        
        // Build date filter
        let dateFilter = {};
        if (filter.startDate) {
          dateFilter = { created_at: { gte: filter.startDate } };
        }
        if (filter.endDate) {
          dateFilter = { ...dateFilter, created_at: { ...dateFilter.created_at, lte: filter.endDate } };
        }

        // Get all orders with filters
        const orders = await superdev.entities.Order.filter({
          ...dateFilter,
          ...(filter.clientId && { client_id: filter.clientId }),
          ...(filter.siteId && { site_id: filter.siteId }),
          ...(filter.status && { status: filter.status })
        }, '-created_at');

        // Get related data
        const [clients, sites, products] = await Promise.all([
          superdev.entities.Client.list(),
          superdev.entities.Site.list(),
          superdev.entities.Product ? superdev.entities.Product.list() : []
        ]);

        // Create lookup maps
        const clientMap = clients.reduce((map, client) => {
          map[client.id] = client.name;
          return map;
        }, {});

        const siteMap = sites.reduce((map, site) => {
          map[site.id] = { name: site.site_name, region: site.region_type };
          return map;
        }, {});

        const productMap = products.reduce((map, product) => {
          map[product.id] = product.display_name_he || product.name;
          return map;
        }, {});

        // Enrich orders with related data
        const enrichedOrders = orders.map(order => ({
          order_number: order.order_number,
          client_name: clientMap[order.client_id] || 'Unknown',
          site_name: siteMap[order.site_id]?.name || 'Unknown',
          region_type: siteMap[order.site_id]?.region || 'Unknown',
          product_name: productMap[order.product_id] || order.product_id,
          quantity_tons: order.quantity_tons,
          delivery_date: order.delivery_date,
          delivery_window: order.delivery_window,
          delivery_method: order.delivery_method,
          status: order.status,
          quarry_or_crossing: order.quarry_or_crossing || 'default',
          notes: order.notes || '',
          created_at: order.created_at,
          created_by: order.created_by
        }));

        return new Response(JSON.stringify({ success: true, data: enrichedOrders }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Error exporting data:', error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response('Method not allowed', { status: 405 });
  } catch (error) {
    console.error('Analytics API error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});