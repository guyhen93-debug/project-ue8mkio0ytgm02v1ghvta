import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Message, User } from '@/entities';
import { toast } from '@/hooks/use-toast';
import { Send, X, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NewMessageFormProps {
  onSent: () => void;
  onCancel: () => void;
  recipientEmail?: string;
}

const NewMessageForm: React.FC<NewMessageFormProps> = ({ 
  onSent, 
  onCancel, 
  recipientEmail 
}) => {
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState(recipientEmail || '');
  const [recipients, setRecipients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();

  useEffect(() => {
    loadRecipients();
  }, [user]);

  const loadRecipients = async () => {
    if (!user) return;
    
    try {
      setLoadingRecipients(true);
      
      if (user.role === 'manager') {
        // Managers can send to all clients
        const clients = await User.filter({ role: 'client' });
        setRecipients(clients);
      } else {
        // Clients can send to managers
        const managers = await User.filter({ role: 'manager' });
        setRecipients(managers);
      }
    } catch (error) {
      console.error('Error loading recipients:', error);
      toast({
        title: t('error'),
        description: 'Failed to load recipients',
        variant: 'destructive'
      });
    } finally {
      setLoadingRecipients(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject.trim() || !content.trim() || !selectedRecipient || !user) {
      toast({
        title: t('error'),
        description: isRTL ? 'אנא מלא את כל השדות' : 'Please fill all fields',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const threadId = `thread-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      await Message.create({
        sender_email: user.email,
        recipient_email: selectedRecipient,
        subject: subject.trim(),
        content: content.trim(),
        is_read: false,
        thread_id: threadId
      });

      toast({
        title: t('message_sent') || 'Message Sent',
        description: isRTL ? 'ההודעה נשלחה בהצלחה' : 'Message sent successfully'
      });

      // Reset form
      setSubject('');
      setContent('');
      setSelectedRecipient(recipientEmail || '');
      
      onSent();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: t('error'),
        description: isRTL ? 'שליחת ההודעה נכשלה' : 'Failed to send message',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-2 sm:px-0">
      <Card className="w-full">
        <CardHeader className="pb-3 sm:pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className={cn(
              "flex items-center gap-2 text-lg sm:text-xl",
              isRTL ? "flex-row-reverse" : "flex-row"
            )}>
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              {isRTL ? 'הודעה חדשה' : 'New Message'}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="h-8 w-8 p-0 shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-3 sm:p-6 pt-0">
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            {/* Recipient Selection */}
            <div className="space-y-2">
              <label className={cn(
                "text-sm font-medium text-gray-700 block",
                isRTL ? "text-right" : "text-left"
              )}>
                {isRTL ? 'נמען:' : 'To:'}
              </label>
              <Select 
                value={selectedRecipient} 
                onValueChange={setSelectedRecipient}
                disabled={loadingRecipients || !!recipientEmail}
              >
                <SelectTrigger className={cn(
                  "w-full",
                  isRTL ? "text-right" : "text-left"
                )}>
                  <SelectValue placeholder={
                    loadingRecipients 
                      ? (isRTL ? 'טוען...' : 'Loading...') 
                      : (isRTL ? 'בחר נמען' : 'Select recipient')
                  } />
                </SelectTrigger>
                <SelectContent>
                  {recipients.map((recipient) => (
                    <SelectItem key={recipient.id} value={recipient.email}>
                      <div className={cn(
                        "flex items-center gap-2 w-full",
                        isRTL ? "flex-row-reverse" : "flex-row"
                      )}>
                        <Users className="w-4 h-4 shrink-0" />
                        <span className="truncate flex-1">
                          {recipient.full_name || recipient.email}
                        </span>
                        {recipient.role === 'manager' && (
                          <span className="text-xs text-blue-600 shrink-0">
                            ({isRTL ? 'מנהל' : 'Manager'})
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <label className={cn(
                "text-sm font-medium text-gray-700 block",
                isRTL ? "text-right" : "text-left"
              )}>
                {isRTL ? 'נושא:' : 'Subject:'}
              </label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={isRTL ? 'הכנס נושא ההודעה' : 'Enter message subject'}
                className={cn(
                  "w-full",
                  isRTL ? "text-right" : "text-left"
                )}
                dir={isRTL ? 'rtl' : 'ltr'}
                required
              />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <label className={cn(
                "text-sm font-medium text-gray-700 block",
                isRTL ? "text-right" : "text-left"
              )}>
                {isRTL ? 'תוכן ההודעה:' : 'Message:'}
              </label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={isRTL ? 'כתוב את ההודעה שלך כאן...' : 'Write your message here...'}
                rows={4}
                className={cn(
                  "resize-none w-full min-h-[100px] sm:min-h-[120px]",
                  isRTL ? "text-right" : "text-left"
                )}
                dir={isRTL ? 'rtl' : 'ltr'}
                required
              />
            </div>

            {/* Actions */}
            <div className={cn(
              "flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 sm:pt-4",
              isRTL ? "sm:flex-row-reverse" : "sm:flex-row"
            )}>
              <Button
                type="submit"
                disabled={!subject.trim() || !content.trim() || !selectedRecipient || isLoading}
                className="bg-blue-600 hover:bg-blue-700 w-full sm:flex-1 order-2 sm:order-1"
              >
                <Send className="w-4 h-4 mr-2" />
                {isLoading ? (isRTL ? 'שולח...' : 'Sending...') : (isRTL ? 'שלח הודעה' : 'Send Message')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
                className="w-full sm:flex-1 order-1 sm:order-2"
              >
                {t('cancel')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewMessageForm;