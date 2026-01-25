import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { format, isToday, isYesterday } from 'date-fns';
import { he, enUS } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Thread {
  id: string;
  subject: string;
  order_id?: string;
  lastMessage: any;
  unreadCount: number;
}

interface MessageListProps {
  threads: Thread[];
  selectedThreadId: string | null;
  onSelectThread: (threadId: string) => void;
}

const MessageList: React.FC<MessageListProps> = ({ threads, selectedThreadId, onSelectThread }) => {
  const { language, isRTL } = useLanguage();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredThreads = filter === 'all' 
    ? threads 
    : threads.filter(t => t.unreadCount > 0);

  const formatTime = (date: string) => {
    const d = new Date(date);
    const locale = language === 'he' ? he : enUS;
    
    if (isToday(d)) {
      return format(d, 'HH:mm');
    }
    if (isYesterday(d)) {
      return language === 'he' ? 'אתמול' : 'Yesterday';
    }
    return format(d, 'dd/MM/yy');
  };

  const getThreadTitle = (thread: Thread) => {
    if (thread.order_id) {
      return language === 'he' ? `הזמנה #${thread.order_id}` : `Order #${thread.order_id}`;
    }
    return thread.subject || (language === 'he' ? 'ללא נושא' : 'No Subject');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b bg-gray-50">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all" className="text-xs">
              {language === 'he' ? 'הכל' : 'All'}
            </TabsTrigger>
            <TabsTrigger value="unread" className="text-xs">
              {language === 'he' ? 'לא נקראו' : 'Unread'}
              {threads.filter(t => t.unreadCount > 0).length > 0 && (
                <span className="ms-2 px-1.5 py-0.5 bg-yellow-500 text-black text-[10px] rounded-full font-bold">
                  {threads.filter(t => t.unreadCount > 0).length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredThreads.map((thread) => (
          <div
            key={thread.id}
            onClick={() => onSelectThread(thread.id)}
            className={`
              p-4 border-b cursor-pointer transition-colors
              ${selectedThreadId === thread.id ? 'bg-yellow-50 border-s-4 border-s-yellow-500' : 'hover:bg-gray-50'}
              ${thread.unreadCount > 0 ? 'bg-white' : 'bg-gray-50/30'}
            `}
          >
            <div className="flex justify-between items-start mb-1">
              <h3 className={`text-sm truncate max-w-[70%] ${thread.unreadCount > 0 ? 'font-bold text-black' : 'font-medium text-gray-700'}`}>
                {getThreadTitle(thread)}
              </h3>
              <span className="text-[10px] text-gray-400 whitespace-nowrap">
                {formatTime(thread.lastMessage.created_at)}
              </span>
            </div>
            
            <div className="flex justify-between items-end">
              <p className={`text-xs truncate max-w-[85%] ${thread.unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                {thread.lastMessage.content}
              </p>
              {thread.unreadCount > 0 && (
                <Badge className="bg-yellow-500 text-black border-none h-5 min-w-[20px] flex items-center justify-center text-[10px] px-1 font-bold">
                  {thread.unreadCount}
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MessageList;
