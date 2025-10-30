import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { mockDataService } from '@/services/mockDataService';
import { toast } from '@/hooks/use-toast';
import { Send, MessageCircle } from 'lucide-react';

const Inbox: React.FC = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const { user } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      // Load messages for current user
      const userMessages = await mockDataService.getMessages(
        { to_user_id: user.id },
        '-created_at'
      );
      setMessages(userMessages);

      // Load orders for context
      const userOrders = await mockDataService.getOrders(
        user.role === 'client' ? { client_id: user.id } : {},
        '-created_at'
      );
      setOrders(userOrders);
    } catch (error) {
      console.error('Error loading inbox data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedOrderId) return;

    setIsSending(true);
    try {
      const order = orders.find(o => o.id === selectedOrderId);
      if (!order) return;

      // Determine recipient based on user role
      const recipientId = user.role === 'client' ? '3' : order.client_id; // '3' is manager ID

      await mockDataService.createMessage({
        order_id: selectedOrderId,
        from_user_id: user.id,
        to_user_id: recipientId,
        content: newMessage,
        read: false
      });

      setNewMessage('');
      toast({
        title: t('message_sent'),
        description: t('message_sent'),
      });

      // Reload messages
      await loadData();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: t('error'),
        description: t('unknown_error'),
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      await mockDataService.updateMessage(messageId, { read: true });
      setMessages(messages.map(m => 
        m.id === messageId ? { ...m, read: true } : m
      ));
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return t('just_now');
    } else if (diffInHours < 24) {
      return `${diffInHours}${t('hours_ago')}`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getOrderTitle = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    return order ? `${t('order_number')}${order.order_number}` : orderId;
  };

  const unreadCount = messages.filter(m => !m.read).length;

  if (isLoading) {
    return (
      <Layout title={t('inbox')}>
        <div className="px-4 py-8">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={t('inbox')}>
      <div className="px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">
              {t('inbox')}
            </h1>
            {unreadCount > 0 && (
              <Badge className="bg-red-100 text-red-800">
                {unreadCount} {t('new')}
              </Badge>
            )}
          </div>
        </div>

        {/* Send Message Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">{t('send_message')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                {t('order_number')}
              </label>
              <select
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">{t('select_product')}</option>
                {orders.map((order) => (
                  <option key={order.id} value={order.id}>
                    {t('order_number')}{order.order_number} - {t(order.product)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={t('type_message')}
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || !selectedOrderId || isSending}
                className="bg-yellow-500 hover:bg-yellow-600 text-black"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Messages List */}
        <div className="space-y-3">
          {messages.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t('no_messages')}
                </h3>
                <p className="text-gray-600">
                  {t('all_caught_up')}
                </p>
              </CardContent>
            </Card>
          ) : (
            messages.map((message) => (
              <Card
                key={message.id}
                className={`cursor-pointer transition-all ${
                  !message.read 
                    ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => !message.read && markAsRead(message.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className={`text-sm font-medium ${
                        !message.read ? 'text-gray-900' : 'text-gray-700'
                      }`}>
                        {message.order_id ? getOrderTitle(message.order_id) : t('inbox')}
                      </h4>
                      {!message.read && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatDate(message.created_at)}
                    </span>
                  </div>
                  <p className={`text-sm ${
                    !message.read ? 'text-gray-700' : 'text-gray-600'
                  }`}>
                    {message.content}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Inbox;