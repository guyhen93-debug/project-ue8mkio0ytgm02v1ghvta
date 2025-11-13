import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Message, User } from '@/entities';
import { useLanguage } from '@/contexts/LanguageContext';
import { Mail, Loader2, AlertCircle, RefreshCw, Plus } from 'lucide-react';
import MessageThreadView from '@/components/messaging/MessageThreadView';
import NewMessageForm from '@/components/messaging/NewMessageForm';
import MessageList from '@/components/messaging/MessageList';

const Inbox: React.FC = () => {
  const { language } = useLanguage();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const translations = {
    he: {
      title: 'תיבת דואר',
      noMessages: 'אין הודעות',
      loading: 'טוען...',
      error: 'שגיאה בטעינת ההודעות',
      retry: 'נסה שוב',
      newMessage: 'הודעה חדשה'
    },
    en: {
      title: 'Inbox',
      noMessages: 'No messages',
      loading: 'Loading...',
      error: 'Error loading messages',
      retry: 'Retry',
      newMessage: 'New Message'
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

      // Get messages where user is sender or recipient
      const sentMessages = await Message.filter(
        { sender_email: currentUser.email },
        '-created_at',
        1000
      );
      
      const receivedMessages = await Message.filter(
        { recipient_email: currentUser.email },
        '-created_at',
        1000
      );

      // Combine and deduplicate by thread
      const allMessages = [...sentMessages, ...receivedMessages];
      const threadMap = new Map();
      
      allMessages.forEach(msg => {
        const threadId = msg.thread_id || msg.id;
        const existing = threadMap.get(threadId);
        
        if (!existing || new Date(msg.created_at) > new Date(existing.created_at)) {
          threadMap.set(threadId, msg);
        }
      });

      const threads = Array.from(threadMap.values()).sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setMessages(threads);
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
    setShowNewMessage(false);
    loadMessages();
  };

  const handleNewMessageSuccess = () => {
    setShowNewMessage(false);
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

  if (showNewMessage) {
    return (
      <Layout title={t.newMessage}>
        <div className="p-3 sm:p-4 md:p-6 pb-24" dir={isRTL ? 'rtl' : 'ltr'}>
          <NewMessageForm
            onSuccess={handleNewMessageSuccess}
            onCancel={handleBackToList}
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={t.title}>
      <div className="p-3 sm:p-4 md:p-6 pb-24" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="mb-4">
          <Button
            onClick={() => setShowNewMessage(true)}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black gap-2"
          >
            <Plus className="h-4 w-4" />
            {t.newMessage}
          </Button>
        </div>

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
          <MessageList
            messages={messages}
            onThreadClick={handleThreadClick}
          />
        )}
      </div>
    </Layout>
  );
};

export default Inbox;