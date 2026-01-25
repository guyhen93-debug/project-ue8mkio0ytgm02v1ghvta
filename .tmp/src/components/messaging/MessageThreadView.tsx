import React, { useState } from 'react';
import { Message } from '@/entities';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import MessageThread from './MessageThread';
import MessageReplyForm from './MessageReplyForm';

interface Thread {
  id: string;
  subject: string;
  order_id?: string;
  messages: any[];
}

interface MessageThreadViewProps {
  thread: Thread;
  currentUserEmail: string;
  onMessageSent: () => void;
}

const MessageThreadView: React.FC<MessageThreadViewProps> = ({ thread, currentUserEmail, onMessageSent }) => {
  const { language, t } = useLanguage();
  const [sending, setSending] = useState(false);

  const handleReply = async (content: string) => {
    if (!content.trim() || !thread.messages.length) return;

    setSending(true);
    try {
      const firstMsg = thread.messages[0];
      const recipientEmail = firstMsg.sender_email === currentUserEmail
        ? firstMsg.recipient_email
        : firstMsg.sender_email;

      await Message.create({
        sender_email: currentUserEmail,
        recipient_email: recipientEmail,
        subject: firstMsg.subject,
        content: content.trim(),
        is_read: false,
        thread_id: thread.id,
        order_id: firstMsg.order_id,
        parent_message_id: firstMsg.id
      });

      onMessageSent();
    } catch (error) {
      console.error('Error sending reply:', error);
      toast({
        title: language === 'he' ? 'שגיאה' : 'Error',
        description: language === 'he' ? 'שליחת התגובה נכשלה' : 'Failed to send reply',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="flex-1 overflow-hidden">
        <MessageThread 
          messages={thread.messages} 
          currentUserEmail={currentUserEmail} 
          orderId={thread.order_id} 
        />
      </div>
      
      <div className="p-4 bg-white border-t">
        <MessageReplyForm 
          onSend={handleReply} 
          isLoading={sending} 
        />
      </div>
    </div>
  );
};

export default MessageThreadView;
