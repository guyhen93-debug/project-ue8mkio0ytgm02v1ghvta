import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Message } from '@/entities';
import { MessageCircle, Reply, User, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { he, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import MessageReplyForm from './MessageReplyForm';

interface MessageThreadViewProps {
  message: any;
  onUpdate: () => void;
}

const MessageThreadView: React.FC<MessageThreadViewProps> = ({ message, onUpdate }) => {
  const [replies, setReplies] = useState<any[]>([]);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { t, language, isRTL } = useLanguage();

  useEffect(() => {
    loadReplies();
  }, [message.id]);

  const loadReplies = async () => {
    try {
      setLoading(true);
      const threadReplies = await Message.filter(
        { parent_message_id: message.id },
        'created_at'
      );
      setReplies(threadReplies);
    } catch (error) {
      console.error('Error loading replies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async () => {
    setShowReplyForm(false);
    await loadReplies();
    onUpdate();
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const locale = language === 'he' ? he : enUS;
    return format(date, 'PPp', { locale });
  };

  const isFromCurrentUser = (msg: any) => {
    return msg.sender_email === user?.email;
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

  return (
    <div className="space-y-4">
      {/* Original Message */}
      <Card className={cn(
        "transition-all",
        !message.is_read ? 'bg-blue-50 border-blue-200' : ''
      )}>
        <CardContent className="p-4">
          <div className={cn(
            "flex items-start gap-3",
            isRTL ? "flex-row-reverse" : "flex-row"
          )}>
            <div className="flex-shrink-0">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                isFromCurrentUser(message) ? "bg-blue-100" : "bg-gray-100"
              )}>
                <User className="w-4 h-4 text-gray-600" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className={cn(
                "flex items-center gap-2 mb-2",
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
              
              <div className={cn(
                "flex items-center gap-2 text-sm text-gray-600 mb-2",
                isRTL ? "flex-row-reverse" : "flex-row"
              )}>
                <span>
                  {isRTL ? 'מאת:' : 'From:'} {message.sender_email}
                </span>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{getTimeAgo(message.created_at)}</span>
                </div>
              </div>
              
              <div className={cn(
                "bg-white p-3 rounded-lg border",
                isRTL ? "text-right" : "text-left"
              )} dir={isRTL ? "rtl" : "ltr"}>
                <p className="text-gray-700 leading-relaxed">
                  {message.content}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Replies */}
      {replies.length > 0 && (
        <div className={cn(
          "space-y-3",
          isRTL ? "mr-8" : "ml-8"
        )}>
          {replies.map((reply) => (
            <Card key={reply.id} className="bg-gray-50">
              <CardContent className="p-4">
                <div className={cn(
                  "flex items-start gap-3",
                  isRTL ? "flex-row-reverse" : "flex-row"
                )}>
                  <div className="flex-shrink-0">
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center",
                      isFromCurrentUser(reply) ? "bg-blue-100" : "bg-gray-100"
                    )}>
                      <User className="w-3 h-3 text-gray-600" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className={cn(
                      "flex items-center gap-2 text-sm text-gray-600 mb-2",
                      isRTL ? "flex-row-reverse" : "flex-row"
                    )}>
                      <span className="font-medium">
                        {isFromCurrentUser(reply) ? t('you') : reply.sender_email}
                      </span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{getTimeAgo(reply.created_at)}</span>
                      </div>
                    </div>
                    
                    <div className={cn(
                      "bg-white p-3 rounded-lg border",
                      isRTL ? "text-right" : "text-left"
                    )} dir={isRTL ? "rtl" : "ltr"}>
                      <p className="text-gray-700 leading-relaxed">
                        {reply.content}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Reply Button/Form */}
      {!showReplyForm ? (
        <div className={cn(
          "flex justify-end",
          isRTL ? "justify-start" : "justify-end"
        )}>
          <Button
            variant="outline"
            onClick={() => setShowReplyForm(true)}
            className="flex items-center gap-2"
          >
            <Reply className="w-4 h-4" />
            {t('reply')}
          </Button>
        </div>
      ) : (
        <MessageReplyForm
          parentMessage={message}
          onReply={handleReply}
          onCancel={() => setShowReplyForm(false)}
        />
      )}
    </div>
  );
};

export default MessageThreadView;