import React, { useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { he, enUS } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { User, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface MessageThreadProps {
  messages: any[];
  currentUserEmail: string;
  orderId?: string;
}

const MessageThread: React.FC<MessageThreadProps> = ({ messages, currentUserEmail, orderId }) => {
  const { language, isRTL } = useLanguage();
  const { isManager } = useAuth();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const locale = language === 'he' ? he : enUS;
    return format(date, 'HH:mm', { locale });
  };

  const handleOpenOrder = () => {
    if (!orderId) return;
    const path = isManager ? `/orders?order=${orderId}` : `/order-history?order=${orderId}`;
    navigate(path);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Thread Header */}
      <div className="p-4 bg-white border-b flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-sm font-bold text-gray-900">
            {messages[0]?.subject || (orderId ? `Order #${orderId}` : 'No Subject')}
          </h2>
          {orderId && (
            <p className="text-xs text-gray-500">
              {language === 'he' ? `קשור להזמנה #${orderId}` : `Related to order #${orderId}`}
            </p>
          )}
        </div>
        {orderId && (
          <Button variant="outline" size="sm" onClick={handleOpenOrder} className="gap-2 h-8 text-xs">
            <ExternalLink className="h-3 w-3" />
            {language === 'he' ? 'פתח הזמנה' : 'Open Order'}
          </Button>
        )}
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50"
      >
        {messages.map((msg, index) => {
          const isOwn = msg.sender_email === currentUserEmail;
          const showDate = index === 0 || 
            new Date(msg.created_at).toDateString() !== new Date(messages[index-1].created_at).toDateString();

          return (
            <React.Fragment key={msg.id}>
              {showDate && (
                <div className="flex justify-center my-4">
                  <span className="bg-gray-200 text-gray-500 text-[10px] px-2 py-0.5 rounded-full uppercase">
                    {format(new Date(msg.created_at), 'dd/MM/yyyy')}
                  </span>
                </div>
              )}
              
              <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`
                  max-w-[85%] md:max-w-[70%] rounded-2xl p-3 shadow-sm
                  ${isOwn 
                    ? 'bg-yellow-500 text-black rounded-tr-none' 
                    : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'}
                `}>
                  {!isOwn && (
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-[10px] font-bold text-gray-500 uppercase">
                        {msg.sender_email.split('@')[0]}
                      </span>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {msg.content}
                  </p>
                  <div className={`text-[9px] mt-1 flex ${isOwn ? 'justify-start' : 'justify-end'} opacity-60`}>
                    {formatMessageTime(msg.created_at)}
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default MessageThread;
