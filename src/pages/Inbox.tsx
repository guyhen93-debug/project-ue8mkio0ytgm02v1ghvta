import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Message } from '@/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { MessageCircle, X, CheckCheck, Trash2, Plus, Send, Eye, Reply } from 'lucide-react';
import { format } from 'date-fns';
import { he, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import MessageThreadView from '@/components/messaging/MessageThreadView';

const Inbox: React.FC = () => {
  const { t, language, isRTL } = useLanguage();
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [showThreadDialog, setShowThreadDialog] = useState(false);

  useEffect(() => {
    loadMessages();
  }, [user]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      if (user?.email) {
        console.log('Loading messages for user:', user.email);
        // Get only root messages (not replies)
        const userMessages = await Message.filter(
          { 
            recipient_email: user.email,
            parent_message_id: null // Only root messages
          }, 
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

  const openMessageThread = async (message: any) => {
    setSelectedMessage(message);
    setShowThreadDialog(true);
    
    // Mark as read when opening
    if (!message.is_read) {
      await markAsRead(message.id);
    }
  };

  const closeMessageThread = () => {
    setShowThreadDialog(false);
    setSelectedMessage(null);
    loadMessages(); // Refresh to update read status and reply counts
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
      return `${diffInHours} ${t('hours_ago')}`;
    } else {
      return format(date, 'MMM d', { locale: language === 'he' ? he : enUS });
    }
  };

  // Get reply count for a message
  const getReplyCount = async (messageId: string) => {
    try {
      const replies = await Message.filter({ parent_message_id: messageId });
      return replies.length;
    } catch (error) {
      console.error('Error getting reply count:', error);
      return 0;
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
      <div className={cn(
        "p-4 space-y-4",
        isRTL ? "rtl" : "ltr"
      )} dir={isRTL ? "rtl" : "ltr"}>
        {/* Header */}
        <div className={cn(
          "flex justify-between items-center",
          isRTL ? "flex-row-reverse" : "flex-row"
        )}>
          <div className={cn(isRTL ? "text-right" : "text-left")}>
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
                className={cn(
                  "transition-all hover:shadow-md cursor-pointer",
                  !message.is_read ? 'bg-blue-50 border-blue-200' : ''
                )}
                onClick={() => openMessageThread(message)}
              >
                <CardContent className="p-4">
                  <div className={cn(
                    "flex items-start justify-between gap-3",
                    isRTL ? "flex-row-reverse" : "flex-row"
                  )}>
                    <div className={cn(
                      "flex items-start gap-3 flex-1",
                      isRTL ? "flex-row-reverse" : "flex-row"
                    )}>
                      {/* Icon */}
                      <div className="mt-1">
                        <Send className="w-5 h-5 text-blue-600" />
                      </div>
                      
                      {/* Content */}
                      <div className={cn(
                        "flex-1 min-w-0",
                        isRTL ? "text-right" : "text-left"
                      )}>
                        <div className={cn(
                          "flex items-center gap-2 mb-1",
                          isRTL ? "flex-row-reverse" : "flex-row"
                        )}>
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
                          {isRTL ? 'מאת:' : 'From:'} {message.sender_email}
                        </p>
                        <p className="text-gray-700 text-sm leading-relaxed line-clamp-2">
                          {message.content}
                        </p>
                        <div className={cn(
                          "flex items-center gap-2 mt-2 text-xs text-gray-500",
                          isRTL ? "flex-row-reverse" : "flex-row"
                        )}>
                          <span>{getTimeAgo(message.created_at)}</span>
                          {message.thread_id && (
                            <>
                              <span>•</span>
                              <div className="flex items-center gap-1">
                                <Reply className="w-3 h-3" />
                                <span>{isRTL ? 'שרשור' : 'Thread'}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openMessageThread(message);
                        }}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      
                      {!message.is_read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(message.id);
                          }}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <CheckCheck className="w-4 h-4" />
                        </Button>
                      )}
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => e.stopPropagation()}
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

        {/* Message Thread Dialog */}
        <Dialog open={showThreadDialog} onOpenChange={closeMessageThread}>
          <DialogContent className={cn(
            "max-w-4xl max-h-[90vh] overflow-y-auto",
            isRTL ? "text-right" : "text-left"
          )} dir={isRTL ? "rtl" : "ltr"}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                {selectedMessage?.subject}
              </DialogTitle>
            </DialogHeader>
            {selectedMessage && (
              <MessageThreadView
                message={selectedMessage}
                onUpdate={loadMessages}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Inbox;