import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { mockDataService } from '@/services/mockDataService';
import { toast } from '@/hooks/use-toast';
import { Send, X, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { he, enUS } from 'date-fns/locale';

interface MessageThreadProps {
  message: any;
  onDelete?: (messageId: string) => void;
  onReply?: () => void;
}

const MessageThread: React.FC<MessageThreadProps> = ({ message, onDelete, onReply }) => {
  const [replies, setReplies] = useState<any[]>([]);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { user } = useAuth();
  const { t, language } = useLanguage();

  useEffect(() => {
    loadReplies();
  }, [message.id]);

  const loadReplies = async () => {
    try {
      const messageReplies = await mockDataService.getMessageReplies(message.id);
      setReplies(messageReplies);
    } catch (error) {
      console.error('Error loading replies:', error);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !user) return;

    setIsLoading(true);
    try {
      await mockDataService.createMessageReply({
        parent_message_id: message.id,
        order_id: message.order_id,
        from_user_id: user.id,
        to_user_id: message.from_user_id === user.id ? message.to_user_id : message.from_user_id,
        content: replyText.trim(),
        read: false
      });

      setReplyText('');
      setShowReplyForm(false);
      await loadReplies();
      
      if (onReply) onReply();
      
      toast({
        title: t('reply_sent'),
        description: t('reply_sent_successfully'),
      });
    } catch (error) {
      console.error('Error sending reply:', error);
      toast({
        title: t('error'),
        description: t('reply_failed'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await mockDataService.deleteMessage(message.id);
      
      if (onDelete) onDelete(message.id);
      
      toast({
        title: t('message_deleted'),
        description: t('message_deleted_successfully'),
      });
      
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: t('error'),
        description: t('delete_failed'),
        variant: 'destructive',
      });
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const locale = language === 'he' ? he : enUS;
    return formatDistanceToNow(date, { addSuffix: true, locale });
  };

  const isFromCurrentUser = (msg: any) => {
    return msg.from_user_id === user?.id;
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-blue-600" />
            <CardTitle className="text-sm font-medium">
              {message.order_id ? `${t('order')} #${message.order_id}` : t('general_message')}
            </CardTitle>
            {!message.read && (
              <Badge variant="default" className="text-xs">
                {t('new')}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
            className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Original Message */}
        <div className={`p-3 rounded-lg ${isFromCurrentUser(message) ? 'bg-blue-50 ml-8' : 'bg-gray-50 mr-8'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-600">
              {isFromCurrentUser(message) ? t('you') : t('manager')}
            </span>
            <span className="text-xs text-gray-500">
              {formatMessageTime(message.created_at)}
            </span>
          </div>
          <p className="text-sm text-gray-800">{message.content}</p>
        </div>

        {/* Replies */}
        {replies.map((reply) => (
          <div
            key={reply.id}
            className={`p-3 rounded-lg ${isFromCurrentUser(reply) ? 'bg-blue-50 ml-8' : 'bg-gray-50 mr-8'}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-600">
                {isFromCurrentUser(reply) ? t('you') : t('manager')}
              </span>
              <span className="text-xs text-gray-500">
                {formatMessageTime(reply.created_at)}
              </span>
            </div>
            <p className="text-sm text-gray-800">{reply.content}</p>
          </div>
        ))}

        {/* Reply Form */}
        {showReplyForm ? (
          <div className="space-y-3 pt-2 border-t">
            <Textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={t('type_reply')}
              rows={3}
              className="resize-none"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleReply}
                disabled={!replyText.trim() || isLoading}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="h-3 w-3 mr-1" />
                {t('send_reply')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowReplyForm(false);
                  setReplyText('');
                }}
              >
                {t('cancel')}
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowReplyForm(true)}
            className="w-full"
          >
            <MessageCircle className="h-3 w-3 mr-1" />
            {t('reply')}
          </Button>
        )}
      </CardContent>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold mb-2">{t('confirm_delete')}</h3>
            <p className="text-gray-600 mb-4">{t('confirm_delete_message')}</p>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={handleDelete}
                className="flex-1"
              >
                {t('delete')}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1"
              >
                {t('cancel')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default MessageThread;