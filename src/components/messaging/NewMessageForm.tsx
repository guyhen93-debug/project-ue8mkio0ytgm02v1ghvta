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
import { Send, X, Package } from 'lucide-react';
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
  const { language, isRTL } = useLanguage();

  const t = {
    he: {
      newMessage: 'הודעה חדשה',
      subject: 'נושא השיחה',
      message: 'תוכן ההודעה',
      relatedOrder: 'שיוך להזמנה (אופציונלי)',
      selectOrder: 'בחר הזמנה...',
      send: 'שלח הודעה',
      cancel: 'ביטול',
      sending: 'שולח...',
      messageSent: 'ההודעה נשלחה',
      messageSentSuccess: 'ההודעה נשלחה בהצלחה',
      error: 'שגיאה',
      sendFailed: 'שליחת ההודעה נכשלה',
      fillAllFields: 'אנא מלא את כל השדות הדרושים'
    },
    en: {
      newMessage: 'New Message',
      subject: 'Subject',
      message: 'Message Content',
      relatedOrder: 'Related Order (Optional)',
      selectOrder: 'Select order...',
      send: 'Send Message',
      cancel: 'Cancel',
      sending: 'Sending...',
      messageSent: 'Message Sent',
      messageSentSuccess: 'Message sent successfully',
      error: 'Error',
      sendFailed: 'Failed to send message',
      fillAllFields: 'Please fill all required fields'
    }
  }[language];

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
      const threadId = `thread_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      
      await Message.create({
        sender_email: user.email,
        recipient_email: recipientEmail,
        subject: subject.trim(),
        content: content.trim(),
        is_read: false,
        thread_id: threadId,
        order_id: orderId || undefined,
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
    <Card className="shadow-md border-none">
      <CardHeader className="bg-gray-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold">{t.newMessage}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <RecipientSelector
              value={recipientEmail}
              onChange={setRecipientEmail}
            />

            <div className="space-y-2">
              <Label className="text-sm font-semibold">{t.relatedOrder}</Label>
              <div className="relative">
                <Select value={orderId} onValueChange={setOrderId}>
                  <SelectTrigger className="bg-white">
                    <Package className="h-4 w-4 me-2 text-gray-400" />
                    <SelectValue placeholder={t.selectOrder} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t.selectOrder}</SelectItem>
                    {orders.map((order) => (
                      <SelectItem key={order.id} value={order.id}>
                        {language === 'he' ? 'הזמנה' : 'Order'} #{order.order_number || order.id.substring(0, 8)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">{t.subject}</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t.subject}
              className="bg-white"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">{t.message}</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t.message}
              rows={8}
              className="resize-none bg-white"
              required
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="px-8"
            >
              {t.cancel}
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 shadow-sm"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin me-2" />
              ) : (
                <Send className="h-4 w-4 me-2" />
              )}
              {isLoading ? t.sending : t.send}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default NewMessageForm;
