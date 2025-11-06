import { createSuperdevClient } from 'npm:@superdevhq/client@0.1.51';

const superdev = createSuperdevClient({ 
  appId: Deno.env.get('SUPERDEV_APP_ID'), 
});

interface ClientData {
  name: string;
  category?: 'manager' | 'client';
  is_active?: boolean;
}

interface SiteData {
  client_id: string;
  site_name: string;
  region_type: 'eilat' | 'outside_eilat';
  contact_name?: string;
  contact_phone?: string;
  is_active?: boolean;
}

// Default clients and sites data
const DEFAULT_CLIENTS = [
  {
    name: 'דן עבודות עפר',
    category: 'client',
    is_active: true
  },
  {
    name: 'ארד בנייה',
    category: 'client',
    is_active: true
  },
  {
    name: 'שפיר הנדסה',
    category: 'client',
    is_active: true
  }
];

async function initializeDefaultData() {
  try {
    // Check if clients already exist
    const existingClients = await superdev.entities.Client.list('created_at', 1);
    if (existingClients.length > 0) {
      return; // Data already initialized
    }

    // Create default clients
    const createdClients = [];
    for (const clientData of DEFAULT_CLIENTS) {
      const client = await superdev.entities.Client.create(clientData);
      createdClients.push(client);
    }

    // Create default sites for the clients
    const defaultSites = [
      {
        client_id: createdClients[0].id,
        site_name: 'אתר שדרות ירושלים (אילת)',
        region_type: 'eilat',
        contact_name: 'אבי כהן',
        contact_phone: '050-1234567',
        is_active: true
      },
      {
        client_id: createdClients[0].id,
        site_name: 'אתר צוקי ים (ליטבתה)',
        region_type: 'outside_eilat',
        contact_name: 'דניאל לוי',
        contact_phone: '052-6543210',
        is_active: true
      },
      {
        client_id: createdClients[1].id,
        site_name: 'אתר נווה מדבר (אילת)',
        region_type: 'eilat',
        contact_name: 'משה מימון',
        contact_phone: '054-9988776',
        is_active: true
      },
      {
        client_id: createdClients[2].id,
        site_name: 'אתר סולל בונה צפון',
        region_type: 'outside_eilat',
        contact_name: '',
        contact_phone: '',
        is_active: true
      }
    ];

    for (const siteData of defaultSites) {
      await superdev.entities.Site.create(siteData);
    }
    
    console.log('Default clients and sites initialized successfully');
  } catch (error) {
    console.error('Error initializing default data:', error);
  }
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

    const url = new URL(req.url);
    const method = req.method;
    const body = method !== 'GET' ? await req.json() : null;

    // Initialize default data on first request
    await initializeDefaultData();

    // CLIENTS ENDPOINTS
    
    // GET /clients - List all clients
    if (method === 'GET' && url.pathname === '/clients') {
      try {
        const { filter, sort, limit } = body || {};
        
        let clients;
        if (filter) {
          clients = await superdev.entities.Client.filter(filter, sort || '-created_at', limit || 100);
        } else {
          clients = await superdev.entities.Client.list(sort || '-created_at', limit || 100);
        }

        return new Response(JSON.stringify({ success: true, data: clients }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Error fetching clients:', error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // POST /clients - Create new client (managers only)
    if (method === 'POST' && url.pathname === '/clients') {
      if (user.role !== 'manager') {
        return new Response(JSON.stringify({ success: false, error: 'Permission denied' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const clientData: ClientData = body;

      try {
        // Set default values
        clientData.category = clientData.category || 'client';
        clientData.is_active = clientData.is_active !== false;

        const newClient = await superdev.entities.Client.create(clientData);

        return new Response(JSON.stringify({ success: true, data: newClient }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Error creating client:', error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // PUT /clients/:id - Update client (managers only)
    if (method === 'PUT' && url.pathname.startsWith('/clients/')) {
      if (user.role !== 'manager') {
        return new Response(JSON.stringify({ success: false, error: 'Permission denied' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const clientId = url.pathname.split('/')[2];
      const updates = body;

      try {
        const existingClient = await superdev.entities.Client.get(clientId);
        if (!existingClient) {
          return new Response(JSON.stringify({ success: false, error: 'Client not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const updatedClient = await superdev.entities.Client.update(clientId, updates);

        return new Response(JSON.stringify({ success: true, data: updatedClient }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Error updating client:', error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // DELETE /clients/:id - Delete client (managers only)
    if (method === 'DELETE' && url.pathname.startsWith('/clients/')) {
      if (user.role !== 'manager') {
        return new Response(JSON.stringify({ success: false, error: 'Permission denied' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const clientId = url.pathname.split('/')[2];

      try {
        const existingClient = await superdev.entities.Client.get(clientId);
        if (!existingClient) {
          return new Response(JSON.stringify({ success: false, error: 'Client not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Check if client has associated sites or orders
        const [sites, orders] = await Promise.all([
          superdev.entities.Site.filter({ client_id: clientId }),
          superdev.entities.Order.filter({ client_id: clientId })
        ]);

        if (sites.length > 0 || orders.length > 0) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Cannot delete client with associated sites or orders' 
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        await superdev.entities.Client.delete(clientId);

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Error deleting client:', error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // SITES ENDPOINTS

    // GET /sites - List all sites
    if (method === 'GET' && url.pathname === '/sites') {
      try {
        const { filter, sort, limit } = body || {};
        
        let sites;
        if (filter) {
          sites = await superdev.entities.Site.filter(filter, sort || '-created_at', limit || 100);
        } else {
          sites = await superdev.entities.Site.list(sort || '-created_at', limit || 100);
        }

        return new Response(JSON.stringify({ success: true, data: sites }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Error fetching sites:', error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // POST /sites - Create new site (managers only)
    if (method === 'POST' && url.pathname === '/sites') {
      if (user.role !== 'manager') {
        return new Response(JSON.stringify({ success: false, error: 'Permission denied' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const siteData: SiteData = body;

      try {
        // Validate client exists
        const client = await superdev.entities.Client.get(siteData.client_id);
        if (!client) {
          return new Response(JSON.stringify({ success: false, error: 'Client not found' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Set default values
        siteData.is_active = siteData.is_active !== false;
        siteData.contact_name = siteData.contact_name || '';
        siteData.contact_phone = siteData.contact_phone || '';

        const newSite = await superdev.entities.Site.create(siteData);

        return new Response(JSON.stringify({ success: true, data: newSite }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Error creating site:', error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // PUT /sites/:id - Update site (managers only)
    if (method === 'PUT' && url.pathname.startsWith('/sites/')) {
      if (user.role !== 'manager') {
        return new Response(JSON.stringify({ success: false, error: 'Permission denied' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const siteId = url.pathname.split('/')[2];
      const updates = body;

      try {
        const existingSite = await superdev.entities.Site.get(siteId);
        if (!existingSite) {
          return new Response(JSON.stringify({ success: false, error: 'Site not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Validate client exists if client_id is being updated
        if (updates.client_id) {
          const client = await superdev.entities.Client.get(updates.client_id);
          if (!client) {
            return new Response(JSON.stringify({ success: false, error: 'Client not found' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }

        const updatedSite = await superdev.entities.Site.update(siteId, updates);

        return new Response(JSON.stringify({ success: true, data: updatedSite }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Error updating site:', error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // DELETE /sites/:id - Delete site (managers only)
    if (method === 'DELETE' && url.pathname.startsWith('/sites/')) {
      if (user.role !== 'manager') {
        return new Response(JSON.stringify({ success: false, error: 'Permission denied' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const siteId = url.pathname.split('/')[2];

      try {
        const existingSite = await superdev.entities.Site.get(siteId);
        if (!existingSite) {
          return new Response(JSON.stringify({ success: false, error: 'Site not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Check if site has associated orders
        const orders = await superdev.entities.Order.filter({ site_id: siteId });
        if (orders.length > 0) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Cannot delete site with associated orders' 
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        await superdev.entities.Site.delete(siteId);

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Error deleting site:', error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response('Method not allowed', { status: 405 });
  } catch (error) {
    console.error('Clients/Sites API error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});