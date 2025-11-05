import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Order } from '@/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { MessageCircle, Send, X, Trash2, Package } from 'lucide-react';
import { format } from 'date-fns';
import { he, enUS } from 'date-fns/locale';

interface Message {
  id: string;
  order_id?: string;
  sender_email: string;
  recipient_email: string;
  subject: string;
  content: string;
  is_read: boolean;
  created_at: string;
  message_type: 'order_related' | 'general';
}

const Inbox: React.FC = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [newMessage, setNewMessage] = useState({
    order_id: '',
    recipient_email: '',
    subject: '',
    content: ''
  });
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (user?.email) {
        // Load messages (mock data for now)
        const mockMessages: Message[] = [
          {
            id: '1',
            order_id: 'order_1',
            sender_email: 'manager@demo.com',
            recipient_email: user.email,
            subject: t('order_approved'),
            content: t('order_status_notification', { orderNumber: '123456', status: t('approved') }),
            is_read: false,
            created_at: new Date().toISOString(),
            message_type: 'order_related'
          }
        ];
        setMessages(mockMessages);

        // Load orders for dropdown
        if (user.role === 'client') {
          const userOrders = await Order.filter({ created_by: user.email }, '-created_at');
          setOrders(userOrders);
        } else {
          const allOrders = await Order.list('-created_at');
          setOrders(allOrders);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      // Update message as read (mock implementation)
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, is_read: true } : msg
        )
      );
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      setSelectedMessage(null);
      toast({
        title: t('message_deleted'),
        description: t('message_deleted_successfully')
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: t('error'),
        description: t('delete_failed'),
        variant: 'destructive'
      });
    }
  };

  const sendReply = async () => {
    if (!selectedMessage || !replyContent.trim()) return;

    try {
      // Mock reply implementation
      const newReply: Message = {
        id: Date.now().toString(),
        order_id: selectedMessage.order_id,
        sender_email: user?.email || '',
        recipient_email: selectedMessage.sender_email,
        subject: `Re: ${selectedMessage.subject}`,
        content: replyContent,
        is_read: false,
        created_at: new Date().toISOString(),
        message_type: selectedMessage.message_type
      };

      setMessages(prev => [newReply, ...prev]);
      setReplyContent('');
      
      toast({
        title: t('reply_sent'),
        description: t('reply_sent_successfully')
      });
    } catch (error) {
      console.error('Error sending reply:', error);
      toast({
        title: t('error'),
        description: t('reply_failed'),
        variant: 'destructive'
      });
    }
  };

  const sendNewMessage = async () => {
    if (!newMessage.content.trim() || !newMessage.recipient_email) return;

    try {
      const message: Message = {
        id: Date.now().toString(),
        order_id: newMessage.order_id || undefined,
        sender_email: user?.email || '',
        recipient_email: newMessage.recipient_email,
        subject: newMessage.subject || t('general_message'),
        content: newMessage.content,
        is_read: false,
        created_at: new Date().toISOString(),
        message_type: newMessage.order_id ? 'order_related' : 'general'
      };

      setMessages(prev => [message, ...prev]);
      setNewMessage({ order_id: '', recipient_email: '', subject: '', content: '' });
      setShowNewMessage(false);
      
      toast({
        title: t('message_sent'),
        description: t('message_sent')
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return t('just_now');
    } else if (diffInHours < 24) {
      return `${diffInHours}${t('hours_ago')}`;
    } else {
      return format(date, 'MMM d', { locale: language === 'he' ? he : enUS });
    }
  };

  if (loading) {
    return (
      <Layout title={t('inbox')}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto mb-4"></div>
            <p className="text-gray-600">{t('loading')}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={t('inbox')}>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('inbox')}</h1>
            <p className="text-gray-600">
              {messages.filter(m => !m.is_read).length} {t('unread_messages')}
            </p>
          </div>
          <Button
            onClick={() => setShowNewMessage(true)}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium"
          >
            <Send className="w-4 h-4 mr-2" />
            {t('send_message')}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Messages List */}
          <div className="space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t('no_messages')}
                </h3>
              </div>
            ) : (
              messages.map((message) => (
                <Card 
                  key={message.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    !message.is_read ? 'bg-blue-50 border-blue-200' : ''
                  } ${selectedMessage?.id === message.id ? 'ring-2 ring-yellow-500' : ''}`}
                  onClick={() => {
                    setSelectedMessage(message);
                    if (!message.is_read) {
                      markAsRead(message.id);
                    }
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900 truncate">
                            {message.subject}
                          </h3>
                          {!message.is_read && (
                            <Badge variant="secondary" className="text-xs">
                              {t('new')}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          {message.sender_email === user?.email ? t('you') : message.sender_email}
                        </p>
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {message.content}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {getTimeAgo(message.created_at)}
                        </p>
                      </div>
                      {message.order_id && (
                        <Package className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Message Detail & Reply */}
          <div className="space-y-4">
            {selectedMessage ? (
              <>
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{selectedMessage.subject}</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          {t('from')}: {selectedMessage.sender_email}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(selectedMessage.created_at), 'PPP p', { 
                            locale: language === 'he' ? he : enUS 
                          })}
                        </p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                            <X className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t('confirm_delete')}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t('confirm_delete_message')}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMessage(selectedMessage.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              {t('delete')}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {selectedMessage.content}
                    </p>
                  </CardContent>
                </Card>

                {/* Reply Form */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t('reply')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder={t('type_reply')}
                      rows={4}
                    />
                    <Button
                      onClick={sendReply}
                      disabled={!replyContent.trim()}
                      className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {t('send_reply')}
                    </Button>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">{t('select_message')}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* New Message Modal */}
        {showNewMessage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>{t('send_message')}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNewMessage(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Order Selection */}
                <div className="space-y-2">
                  <Label>{t('select_order')} ({t('optional')})</Label>
                  <Select 
                    value={newMessage.order_id} 
                    onValueChange={(value) => setNewMessage(prev => ({ ...prev, order_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('select_order')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">{t('general_message')}</SelectItem>
                      {orders.map((order) => (
                        <SelectItem key={order.id} value={order.id}>
                          {t('order_number')}{order.id.slice(-6)} - {t(order.product_id)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Recipient */}
                <div className="space-y-2">
                  <Label>{t('recipient')}</Label>
                  <Input
                    value={newMessage.recipient_email}
                    onChange={(e) => setNewMessage(prev => ({ ...prev, recipient_email: e.target.value }))}
                    placeholder="recipient@example.com"
                  />
                </div>

                {/* Subject */}
                <div className="space-y-2">
                  <Label>{t('subject')}</Label>
                  <Input
                    value={newMessage.subject}
                    onChange={(e) => setNewMessage(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder={t('subject')}
                  />
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <Label>{t('message')}</Label>
                  <Textarea
                    value={newMessage.content}
                    onChange={(e) => setNewMessage(prev => ({ ...prev, content: e.target.value }))}
                    placeholder={t('type_message')}
                    rows={4}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={sendNewMessage}
                    disabled={!newMessage.content.trim() || !newMessage.recipient_email}
                    className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-medium"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {t('send_message')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowNewMessage(false)}
                  >
                    {t('cancel')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Inbox;