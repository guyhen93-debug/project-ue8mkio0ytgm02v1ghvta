import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, MailOpen } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';

interface MessageListProps {
  messages: any[];
  onThreadClick: (threadId: string) => void;
}

const MessageList: React.FC<MessageListProps> = ({ messages, onThreadClick }) => {
  const { language } = useLanguage();

  const translations = {
    he: {
      from: 'מאת:',
      to: 'אל:',
      unread: 'לא נקרא'
    },
    en: {
      from: 'From:',
      to: 'To:',
      unread: 'Unread'
    }
  };

  const t = translations[language];

  return (
    <div className="space-y-3">
      {messages.map((message) => (
        <Card
          key={message.id}
          className="industrial-card hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onThreadClick(message.thread_id || message.id)}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                {message.is_read ? (
                  <MailOpen className="h-5 w-5 text-gray-400" />
                ) : (
                  <Mail className="h-5 w-5 text-yellow-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {message.subject}
                  </h3>
                  {!message.is_read && (
                    <Badge className="bg-yellow-100 text-yellow-800 flex-shrink-0">
                      {t.unread}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {t.from} {message.sender_email}
                </p>
                <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                  {message.content}
                </p>
                <p className="text-xs text-gray-500">
                  {format(new Date(message.created_at), 'dd/MM/yyyy HH:mm', { locale: he })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MessageList;