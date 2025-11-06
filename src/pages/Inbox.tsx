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
import { MessageCircle, X, CheckCheck, Trash2, Plus, Send, Eye, Reply, Edit, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import { he, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import MessageThreadView from '@/components/messaging/MessageThreadView';
import NewMessageForm from '@/components/messaging/NewMessageForm';

const Inbox: React.FC = () => {
  const { t, language, isRTL } = useLanguage();
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [showThreadDialog, setShowThreadDialog] = useState(false);
  const [showNewMessageForm, setShowNewMessageForm] = useState(false);

  useEffect(() => {
    loadMessages();
  }, [user]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      if (user?.email) {
        console.log('Loading messages for user:', user.email);
        
        // Try to get messages without parent_message_id filter first
        let userMessages = await Message.filter(
          { recipient_email: user.email }, 
          '-created_at'
        );
        
        // If we have messages, filter out replies on the client side
        if (userMessages && userMessages.length > 0) {
          userMessages = userMessages.filter(msg => !msg.parent_message_id);
        }
        
        console.log('Loaded messages:', userMessages.length);
        console.log('Messages data:', userMessages);
        setMessages(userMessages || []);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      // Set empty array on error to prevent infinite loading
      setMessages([]);
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

  const handleNewMessage = () => {
    setShowNewMessageForm(false);
    loadMessages(); // Refresh messages after sending
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

  // Show new message form
  if (showNewMessageForm) {
    return (
      <Layout title={isRTL ? 'הודעה חדשה' : 'New Message'}>
        <div className="p-2 sm:p-4 lg:p-6">
          <NewMessageForm
            onSent={handleNewMessage}
            onCancel={() => setShowNewMessageForm(false)}
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={t('inbox')}>
      <div className={cn(
        "p-2 sm:p-4 lg:p-6 space-y-3 sm:space-y-4",
        isRTL ? "rtl" : "ltr"
      )} dir={isRTL ? "rtl" : "ltr"}>
        {/* Header */}
        <div className={cn(
          "flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4",
          isRTL ? "sm:flex-row-reverse" : "sm:flex-row"
        )}>
          <div className={cn(
            "text-center sm:text-left",
            isRTL ? "sm:text-right" : "sm:text-left"
          )}>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('inbox')}</h1>
            <p className="text-sm sm:text-base text-gray-600">
              {unreadCount} {t('new')} • {messages.length} {t('total')}
            </p>
          </div>
          
          {/* Desktop Actions */}
          <div className="hidden sm:flex gap-2">
            <Button
              onClick={() => setShowNewMessageForm(true)}
              className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
              size="sm"
            >
              <Edit className="w-4 h-4" />
              <span className="hidden md:inline">
                {isRTL ? 'הודעה חדשה' : 'New Message'}
              </span>
            </Button>
            
            {process.env.NODE_ENV === 'development' && (
              <Button
                variant="outline"
                size="sm"
                onClick={createTestMessage}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden lg:inline">Test</span>
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
                <span className="hidden lg:inline">{t('mark_all_read')}</span>
              </Button>
            )}
          </div>

          {/* Mobile Actions */}
          <div className="flex sm:hidden justify-center gap-2">
            <Button
              onClick={() => setShowNewMessageForm(true)}
              className="bg-blue-600 hover:bg-blue-700 flex-1 max-w-[200px]"
              size="sm"
            >
              <Edit className="w-4 h-4 mr-2" />
              {isRTL ? 'הודעה חדשה' : 'New Message'}
            </Button>
            
            {(messages.some(m => !m.is_read) || process.env.NODE_ENV === 'development') && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="px-3">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isRTL ? "start" : "end"}>
                  {messages.some(m => !m.is_read) && (
                    <DropdownMenuItem onClick={markAllAsRead}>
                      <CheckCheck className="w-4 h-4 mr-2" />
                      {t('mark_all_read')}
                    </DropdownMenuItem>
                  )}
                  {process.env.NODE_ENV === 'development' && (
                    <DropdownMenuItem onClick={createTestMessage}>
                      <Plus className="w-4 h-4 mr-2" />
                      Test Message
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Messages List */}
        {messages.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <MessageCircle className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
              {t('no_messages')}
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4 px-4">
              {isRTL ? 'תיבת הדואר שלך ריקה' : 'Your inbox is empty'}
            </p>
            <Button
              onClick={() => setShowNewMessageForm(true)}
              className="bg-blue-600 hover:bg-blue-700"
              size="sm"
            >
              <Edit className="w-4 h-4 mr-2" />
              {isRTL ? 'כתוב הודעה ראשונה' : 'Write your first message'}
            </Button>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {messages.map((message) => (
              <Card 
                key={message.id} 
                className={cn(
                  "transition-all hover:shadow-md cursor-pointer",
                  !message.is_read ? 'bg-blue-50 border-blue-200' : ''
                )}
                onClick={() => openMessageThread(message)}
              >
                <CardContent className="p-3 sm:p-4">
                  <div className={cn(
                    "flex items-start justify-between gap-2 sm:gap-3",
                    isRTL ? "flex-row-reverse" : "flex-row"
                  )}>
                    <div className={cn(
                      "flex items-start gap-2 sm:gap-3 flex-1 min-w-0",
                      isRTL ? "flex-row-reverse" : "flex-row"
                    )}>
                      {/* Icon - Hidden on very small screens */}
                      <div className="mt-1 hidden xs:block">
                        <Send className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                      </div>
                      
                      {/* Content */}
                      <div className={cn(
                        "flex-1 min-w-0",
                        isRTL ? "text-right" : "text-left"
                      )}>
                        <div className={cn(
                          "flex items-start gap-2 mb-1 flex-wrap",
                          isRTL ? "flex-row-reverse" : "flex-row"
                        )}>
                          <h3 className="font-medium text-gray-900 text-sm sm:text-base line-clamp-1 flex-1">
                            {message.subject}
                          </h3>
                          {!message.is_read && (
                            <Badge variant="secondary" className="text-xs shrink-0">
                              {t('new')}
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-xs sm:text-sm text-gray-600 mb-1 truncate">
                          {isRTL ? 'מאת:' : 'From:'} {message.sender_email}
                        </p>
                        
                        <p className="text-gray-700 text-xs sm:text-sm leading-relaxed line-clamp-2 mb-2">
                          {message.content}
                        </p>
                        
                        <div className={cn(
                          "flex items-center gap-1 sm:gap-2 text-xs text-gray-500 flex-wrap",
                          isRTL ? "flex-row-reverse" : "flex-row"
                        )}>
                          <span className="shrink-0">{getTimeAgo(message.created_at)}</span>
                          {message.thread_id && (
                            <>
                              <span className="hidden sm:inline">•</span>
                              <div className="flex items-center gap-1 shrink-0">
                                <Reply className="w-3 h-3" />
                                <span className="hidden sm:inline">{isRTL ? 'שרשור' : 'Thread'}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-start gap-1 shrink-0">
                      {/* Desktop Actions */}
                      <div className="hidden sm:flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openMessageThread(message);
                          }}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 w-8 p-0"
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
                            className="text-green-600 hover:text-green-700 hover:bg-green-50 h-8 w-8 p-0"
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
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="mx-4 max-w-md">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-base">
                                {t('confirm_delete')}
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-sm">
                                {isRTL ? 'האם אתה בטוח שברצונך למחוק הודעה זו?' : 'Are you sure you want to delete this message?'}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                              <AlertDialogCancel className="w-full sm:w-auto">
                                {t('cancel')}
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMessage(message.id)}
                                className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
                              >
                                {t('delete')}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>

                      {/* Mobile Actions */}
                      <div className="sm:hidden">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                              className="h-8 w-8 p-0"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align={isRTL ? "start" : "end"}>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              openMessageThread(message);
                            }}>
                              <Eye className="w-4 h-4 mr-2" />
                              {isRTL ? 'פתח' : 'Open'}
                            </DropdownMenuItem>
                            {!message.is_read && (
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(message.id);
                              }}>
                                <CheckCheck className="w-4 h-4 mr-2" />
                                {isRTL ? 'סמן כנקרא' : 'Mark as read'}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteMessage(message.id);
                              }}
                              className="text-red-600"
                            >
                              <X className="w-4 h-4 mr-2" />
                              {t('delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
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
            "mx-2 sm:mx-4 max-w-[calc(100vw-1rem)] sm:max-w-4xl max-h-[90vh] overflow-y-auto",
            isRTL ? "text-right" : "text-left"
          )} dir={isRTL ? "rtl" : "ltr"}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base sm:text-lg pr-8">
                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="line-clamp-1">{selectedMessage?.subject}</span>
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