import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { Send, Loader2 } from 'lucide-react';

interface MessageReplyFormProps {
  onSend: (content: string) => Promise<void>;
  isLoading: boolean;
}

const MessageReplyForm: React.FC<MessageReplyFormProps> = ({ onSend, isLoading }) => {
  const [content, setContent] = useState('');
  const { language, isRTL } = useLanguage();

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!content.trim() || isLoading) return;

    await onSend(content.trim());
    setContent('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmit();
    }
  };

  const t = {
    he: {
      placeholder: 'כתוב תגובה... (Ctrl+Enter לשליחה)',
      send: 'שלח'
    },
    en: {
      placeholder: 'Type a reply... (Ctrl+Enter to send)',
      send: 'Send'
    }
  }[language];

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 items-end">
      <div className="flex-1">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t.placeholder}
          rows={1}
          className="min-h-[44px] max-h-[150px] resize-none py-3 bg-gray-50 focus:bg-white border-none shadow-none focus-visible:ring-1 focus-visible:ring-yellow-500"
          dir={isRTL ? 'rtl' : 'ltr'}
        />
      </div>
      <Button
        type="submit"
        disabled={!content.trim() || isLoading}
        className="h-11 w-11 p-0 shrink-0 bg-yellow-500 hover:bg-yellow-600 text-black rounded-full shadow-sm"
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Send className={`h-5 w-5 ${isRTL ? 'rotate-180' : ''}`} />
        )}
      </Button>
    </form>
  );
};

export default MessageReplyForm;
