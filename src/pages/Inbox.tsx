import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Message, User } from '@/entities';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Loader2, AlertCircle, RefreshCw, Plus, Sparkles, ArrowRight } from 'lucide-react';
import MessageThreadView from '@/components/messaging/MessageThreadView';
import NewMessageForm from '@/components/messaging/NewMessageForm';
import MessageList from '@/components/messaging/MessageList';

interface Thread {
  id: string;
  subject: string;
  order_id?: string;
  lastMessage: any;
  unreadCount: number;
  messages: any[];
}

const Inbox: React.FC = () => {
  const { language, t, isRTL } = useLanguage();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const prefill = (location.state as any)?.newMessage;
  
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const translations = {
    he: {
      title: 'תיבת דואר',
      noMessages: 'אין הודעות',
      loading: 'טוען...',
      error: 'שגיאה בטעינת ההודעות',
      retry: 'נסה שוב',
      newMessage: 'הודעה חדשה',
      backToList: 'חזרה לרשימה'
    },
    en: {
      title: 'Inbox',
      noMessages: 'No messages',
      loading: 'Loading...',
      error: 'Error loading messages',
      retry: 'Retry',
      newMessage: 'New Message',
      backToList: 'Back to list'
    }
  };

  const localT = translations[language];

  useEffect(() => {
    loadMessages();
  }, [retryCount, user?.email]);

  useEffect(() => {
    if (prefill && threads.length > 0) {
      // If we came from an order, try to find an existing thread for that order
      if (prefill.orderId) {
        const existingThread = threads.find(t => t.order_id === prefill.orderId);
        if (existingThread) {
          setSelectedThreadId(existingThread.id);
        } else {
          setShowNewMessage(true);
        }
      } else {
        setShowNewMessage(true);
      }
    }
  }, [prefill, threads.length]);

  const loadMessages = async () => {
    if (!user?.email) return;

    try {
      setLoading(true);
      setError(null);
      
      // Get messages where user is sender or recipient
      const [sentMessages, receivedMessages] = await Promise.all([
        Message.filter({ sender_email: user.email }, '-created_at', 1000),
        Message.filter({ recipient_email: user.email }, '-created_at', 1000)
      ]);

      const allMessages = [...sentMessages, ...receivedMessages];
      const threadMap = new Map<string, any[]>();
      
      allMessages.forEach(msg => {
        const threadId = msg.thread_id || msg.id;
        if (!threadMap.has(threadId)) {
          threadMap.set(threadId, []);
        }
        threadMap.get(threadId)?.push(msg);
      });

      const processedThreads: Thread[] = Array.from(threadMap.entries()).map(([id, msgs]) => {
        const sortedMsgs = msgs.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        const lastMessage = sortedMsgs[sortedMsgs.length - 1];
        const unreadCount = sortedMsgs.filter(m => 
          !m.is_read && m.recipient_email === user.email
        ).length;

        return {
          id,
          subject: lastMessage.subject || (lastMessage.order_id ? `Order #${lastMessage.order_id}` : 'No Subject'),
          order_id: lastMessage.order_id,
          lastMessage,
          unreadCount,
          messages: sortedMsgs
        };
      }).sort((a, b) => 
        new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime()
      );

      setThreads(processedThreads);
    } catch (error: any) {
      console.error('Error loading messages:', error);
      setError(localT.error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (threadId: string) => {
    const thread = threads.find(t => t.id === threadId);
    if (!thread || !user?.email) return;

    const unreadMsgs = thread.messages.filter(m => !m.is_read && m.recipient_email === user.email);
    if (unreadMsgs.length === 0) return;

    // Optimistic update
    setThreads(prev => prev.map(t => {
      if (t.id === threadId) {
        return {
          ...t,
          unreadCount: 0,
          messages: t.messages.map(m => m.recipient_email === user.email ? { ...m, is_read: true } : m)
        };
      }
      return t;
    }));

    try {
      await Promise.all(unreadMsgs.map(m => Message.update(m.id, { is_read: true })));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleSelectThread = (threadId: string) => {
    setSelectedThreadId(threadId);
    setShowNewMessage(false);
    handleMarkAsRead(threadId);
  };

  const handleNewMessageSuccess = () => {
    setShowNewMessage(false);
    loadMessages();
  };

  const handleBackToList = () => {
    setSelectedThreadId(null);
    setShowNewMessage(false);
  };

  const selectedThread = threads.find(t => t.id === selectedThreadId);

  return (
    <Layout title={localT.title}>
      <div className="h-[calc(100vh-110px)] flex flex-col md:flex-row overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
        
        {/* Left Sidebar (Thread List) */}
        <div className={`
          ${selectedThreadId || showNewMessage ? 'hidden md:flex' : 'flex'} 
          flex-col w-full md:w-[350px] lg:w-[400px] border-e bg-white
        `}>
          <div className="p-4 border-b">
            <Button
              onClick={() => {
                setShowNewMessage(true);
                setSelectedThreadId(null);
              }}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold gap-2"
            >
              <Plus className="h-4 w-4" />
              {localT.newMessage}
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <AlertCircle className="h-10 w-10 mx-auto mb-3 text-red-400" />
                <p className="text-sm text-red-600 mb-4">{error}</p>
                <Button onClick={() => setRetryCount(c => c + 1)} variant="outline" size="sm" className="gap-2">
                  <RefreshCw className="h-3 w-3" />
                  {localT.retry}
                </Button>
              </div>
            ) : threads.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Mail className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>{localT.noMessages}</p>
              </div>
            ) : (
              <MessageList
                threads={threads}
                selectedThreadId={selectedThreadId}
                onSelectThread={handleSelectThread}
              />
            )}
          </div>
        </div>

        {/* Right Content Area (Thread View or New Message) */}
        <div className={`
          ${selectedThreadId || showNewMessage ? 'flex' : 'hidden md:flex'} 
          flex-1 flex-col bg-gray-50 overflow-hidden
        `}>
          {(selectedThreadId || showNewMessage) && (
            <div className="md:hidden p-2 border-b bg-white flex items-center">
              <Button variant="ghost" size="sm" onClick={handleBackToList} className="gap-2">
                <ArrowRight className={`h-4 w-4 ${isRTL ? '' : 'rotate-180'}`} />
                {localT.backToList}
              </Button>
            </div>
          )}

          {showNewMessage ? (
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              <NewMessageForm
                onSuccess={handleNewMessageSuccess}
                onCancel={handleBackToList}
                initialSubject={prefill?.subject}
                initialOrderId={prefill?.orderId}
                initialRecipientEmail={prefill?.recipientEmail}
              />
            </div>
          ) : selectedThread ? (
            <MessageThreadView
              thread={selectedThread}
              currentUserEmail={user?.email || ''}
              onMessageSent={loadMessages}
            />
          ) : (
            <div className="hidden md:flex flex-col items-center justify-center h-full text-gray-400">
              <Mail className="h-16 w-16 mb-4 opacity-20" />
              <p>{isRTL ? 'בחר שיחה כדי להציג הודעות' : 'Select a conversation to view messages'}</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Inbox;
