import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Message } from '@/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { MessageCircle, X, CheckCheck, Trash2, Plus, Send } from 'lucide-react';
import { format } from 'date-fns';
import { he, enUS } from 'date-fns/locale';

const Inbox: React.FC = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMessages();
  }, [user]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      if (user?.email) {
        console.log('Loading messages for user:', user.email);
        const userMessages = await Message.filter(
          { recipient_email: user.email }, 
          '-created_at'
        );
        console.log('Loaded messages:', userMessages.length);
        console.log('Messages data:', userMessages);
        setMessages(userMessages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      console.log('Marking message as read:', messageId);
      await Message.update(messageId, { is_read: true });
      await loadMessages();
      // Trigger a custom event to notify Layout component
      window.dispatchEvent(new CustomEvent('messageRead'));
      console.log('Message marked as read and event dispatched');
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadMessages = messages.filter(m => !m.is_read);
      console.log('Marking all messages as read:', unreadMessages.length);
      for (const message of unreadMessages) {
        await Message.update(message.id, { is_read: true });
      }
      await loadMessages();
      // Trigger a custom event to notify Layout component
      window.dispatchEvent(new CustomEvent('messageRead'));
      toast({
        title: t('mark_all_read'),
        description: 'All messages marked as read'
      });
    } catch (error) {
      console.error('Error marking all messages as read:', error);
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      await Message.delete(messageId);
      await loadMessages();
      // Trigger a custom event to notify Layout component
      window.dispatchEvent(new CustomEvent('messageRead'));
      toast({
        title: 'Message deleted',
        description: 'Message deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: t('error'),
        description: 'Delete failed',
        variant: 'destructive'
      });
    }
  };

  // Debug function to create a test message
  const createTestMessage = async () => {
    try {
      await Message.create({
        sender_email: 'test@example.com',
        recipient_email: user?.email,
        subject: 'בדיקת מסר חדש',
        content: 'זהו מסר לבדיקה של המערכת',
        is_read: false,
        thread_id: 'test-thread-' + Date.now(),
        order_id: 'test-order-id'
      });
      await loadMessages();
      toast({
        title: 'Test message created',
        description: 'A test message has been created'
      });
    } catch (error) {
      console.error('Error creating test message:', error);
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

  const unreadCount = messages.filter(m => !m.is_read).length;

  return (
    <Layout title={t('inbox')}>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('inbox')}</h1>
            <p className="text-gray-600">
              {unreadCount} {t('new')} • {messages.length} {t('total')}
            </p>
          </div>
          <div className="flex gap-2">
            {/* Debug button - remove in production */}
            {process.env.NODE_ENV === 'development' && (
              <Button
                variant="outline"
                size="sm"
                onClick={createTestMessage}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Test
              </Button>
            )}
            {messages.some(m => !m.is_read) && (
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                className="flex items-center gap-2"
              >
                <CheckCheck className="w-4 h-4" />
                {t('mark_all_read')}
              </Button>
            )}
          </div>
        </div>

        {/* Messages List */}
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t('no_messages')}
            </h3>
            <p className="text-gray-600 mb-4">Your inbox is empty</p>
            {/* Debug button for empty state */}
            {process.env.NODE_ENV === 'development' && (
              <Button
                onClick={createTestMessage}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Test Message
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <Card 
                key={message.id} 
                className={`transition-all hover:shadow-md ${
                  !message.is_read ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      {/* Icon */}
                      <div className="mt-1">
                        <Send className="w-5 h-5 text-blue-600" />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900">
                            {message.subject}
                          </h3>
                          {!message.is_read && (
                            <Badge variant="secondary" className="text-xs">
                              {t('new')}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          From: {message.sender_email}
                        </p>
                        <p className="text-gray-700 text-sm leading-relaxed">
                          {message.content}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {getTimeAgo(message.created_at)}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {!message.is_read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(message.id)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <CheckCheck className="w-4 h-4" />
                        </Button>
                      )}
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t('confirm_delete')}</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this message?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMessage(message.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              {t('delete')}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Inbox;