import { createSuperdevClient } from 'npm:@superdevhq/client@0.1.51';

const superdev = createSuperdevClient({ 
  appId: Deno.env.get('SUPERDEV_APP_ID'), 
});

interface MessageData {
  recipient_email: string;
  subject: string;
  content: string;
  order_id?: string;
  thread_id?: string;
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

    // GET /messages - List user's messages
    if (method === 'GET' && url.pathname === '/') {
      try {
        const { filter, sort, limit, unreadOnly } = body || {};
        
        let messages;
        const userFilter = { 
          recipient_email: user.email, 
          ...(filter || {}) 
        };
        
        if (unreadOnly) {
          userFilter.is_read = false;
        }

        messages = await superdev.entities.Message.filter(
          userFilter, 
          sort || '-created_at', 
          limit || 50
        );

        return new Response(JSON.stringify({ success: true, data: messages }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Error fetching messages:', error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // GET /messages/count - Get unread count
    if (method === 'GET' && url.pathname === '/count') {
      try {
        const messages = await superdev.entities.Message.filter({
          recipient_email: user.email,
          is_read: false
        });

        return new Response(JSON.stringify({ 
          success: true, 
          data: { count: messages.length } 
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Error fetching message count:', error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // GET /messages/thread/:threadId - Get messages in a thread
    if (method === 'GET' && url.pathname.startsWith('/thread/')) {
      const threadId = url.pathname.split('/')[2];

      try {
        const messages = await superdev.entities.Message.filter(
          { thread_id: threadId },
          'created_at' // Chronological order for threads
        );

        // Filter messages that user can see (sent by or to the user)
        const userMessages = messages.filter(msg => 
          msg.sender_email === user.email || msg.recipient_email === user.email
        );

        return new Response(JSON.stringify({ success: true, data: userMessages }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Error fetching thread messages:', error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // POST /messages - Send new message
    if (method === 'POST' && url.pathname === '/') {
      const messageData: MessageData = body;

      try {
        // Generate thread ID if not provided
        if (!messageData.thread_id) {
          messageData.thread_id = `thread-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }

        // Set default values
        messageData.is_read = false;

        const newMessage = await superdev.entities.Message.create({
          ...messageData,
          sender_email: user.email
        });

        return new Response(JSON.stringify({ success: true, data: newMessage }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Error creating message:', error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // PUT /messages/:id/read - Mark message as read
    if (method === 'PUT' && url.pathname.endsWith('/read')) {
      const messageId = url.pathname.split('/')[1];

      try {
        const message = await superdev.entities.Message.get(messageId);
        if (!message) {
          return new Response(JSON.stringify({ success: false, error: 'Message not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Check if user is the recipient
        if (message.recipient_email !== user.email) {
          return new Response(JSON.stringify({ success: false, error: 'Permission denied' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const updatedMessage = await superdev.entities.Message.update(messageId, {
          is_read: true
        });

        return new Response(JSON.stringify({ success: true, data: updatedMessage }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Error marking message as read:', error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // PUT /messages/read-all - Mark all messages as read
    if (method === 'PUT' && url.pathname === '/read-all') {
      try {
        const unreadMessages = await superdev.entities.Message.filter({
          recipient_email: user.email,
          is_read: false
        });

        // Update all unread messages
        await Promise.all(
          unreadMessages.map(message =>
            superdev.entities.Message.update(message.id, { is_read: true })
          )
        );

        return new Response(JSON.stringify({ 
          success: true, 
          data: { updated: unreadMessages.length } 
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Error marking all messages as read:', error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // DELETE /messages/:id - Delete message
    if (method === 'DELETE' && url.pathname.startsWith('/')) {
      const messageId = url.pathname.slice(1);

      try {
        const message = await superdev.entities.Message.get(messageId);
        if (!message) {
          return new Response(JSON.stringify({ success: false, error: 'Message not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Check if user is sender, recipient, or manager
        if (message.sender_email !== user.email && 
            message.recipient_email !== user.email && 
            user.role !== 'manager') {
          return new Response(JSON.stringify({ success: false, error: 'Permission denied' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        await superdev.entities.Message.delete(messageId);

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Error deleting message:', error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response('Method not allowed', { status: 405 });
  } catch (error) {
    console.error('Messages API error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});