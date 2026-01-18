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
    if (!site) {
      return { valid: false, error: 'site_not_found' };
    }
    if (site.region_type === 'outside_eilat' && deliveryMethod === 'external' && quantity < 40) {
      return { valid: false, error: 'outside_eilat_min' };
    }
  } catch (error) {
    console.error('Error validating site:', error);
    return { valid: false, error: 'site_validation_failed' };
  }

  return { valid: true };
}

// Validate that referenced entities exist
async function validateOrderReferences(orderData: { client_id?: string; product_id?: string; site_id?: string }): Promise<{ valid: boolean; error?: string }> {
  // Validate client_id exists
  if (orderData.client_id) {
    try {
      const client = await superdev.entities.Client.get(orderData.client_id);
      if (!client) {
        return { valid: false, error: 'client_not_found' };
      }
    } catch (error) {
      console.error('Error validating client:', error);
      return { valid: false, error: 'client_not_found' };
    }
  }

  // Validate product_id exists
  if (orderData.product_id) {
    try {
      const product = await superdev.entities.Product.get(orderData.product_id);
      if (!product) {
        return { valid: false, error: 'product_not_found' };
      }
    } catch (error) {
      console.error('Error validating product:', error);
      return { valid: false, error: 'product_not_found' };
    }
  }

  // Validate site_id exists (if provided)
  if (orderData.site_id) {
    try {
      const site = await superdev.entities.Site.get(orderData.site_id);
      if (!site) {
        return { valid: false, error: 'site_not_found' };
      }
    } catch (error) {
      console.error('Error validating site:', error);
      return { valid: false, error: 'site_not_found' };
    }
  }

  return { valid: true };
}

const ORDER_COUNTER_NAME = 'order_number';
const INITIAL_ORDER_NUMBER = 2000;

async function generateOrderNumber(): Promise<string> {
  const MAX_RETRIES = 3;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      // Try to get existing counter
      let counters = await superdev.entities.Counter.filter({ name: ORDER_COUNTER_NAME });
      let counter = counters.length > 0 ? counters[0] : null;

      if (!counter) {
        // Initialize counter - first check existing orders to find highest number
        let highestNumber = INITIAL_ORDER_NUMBER;
        const orders = await superdev.entities.Order.list('-order_number', 100);
        for (const order of orders) {
          if (order.order_number) {
            const num = parseInt(order.order_number);
            if (!isNaN(num) && num > highestNumber) {
              highestNumber = num;
            }
          }
        }

        // Create counter with the highest found value
        counter = await superdev.entities.Counter.create({
          name: ORDER_COUNTER_NAME,
          value: highestNumber,
          last_updated: new Date().toISOString()
        });
      }

      // Increment and save
      const nextNumber = (counter.value || INITIAL_ORDER_NUMBER) + 1;
      await superdev.entities.Counter.update(counter.id, {
        value: nextNumber,
        last_updated: new Date().toISOString()
      });

      return nextNumber.toString();
    } catch (error) {
      console.error(`Error generating order number (attempt ${attempt + 1}/${MAX_RETRIES}):`, error);
      if (attempt === MAX_RETRIES - 1) {
        // On final retry failure, throw error instead of using timestamp
        throw new Error('Failed to generate order number after multiple attempts');
      }
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }

  throw new Error('Failed to generate order number');
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
    const body = ['POST', 'PUT', 'PATCH'].includes(method) ? await req.json() : null;

    // GET /orders - List orders with optional filters
    if (method === 'GET' && url.pathname === '/') {
      // Read parameters from query string for GET requests
      const params = url.searchParams;
      const filter = params.get('filter') ? JSON.parse(params.get('filter')!) : undefined;
      const sort = params.get('sort') || '-created_at';
      const limit = params.get('limit') ? parseInt(params.get('limit')!) : 50;
      const includeRelations = params.get('includeRelations') === 'true';
      const includeDeleted = params.get('includeDeleted') === 'true'; // Include soft-deleted orders

      try {
        let orders;
        // Build filter to exclude soft-deleted orders by default
        const effectiveFilter = filter ? { ...filter } : {};
        if (!includeDeleted) {
          effectiveFilter.is_deleted = false;
        }

        if (Object.keys(effectiveFilter).length > 0) {
          orders = await superdev.entities.Order.filter(effectiveFilter, sort, limit);
        } else {
          orders = await superdev.entities.Order.list(sort, limit);
          // Manual filter for soft deletes if no other filter applied
          if (!includeDeleted) {
            orders = orders.filter(o => !o.is_deleted);
          }
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
        // Validate that referenced entities (client, product, site) exist
        const referencesValidation = await validateOrderReferences(orderData);
        if (!referencesValidation.valid) {
          return new Response(JSON.stringify({ success: false, error: referencesValidation.error }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

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

    // DELETE /orders/:id - Soft delete order (sets is_deleted flag instead of physical delete)
    if (method === 'DELETE' && url.pathname.startsWith('/')) {
      const orderId = url.pathname.slice(1);
      const params = url.searchParams;
      const hardDelete = params.get('hard') === 'true'; // Only for special cases

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

        // Create audit log entry
        try {
          await superdev.entities.AuditLog.create({
            entity_type: 'Order',
            entity_id: orderId,
            action: hardDelete ? 'delete' : 'soft_delete',
            user_email: user.email,
            user_role: user.role,
            changes: {},
            metadata: {
              order_number: existingOrder.order_number,
              client_id: existingOrder.client_id,
              status_at_deletion: existingOrder.status
            },
            timestamp: new Date().toISOString()
          });
        } catch (auditError) {
          console.error('Error creating audit log:', auditError);
          // Don't fail deletion if audit fails
        }

        if (hardDelete) {
          // Physical delete - only for special cases (e.g., data cleanup)
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
        } else {
          // Soft delete - mark as deleted but keep data
          await superdev.entities.Order.update(orderId, {
            is_deleted: true,
            deleted_at: new Date().toISOString(),
            deleted_by: user.email
          });
        }

        return new Response(JSON.stringify({
          success: true,
          soft_deleted: !hardDelete
        }), {
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

    // POST /orders/:id/restore - Restore a soft-deleted order
    if (method === 'POST' && url.pathname.match(/^\/[^/]+\/restore$/)) {
      const orderId = url.pathname.split('/')[1];

      try {
        const existingOrder = await superdev.entities.Order.get(orderId);
        if (!existingOrder) {
          return new Response(JSON.stringify({ success: false, error: 'Order not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        if (!existingOrder.is_deleted) {
          return new Response(JSON.stringify({ success: false, error: 'Order is not deleted' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Only managers can restore orders
        if (user.role !== 'manager') {
          return new Response(JSON.stringify({ success: false, error: 'Permission denied' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Restore the order
        const restoredOrder = await superdev.entities.Order.update(orderId, {
          is_deleted: false,
          deleted_at: null,
          deleted_by: null
        });

        // Create audit log entry
        try {
          await superdev.entities.AuditLog.create({
            entity_type: 'Order',
            entity_id: orderId,
            action: 'restore',
            user_email: user.email,
            user_role: user.role,
            changes: {},
            metadata: { order_number: existingOrder.order_number },
            timestamp: new Date().toISOString()
          });
        } catch (auditError) {
          console.error('Error creating audit log:', auditError);
        }

        return new Response(JSON.stringify({ success: true, data: restoredOrder }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Error restoring order:', error);
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