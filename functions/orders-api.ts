import { createSuperdevClient } from 'npm:@superdevhq/client@0.1.51';

const superdev = createSuperdevClient({ 
  appId: Deno.env.get('SUPERDEV_APP_ID'), 
});

interface OrderData {
  order_number?: string;
  client_id: string;
  site_id?: string;
  product_id: string;
  quantity_tons: number;
  delivery_date: string;
  delivery_window: 'morning' | 'afternoon';
  delivery_method: 'self' | 'external';
  notes?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'completed';
  unlinked_site?: boolean;
  quarry_or_crossing?: string;
}

interface OrderFilter {
  client_id?: string;
  site_id?: string;
  status?: string;
  created_by?: string;
}

// Validation functions
function validateOrderDate(deliveryDate: string, deliveryWindow: string): { valid: boolean; error?: string } {
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

function validateExternalDelivery(quantity: number): { valid: boolean; error?: string } {
  if (quantity < 20) {
    return { valid: false, error: 'minimum_quantity_external' };
  }
  if (quantity % 20 !== 0) {
    return { valid: false, error: 'quantity_multiple_twenty' };
  }
  return { valid: true };
}

async function validateOutsideEilatDelivery(siteId: string, deliveryMethod: string, quantity: number): Promise<{ valid: boolean; error?: string }> {
  if (!siteId) return { valid: true };
  
  try {
    const site = await superdev.entities.Site.get(siteId);
    if (site && site.region_type === 'outside_eilat' && deliveryMethod === 'external' && quantity < 40) {
      return { valid: false, error: 'outside_eilat_min' };
    }
  } catch (error) {
    console.error('Error validating site:', error);
  }
  
  return { valid: true };
}

async function generateOrderNumber(): Promise<string> {
  try {
    // Get the latest order to determine next number
    const orders = await superdev.entities.Order.list('-created_at', 1);
    let nextNumber = 2001; // Start from 2001
    
    if (orders.length > 0 && orders[0].order_number) {
      const lastNumber = parseInt(orders[0].order_number);
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }
    
    return nextNumber.toString();
  } catch (error) {
    console.error('Error generating order number:', error);
    return Date.now().toString(); // Fallback to timestamp
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

    // GET /orders - List orders with optional filters
    if (method === 'GET' && url.pathname === '/') {
      const { filter, sort, limit, includeRelations } = body || {};
      
      try {
        let orders;
        if (filter) {
          orders = await superdev.entities.Order.filter(filter, sort || '-created_at', limit || 50);
        } else {
          orders = await superdev.entities.Order.list(sort || '-created_at', limit || 50);
        }

        // Include related data if requested
        if (includeRelations) {
          const enrichedOrders = await Promise.all(orders.map(async (order) => {
            try {
              const [client, site] = await Promise.all([
                order.client_id ? superdev.entities.Client.get(order.client_id).catch(() => null) : null,
                order.site_id ? superdev.entities.Site.get(order.site_id).catch(() => null) : null
              ]);

              return {
                ...order,
                client_name: client?.name || 'Unknown Client',
                site_name: site?.site_name || 'Unknown Site',
                region_type: site?.region_type || null
              };
            } catch (error) {
              console.error('Error enriching order:', error);
              return order;
            }
          }));
          
          return new Response(JSON.stringify({ success: true, data: enrichedOrders }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        return new Response(JSON.stringify({ success: true, data: orders }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Error fetching orders:', error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // POST /orders - Create new order
    if (method === 'POST' && url.pathname === '/') {
      const orderData: OrderData = body;

      try {
        // Validate delivery date and time
        const dateValidation = validateOrderDate(orderData.delivery_date, orderData.delivery_window);
        if (!dateValidation.valid) {
          return new Response(JSON.stringify({ success: false, error: dateValidation.error }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Validate external delivery requirements
        if (orderData.delivery_method === 'external') {
          const externalValidation = validateExternalDelivery(orderData.quantity_tons);
          if (!externalValidation.valid) {
            return new Response(JSON.stringify({ success: false, error: externalValidation.error }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }

        // Validate outside Eilat delivery requirements
        if (orderData.site_id) {
          const outsideEilatValidation = await validateOutsideEilatDelivery(
            orderData.site_id, 
            orderData.delivery_method, 
            orderData.quantity_tons
          );
          if (!outsideEilatValidation.valid) {
            return new Response(JSON.stringify({ success: false, error: outsideEilatValidation.error }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }

        // Generate order number if not provided
        if (!orderData.order_number) {
          orderData.order_number = await generateOrderNumber();
        }

        // Set default values
        orderData.status = orderData.status || 'pending';
        orderData.unlinked_site = !orderData.site_id;

        const newOrder = await superdev.entities.Order.create(orderData);

        // Create notification for managers
        try {
          const managers = await superdev.entities.User.filter({ role: 'manager' });
          for (const manager of managers) {
            await superdev.entities.Notification.create({
              recipient_email: manager.email,
              type: 'new_order',
              message: `New order #${orderData.order_number} created by ${user.email}`,
              order_id: newOrder.id,
              is_read: false
            });
          }
        } catch (notificationError) {
          console.error('Error creating notifications:', notificationError);
          // Don't fail the order creation if notifications fail
        }

        return new Response(JSON.stringify({ success: true, data: newOrder }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Error creating order:', error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // PUT /orders/:id - Update order
    if (method === 'PUT' && url.pathname.startsWith('/')) {
      const orderId = url.pathname.slice(1);
      const updates = body;

      try {
        // Check if user has permission to update this order
        const existingOrder = await superdev.entities.Order.get(orderId);
        if (!existingOrder) {
          return new Response(JSON.stringify({ success: false, error: 'Order not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Only managers or order creators can update orders
        if (user.role !== 'manager' && existingOrder.created_by !== user.email) {
          return new Response(JSON.stringify({ success: false, error: 'Permission denied' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const updatedOrder = await superdev.entities.Order.update(orderId, updates);

        // Create notification if status changed
        if (updates.status && updates.status !== existingOrder.status) {
          try {
            await superdev.entities.Notification.create({
              recipient_email: existingOrder.created_by,
              type: 'order_status_changed',
              message: `Order #${existingOrder.order_number} status changed to ${updates.status}`,
              order_id: orderId,
              is_read: false
            });
          } catch (notificationError) {
            console.error('Error creating status change notification:', notificationError);
          }
        }

        return new Response(JSON.stringify({ success: true, data: updatedOrder }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Error updating order:', error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // DELETE /orders/:id - Delete order
    if (method === 'DELETE' && url.pathname.startsWith('/')) {
      const orderId = url.pathname.slice(1);

      try {
        // Check if user has permission to delete this order
        const existingOrder = await superdev.entities.Order.get(orderId);
        if (!existingOrder) {
          return new Response(JSON.stringify({ success: false, error: 'Order not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Only managers can delete orders
        if (user.role !== 'manager') {
          return new Response(JSON.stringify({ success: false, error: 'Permission denied' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        await superdev.entities.Order.delete(orderId);

        // Clean up related notifications and messages
        try {
          const notifications = await superdev.entities.Notification.filter({ order_id: orderId });
          const messages = await superdev.entities.Message.filter({ order_id: orderId });
          
          await Promise.all([
            ...notifications.map(n => superdev.entities.Notification.delete(n.id)),
            ...messages.map(m => superdev.entities.Message.delete(m.id))
          ]);
        } catch (cleanupError) {
          console.error('Error cleaning up related data:', cleanupError);
        }

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Error deleting order:', error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response('Method not allowed', { status: 405 });
  } catch (error) {
    console.error('Orders API error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});