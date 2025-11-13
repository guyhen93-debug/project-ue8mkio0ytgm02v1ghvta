import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Message } from '@/entities';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';
import { ArrowRight, Send, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface MessageThreadViewProps {
  threadId: string;
  onBack: () => void;
}

const MessageThreadView: React.FC<MessageThreadViewProps> = ({ threadId, onBack }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [sending, setSending] = useState(false);
  const { user } = useAuth();
  const { language } = useLanguage();

  const translations = {
    he: {
      back: 'חזרה',
      reply: 'תגובה',
      send: 'שלח',
      sending: 'שולח...',
      typeReply: 'כתוב תגובה...',
      you: 'אתה',
      replySent: 'התגובה נשלחה',
      replySuccess: 'התגובה נשלחה בהצלחה',
      error: 'שגיאה',
      replyFailed: 'שליחת התגובה נכשלה',
      loading: 'טוען...'
    },
    en: {
      back: 'Back',
      reply: 'Reply',
      send: 'Send',
      sending: 'Sending...',
      typeReply: 'Type your reply...',
      you: 'You',
      replySent: 'Reply Sent',
      replySuccess: 'Reply sent successfully',
      error: 'Error',
      replyFailed: 'Failed to send reply',
      loading: 'Loading...'
    }
  };

  const t = translations[language];
  const isRTL = language === 'he';

  useEffect(() => {
    loadThread();
  }, [threadId]);

  const loadThread = async () => {
    try {
      setLoading(true);
      const threadMessages = await Message.filter(
        { thread_id: threadId },
        'created_at',
        1000
      );
      
      setMessages(threadMessages);
      
      // Mark messages as read
      const unreadMessages = threadMessages.filter(
        msg => !msg.is_read && msg.recipient_email === user?.email
      );
      
      for (const msg of unreadMessages) {
        await Message.update(msg.id, { is_read: true });
      }
    } catch (error) {
      console.error('Error loading thread:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async () => {
    if (!replyContent.trim() || !messages.length) return;

    setSending(true);
    try {
      const originalMessage = messages[0];
      const recipientEmail = originalMessage.sender_email === user?.email
        ? originalMessage.recipient_email
        : originalMessage.sender_email;

      await Message.create({
        sender_email: user.email,
        recipient_email: recipientEmail,
        subject: originalMessage.subject,
        content: replyContent.trim(),
        is_read: false,
        thread_id: threadId,
        order_id: originalMessage.order_id,
        parent_message_id: originalMessage.id
      });

      toast({
        title: t.replySent,
        description: t.replySuccess
      });

      setReplyContent('');
      await loadThread();
    } catch (error) {
      console.error('Error sending reply:', error);
      toast({
        title: t.error,
        description: t.replyFailed,
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };

  const isFromCurrentUser = (message: any) => {
    return message.sender_email === user?.email;
  };

  if (loading) {
    return (
      <Layout title={t.loading}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
        </div>
      </Layout>
    );
  }

  const firstMessage = messages[0];

  return (
    <Layout title={firstMessage?.subject || ''}>
      <div className="p-3 sm:p-4 md:p-6 pb-24" dir={isRTL ? 'rtl' : 'ltr'}>
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4 gap-2"
        >
          <ArrowRight className={`h-4 w-4 ${isRTL ? '' : 'rotate-180'}`} />
          {t.back}
        </Button>

        <div className="space-y-4 mb-6">
          {messages.map((message, index) => (
            <Card
              key={message.id}
              className={`${
                isFromCurrentUser(message)
                  ? 'bg-yellow-50 border-yellow-200 ml-8'
                  : 'bg-white mr-8'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">
                      {isFromCurrentUser(message) ? t.you : message.sender_email}
                    </span>
                    {index === 0 && (
                      <Badge variant="outline" className="text-xs">
                        {language === 'he' ? 'הודעה ראשונה' : 'Original'}
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {format(new Date(message.created_at), 'dd/MM/yyyy HH:mm', { locale: he })}
                  </span>
                </div>
                <p className="text-gray-800 whitespace-pre-wrap">{message.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="sticky bottom-20">
          <CardContent className="p-4">
            <div className="space-y-3">
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder={t.typeReply}
                rows={4}
                className="resize-none"
                dir={isRTL ? 'rtl' : 'ltr'}
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleReply}
                  disabled={!replyContent.trim() || sending}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black gap-2"
                >
                  <Send className="h-4 w-4" />
                  {sending ? t.sending : t.send}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default MessageThreadView;