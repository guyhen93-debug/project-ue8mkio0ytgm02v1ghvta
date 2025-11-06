import { createSuperdevClient } from 'npm:@superdevhq/client@0.1.51';

const superdev = createSuperdevClient({ 
  appId: Deno.env.get('SUPERDEV_APP_ID'), 
});

interface NotificationData {
  recipient_email: string;
  type: string;
  message: string;
  order_id?: string;
  is_read?: boolean;
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

    // GET /notifications - List user's notifications
    if (method === 'GET' && url.pathname === '/') {
      try {
        const { filter, sort, limit, unreadOnly } = body || {};
        
        let notifications;
        const userFilter = { recipient_email: user.email, ...(filter || {}) };
        
        if (unreadOnly) {
          userFilter.is_read = false;
        }

        notifications = await superdev.entities.Notification.filter(
          userFilter, 
          sort || '-created_at', 
          limit || 50
        );

        return new Response(JSON.stringify({ success: true, data: notifications }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Error fetching notifications:', error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // GET /notifications/count - Get unread count
    if (method === 'GET' && url.pathname === '/count') {
      try {
        const notifications = await superdev.entities.Notification.filter({
          recipient_email: user.email,
          is_read: false
        });

        return new Response(JSON.stringify({ 
          success: true, 
          data: { count: notifications.length } 
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Error fetching notification count:', error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // POST /notifications - Create notification (managers only)
    if (method === 'POST' && url.pathname === '/') {
      if (user.role !== 'manager') {
        return new Response(JSON.stringify({ success: false, error: 'Permission denied' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const notificationData: NotificationData = body;

      try {
        // Set default values
        notificationData.is_read = notificationData.is_read || false;

        const newNotification = await superdev.entities.Notification.create(notificationData);

        return new Response(JSON.stringify({ success: true, data: newNotification }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Error creating notification:', error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // PUT /notifications/:id/read - Mark notification as read
    if (method === 'PUT' && url.pathname.endsWith('/read')) {
      const notificationId = url.pathname.split('/')[1];

      try {
        const notification = await superdev.entities.Notification.get(notificationId);
        if (!notification) {
          return new Response(JSON.stringify({ success: false, error: 'Notification not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Check if user owns this notification
        if (notification.recipient_email !== user.email) {
          return new Response(JSON.stringify({ success: false, error: 'Permission denied' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const updatedNotification = await superdev.entities.Notification.update(notificationId, {
          is_read: true
        });

        return new Response(JSON.stringify({ success: true, data: updatedNotification }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Error marking notification as read:', error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // PUT /notifications/read-all - Mark all notifications as read
    if (method === 'PUT' && url.pathname === '/read-all') {
      try {
        const unreadNotifications = await superdev.entities.Notification.filter({
          recipient_email: user.email,
          is_read: false
        });

        // Update all unread notifications
        await Promise.all(
          unreadNotifications.map(notification =>
            superdev.entities.Notification.update(notification.id, { is_read: true })
          )
        );

        return new Response(JSON.stringify({ 
          success: true, 
          data: { updated: unreadNotifications.length } 
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Error marking all notifications as read:', error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // DELETE /notifications/:id - Delete notification
    if (method === 'DELETE' && url.pathname.startsWith('/')) {
      const notificationId = url.pathname.slice(1);

      try {
        const notification = await superdev.entities.Notification.get(notificationId);
        if (!notification) {
          return new Response(JSON.stringify({ success: false, error: 'Notification not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Check if user owns this notification or is a manager
        if (notification.recipient_email !== user.email && user.role !== 'manager') {
          return new Response(JSON.stringify({ success: false, error: 'Permission denied' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        await superdev.entities.Notification.delete(notificationId);

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Error deleting notification:', error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response('Method not allowed', { status: 405 });
  } catch (error) {
    console.error('Notifications API error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});