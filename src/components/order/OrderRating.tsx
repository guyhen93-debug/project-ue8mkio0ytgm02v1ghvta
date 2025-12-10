import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Order, Notification, User } from '@/entities';
import { useLanguage } from '@/contexts/LanguageContext';
import { Star, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface OrderRatingProps {
    order: any;
    onRate?: () => void;
}

const OrderRating: React.FC<OrderRatingProps> = ({ order, onRate }) => {
    const { language } = useLanguage();
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);

    const translations = {
        he: {
            rateService: 'דרג את השירות',
            howWasService: 'איך היה השירות?',
            selectStars: 'לחץ על כוכב לבחירה',
            addComment: 'הערה (אופציונלי)',
            commentPlaceholder: 'ספר לנו על החוויה שלך...',
            submitRating: 'שלח דירוג',
            submitting: 'שולח...',
            yourRating: 'הדירוג שלך',
            ratedOn: 'דורג ב',
            ratingSuccess: 'הדירוג נשמר בהצלחה',
            ratingError: 'שגיאה בשמירת דירוג',
            selectRating: 'נא לבחור דירוג',
            waitingConfirmation: 'ממתין לאישור קבלה',
            confirmFirst: 'יש לאשר קבלת הסחורה לפני דירוג',
            stars: 'כוכבים'
        },
        en: {
            rateService: 'Rate the Service',
            howWasService: 'How was the service?',
            selectStars: 'Click on a star to select',
            addComment: 'Comment (optional)',
            commentPlaceholder: 'Tell us about your experience...',
            submitRating: 'Submit Rating',
            submitting: 'Submitting...',
            yourRating: 'Your Rating',
            ratedOn: 'Rated on',
            ratingSuccess: 'Rating saved successfully',
            ratingError: 'Error saving rating',
            selectRating: 'Please select a rating',
            waitingConfirmation: 'Waiting for confirmation',
            confirmFirst: 'Please confirm receipt before rating',
            stars: 'stars'
        }
    };

    const t = translations[language];
    const isRTL = language === 'he';

    const createRatingNotifications = async (orderNumber: string, ratingValue: number) => {
        try {
            const message = `הלקוח דירג הזמנה #${orderNumber} - ${ratingValue} כוכבים`;

            // Get all managers
            const allUsers = await User.list('-created_at', 1000);
            const managers = allUsers.filter(u => u.role === 'manager');

            // Create notifications for all managers
            const notifications = managers.map(manager =>
                Notification.create({
                    recipient_email: manager.email,
                    type: 'order_rated',
                    message: message,
                    is_read: false,
                    order_id: orderNumber
                })
            );

            await Promise.all(notifications);
            console.log('Rating notifications created successfully');
        } catch (error) {
            console.error('Error creating rating notifications:', error);
        }
    };

    const handleSubmit = async () => {
        if (rating === 0) {
            toast({
                title: t.selectRating,
                variant: 'destructive'
            });
            return;
        }

        try {
            setLoading(true);

            // Update order with rating
            await Order.update(order.id, {
                rating: rating,
                rating_comment: comment.trim(),
                rated_at: new Date().toISOString()
            });

            // Create notifications for managers
            await createRatingNotifications(order.order_number, rating);

            toast({
                title: t.ratingSuccess,
                className: 'bg-green-50 border-green-200'
            });

            if (onRate) {
                onRate();
            }
        } catch (error) {
            console.error('Error saving rating:', error);
            toast({
                title: t.ratingError,
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

    // Don't show if client hasn't confirmed
    if (!order.is_client_confirmed) {
        return (
            <Card className="bg-gray-50 border-gray-200">
                <CardContent className="p-4">
                    <div className="flex items-center gap-3" dir={isRTL ? 'rtl' : 'ltr'}>
                        <Star className="w-5 h-5 text-gray-400" />
                        <p className="text-sm text-gray-600">{t.confirmFirst}</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Show existing rating
    if (order.rating) {
        return (
            <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                    <div className="space-y-2" dir={isRTL ? 'rtl' : 'ltr'}>
                        <Label className="text-blue-900 font-semibold">{t.yourRating}</Label>
                        <div className="flex items-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    className={`w-6 h-6 ${
                                        star <= order.rating
                                            ? 'fill-yellow-400 text-yellow-400'
                                            : 'text-gray-300'
                                    }`}
                                />
                            ))}
                            <span className="text-sm font-medium text-blue-900">
                                ({order.rating}/5)
                            </span>
                        </div>
                        {order.rating_comment && (
                            <div className="pt-2 border-t border-blue-200">
                                <p className="text-sm text-blue-800">"{order.rating_comment}"</p>
                            </div>
                        )}
                        <p className="text-xs text-blue-700">
                            {t.ratedOn} {formatDate(order.rated_at)}
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Show rating form
    return (
        <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-4">
                <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
                    <div>
                        <Label className="text-purple-900 font-semibold text-base">{t.rateService}</Label>
                        <p className="text-sm text-purple-700 mt-1">{t.howWasService}</p>
                    </div>

                    {/* Star Rating */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    className="focus:outline-none transition-transform hover:scale-110"
                                >
                                    <Star
                                        className={`w-8 h-8 ${
                                            star <= (hoverRating || rating)
                                                ? 'fill-yellow-400 text-yellow-400'
                                                : 'text-gray-300'
                                        }`}
                                    />
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-purple-600">{t.selectStars}</p>
                    </div>

                    {/* Comment */}
                    <div className="space-y-2">
                        <Label htmlFor="rating-comment" className="text-sm text-purple-800">
                            {t.addComment}
                        </Label>
                        <Textarea
                            id="rating-comment"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder={t.commentPlaceholder}
                            rows={3}
                            className="resize-none"
                        />
                    </div>

                    {/* Submit Button */}
                    <Button
                        onClick={handleSubmit}
                        disabled={loading || rating === 0}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    >
                        {loading ? (
                            <>
                                <Loader2 className={`w-4 h-4 animate-spin ${isRTL ? 'ml-2' : 'mr-2'}`} />
                                {t.submitting}
                            </>
                        ) : (
                            <>
                                <Star className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                                {t.submitRating}
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default OrderRating;