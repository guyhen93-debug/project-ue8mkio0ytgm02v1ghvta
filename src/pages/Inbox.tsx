import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Message, User } from '@/entities';
import { useLanguage } from '@/contexts/LanguageContext';
import { Mail, MailOpen, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import MessageThreadView from '@/components/messaging/MessageThreadView';

const Inbox: React.FC = () => {
  const { language } = useLanguage();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const translations = {
    he: {
      title: 'תיבת דואר',
      noMessages: 'אין הודעות',
      unread: 'לא נקרא',
      loading: 'טוען...',
      error: 'שגיאה בטעינת ההודעות',
      retry: 'נסה שוב'
    },
    en: {
      title: 'Inbox',
      noMessages: 'No messages',
      unread: 'Unread',
      loading: 'Loading...',
      error: 'Error loading messages',
      retry: 'Retry'
    }
  };

  const t = translations[language];
  const isRTL = language === 'he';

  useEffect(() => {
    loadMessages();
  }, [retryCount]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const currentUser = await User.me();
      setUser(currentUser);

      const userMessages = await Message.filter(
        { recipient_email: currentUser.email },
        '-created_at',
        1000
      );

      // Group messages by thread
      const threadMap = new Map();
      userMessages.forEach(msg => {
        const threadId = msg.thread_id || msg.id;
        if (!threadMap.has(threadId)) {
          threadMap.set(threadId, []);
        }
        threadMap.get(threadId).push(msg);
      });

      // Get the latest message from each thread
      const threads = Array.from(threadMap.values()).map(threadMessages => {
        return threadMessages.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
      });

      setMessages(threads.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
    } catch (error) {
      console.error('Error loading messages:', error);
      setError(t.error);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  const handleThreadClick = (threadId: string) => {
    setSelectedThread(threadId);
  };

  const handleBackToList = () => {
    setSelectedThread(null);
    loadMessages();
  };

  if (selectedThread) {
    return (
      <MessageThreadView
        threadId={selectedThread}
        onBack={handleBackToList}
      />
    );
  }

  return (
    <Layout title={t.title}>
      <div className="p-3 sm:p-4 md:p-6 pb-24" dir={isRTL ? 'rtl' : 'ltr'}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 mx-auto mb-3 text-red-400" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={handleRetry} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              {t.retry}
            </Button>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Mail className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg">{t.noMessages}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <Card
                key={message.id}
                className="industrial-card hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleThreadClick(message.thread_id || message.id)}
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
                        {language === 'he' ? 'מאת:' : 'From:'} {message.sender_email}
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
        )}
      </div>
    </Layout>
  );
};

export default Inbox;