import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Order, Notification, User } from '@/entities';
import { useLanguage } from '@/contexts/LanguageContext';
import { CheckCircle, Clock, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface OrderConfirmationProps {
    order: any;
    onConfirm?: () => void;
}

const OrderConfirmation: React.FC<OrderConfirmationProps> = ({ order, onConfirm }) => {
    const { language } = useLanguage();
    const [loading, setLoading] = useState(false);

    const translations = {
        he: {
            waitingDelivery: 'ממתין לאספקה',
            deliveryCompleted: 'האספקה הושלמה - אשר קבלה',
            confirmReceipt: 'אשר קבלת סחורה',
            confirmed: 'אושר קבלה',
            confirmedAt: 'אושר ב',
            confirming: 'מאשר...',
            confirmSuccess: 'קבלת הסחורה אושרה בהצלחה',
            confirmError: 'שגיאה באישור קבלה'
        },
        en: {
            waitingDelivery: 'Waiting for delivery',
            deliveryCompleted: 'Delivery completed - Confirm receipt',
            confirmReceipt: 'Confirm receipt of goods',
            confirmed: 'Receipt confirmed',
            confirmedAt: 'Confirmed at',
            confirming: 'Confirming...',
            confirmSuccess: 'Receipt confirmed successfully',
            confirmError: 'Error confirming receipt'
        }
    };

    const t = translations[language];
    const isRTL = language === 'he';

    const createConfirmationNotifications = async (orderNumber: string) => {
        try {
            const message = `הלקוח אישר קבלת הזמנה #${orderNumber}`;

            // Get all managers
            const allUsers = await User.list('-created_at', 1000);
            const managers = allUsers.filter(u => u.role === 'manager');

            // Create notifications for all managers
            const notifications = managers.map(manager =>
                Notification.create({
                    recipient_email: manager.email,
                    type: 'order_client_confirmed',
                    message: message,
                    is_read: false,
                    order_id: orderNumber
                })
            );

            await Promise.all(notifications);
            console.log('Client confirmation notifications created successfully');
        } catch (error) {
            console.error('Error creating confirmation notifications:', error);
        }
    };

    const handleConfirm = async () => {
        try {
            setLoading(true);

            // Update order with confirmation
            await Order.update(order.id, {
                is_client_confirmed: true,
                client_confirmed_at: new Date().toISOString()
            });

            // Create notifications for managers
            await createConfirmationNotifications(order.order_number);

            toast({
                title: t.confirmSuccess,
                className: 'bg-green-50 border-green-200'
            });

            if (onConfirm) {
                onConfirm();
            }
        } catch (error) {
            console.error('Error confirming receipt:', error);
            toast({
                title: t.confirmError,
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Don't show anything if order is not delivered
    if (!order.is_delivered) {
        return (
            <Card className="bg-gray-50 border-gray-200">
                <CardContent className="p-4">
                    <div className="flex items-center gap-3" dir={isRTL ? 'rtl' : 'ltr'}>
                        <Clock className="w-5 h-5 text-gray-400" />
                        <p className="text-sm text-gray-600">{t.waitingDelivery}</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Show confirmation status if already confirmed
    if (order.is_client_confirmed) {
        return (
            <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                    <div className="flex items-center gap-3" dir={isRTL ? 'rtl' : 'ltr'}>
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <div className="flex-1">
                            <p className="font-medium text-green-900">{t.confirmed}</p>
                            <p className="text-sm text-green-700">
                                {t.confirmedAt} {formatDate(order.client_confirmed_at)}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Show confirmation button
    return (
        <Card className="bg-yellow-50 border-yellow-300">
            <CardContent className="p-4">
                <div className="space-y-3" dir={isRTL ? 'rtl' : 'ltr'}>
                    <p className="font-medium text-yellow-900">{t.deliveryCompleted}</p>
                    <Button
                        onClick={handleConfirm}
                        disabled={loading}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                        {loading ? (
                            <>
                                <Loader2 className={`w-4 h-4 animate-spin ${isRTL ? 'ml-2' : 'mr-2'}`} />
                                {t.confirming}
                            </>
                        ) : (
                            <>
                                <CheckCircle className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                                {t.confirmReceipt}
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default OrderConfirmation;