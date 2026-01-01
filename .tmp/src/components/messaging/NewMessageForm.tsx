import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Message, Order } from '@/entities';
import { toast } from '@/hooks/use-toast';
import { Send, X } from 'lucide-react';
import RecipientSelector from './RecipientSelector';

interface NewMessageFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialRecipientEmail?: string;
  initialSubject?: string;
  initialOrderId?: string;
}

const NewMessageForm: React.FC<NewMessageFormProps> = ({ 
  onSuccess, 
  onCancel,
  initialRecipientEmail = '',
  initialSubject = '',
  initialOrderId = ''
}) => {
  const [recipientEmail, setRecipientEmail] = useState(initialRecipientEmail);
  const [subject, setSubject] = useState(initialSubject);
  const [content, setContent] = useState('');
  const [orderId, setOrderId] = useState(initialOrderId);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { language } = useLanguage();

  const translations = {
    he: {
      newMessage: 'הודעה חדשה',
      subject: 'נושא',
      message: 'תוכן ההודעה',
      relatedOrder: 'הזמנה קשורה (אופציונלי)',
      selectOrder: 'בחר הזמנה',
      send: 'שלח',
      cancel: 'ביטול',
      sending: 'שולח...',
      messageSent: 'ההודעה נשלחה',
      messageSentSuccess: 'ההודעה נשלחה בהצלחה',
      error: 'שגיאה',
      sendFailed: 'שליחת ההודעה נכשלה',
      fillAllFields: 'אנא מלא את כל השדות'
    },
    en: {
      newMessage: 'New Message',
      subject: 'Subject',
      message: 'Message Content',
      relatedOrder: 'Related Order (Optional)',
      selectOrder: 'Select Order',
      send: 'Send',
      cancel: 'Cancel',
      sending: 'Sending...',
      messageSent: 'Message Sent',
      messageSentSuccess: 'Message sent successfully',
      error: 'Error',
      sendFailed: 'Failed to send message',
      fillAllFields: 'Please fill all required fields'
    }
  };

  const t = translations[language];
  const isRTL = language === 'he';

  useEffect(() => {
    loadOrders();
  }, [user]);

  const loadOrders = async () => {
    try {
      const userOrders = await Order.filter(
        { created_by: user?.email },
        '-created_at',
        50
      );
      setOrders(userOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recipientEmail || !subject.trim() || !content.trim()) {
      toast({
        title: t.error,
        description: t.fillAllFields,
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const threadId = `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await Message.create({
        sender_email: user.email,
        recipient_email: recipientEmail,
        subject: subject.trim(),
        content: content.trim(),
        is_read: false,
        thread_id: threadId,
        order_id: orderId || undefined,
        parent_message_id: undefined
      });

      toast({
        title: t.messageSent,
        description: t.messageSentSuccess
      });

      onSuccess();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: t.error,
        description: t.sendFailed,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t.newMessage}</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
          <RecipientSelector
            value={recipientEmail}
            onChange={setRecipientEmail}
          />

          <div className="space-y-2">
            <Label>{t.subject}</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t.subject}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>{t.relatedOrder}</Label>
            <Select value={orderId} onValueChange={setOrderId}>
              <SelectTrigger>
                <SelectValue placeholder={t.selectOrder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">{t.selectOrder}</SelectItem>
                {orders.map((order) => (
                  <SelectItem key={order.id} value={order.id}>
                    {language === 'he' ? 'הזמנה' : 'Order'} #{order.order_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t.message}</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t.message}
              rows={6}
              className="resize-none"
              required
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              {t.cancel}
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              <Send className="w-4 h-4 mr-2" />
              {isLoading ? t.sending : t.send}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default NewMessageForm;