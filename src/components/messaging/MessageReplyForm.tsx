import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Message } from '@/entities';
import { toast } from '@/hooks/use-toast';
import { Send, X } from 'lucide-react';

interface MessageReplyFormProps {
  parentMessage: any;
  onReply: () => void;
  onCancel: () => void;
}

const MessageReplyForm: React.FC<MessageReplyFormProps> = ({ 
  parentMessage, 
  onReply, 
  onCancel 
}) => {
  const [replyContent, setReplyContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!replyContent.trim() || !user) return;

    setIsLoading(true);
    try {
      await Message.create({
        sender_email: user.email,
        recipient_email: parentMessage.sender_email,
        subject: `Re: ${parentMessage.subject}`,
        content: replyContent.trim(),
        is_read: false,
        thread_id: parentMessage.thread_id,
        order_id: parentMessage.order_id,
        parent_message_id: parentMessage.id
      });

      toast({
        title: t('reply_sent'),
        description: t('reply_sent_successfully')
      });

      setReplyContent('');
      onReply();
    } catch (error) {
      console.error('Error sending reply:', error);
      toast({
        title: t('error'),
        description: t('reply_failed'),
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mt-4 border-l-4 border-l-blue-500">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">
              {isRTL ? 'תגובה להודעה' : 'Reply to Message'}
            </h4>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
            <p className="font-medium mb-1">
              {isRTL ? 'תגובה ל:' : 'Replying to:'} {parentMessage.subject}
            </p>
            <p className="text-xs">
              {isRTL ? 'מאת:' : 'From:'} {parentMessage.sender_email}
            </p>
          </div>

          <Textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder={isRTL ? 'כתוב את התגובה שלך כאן...' : 'Write your reply here...'}
            rows={4}
            className={`resize-none ${isRTL ? 'text-right' : 'text-left'}`}
            dir={isRTL ? 'rtl' : 'ltr'}
            required
          />

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={!replyContent.trim() || isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="w-4 h-4 mr-2" />
              {isLoading ? t('sending') : t('send_reply')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default MessageReplyForm;