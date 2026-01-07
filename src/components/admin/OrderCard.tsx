import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
    Package, MapPin, Calendar, Sunrise, Sunset, Truck, FileText, 
    Edit, Trash2, Building2, Factory, Star, CheckCircle, Clock, 
    MessageSquare, Box, Scale, User, ChevronDown, ChevronUp 
} from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { getProductName, getSiteName, getClientName as resolveClientName, getSupplierName, getStatusConfig } from '@/lib/orderUtils';
import { cn } from '@/lib/utils';

const getAvailableActions = (status: string) => {
    const base = {
        approve: false,
        reject: false,
        updateDelivery: false,
        returnToPending: false,
        sendMessage: false,
        edit: false,
        delete: false,
        duplicate: false,
        viewDetails: true,
    };

    switch (status) {
        case 'pending':
            return { ...base, approve: true, reject: true, sendMessage: true, edit: true, delete: true };
        case 'approved':
            return { ...base, updateDelivery: true, returnToPending: true, sendMessage: true, edit: true };
        case 'in_transit':
            return { ...base, updateDelivery: true, sendMessage: true };
        case 'completed':
            return { ...base, duplicate: true };
        case 'rejected':
            return { ...base, returnToPending: true };
        default:
            return base;
    }
};

interface OrderCardProps {
    order: any;
    products: Record<string, any>;
    sites: Record<string, any>;
    clients: Record<Record<string, any>, any> | any;
    language: string;
    translations: any;
    onEdit: (order: any) => void;
    onDelete: (orderId: string) => void;
    onStatusChange: (orderId: string, newStatus: string) => void;
    onUpdateDelivery?: (order: any) => void;
    onSendMessage?: (order: any) => void;
    onDuplicate?: (order: any) => void;
    showReminder?: boolean;
}

export const OrderCard: React.FC<OrderCardProps> = ({
    order,
    products,
    sites,
    clients,
    language,
    translations: t,
    onEdit,
    onDelete,
    onStatusChange,
    onUpdateDelivery,
    onSendMessage,
    onDuplicate,
    showReminder = false,
}) => {
    const [showDetails, setShowDetails] = useState(false);
    const [showActions, setShowActions] = useState(false);
    
    const isRTL = language === 'he';
    const TimeIcon = order.delivery_window === 'morning' ? Sunrise : Sunset;
    const effectiveStatus = (order.status === 'completed' || order.is_delivered)
        ? 'completed'
        : order.status;
    const statusConfig = getStatusConfig(effectiveStatus, language);
    const actions = getAvailableActions(effectiveStatus);

    const clientName = resolveClientName(order, sites, clients);
    const siteName = getSiteName(order.site_id, sites);
    const productName = getProductName(order.product_id, products, language);
    const quantity = order.quantity_tons;
    const deliveryDate = order.delivery_date;

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString;
            return format(date, 'dd/MM/yyyy', { locale: language === 'he' ? he : undefined });
        } catch (e) {
            return dateString || '';
        }
    };

    return (
        <Card 
            className="industrial-card hover:border-yellow-300 transition-colors cursor-pointer overflow-hidden" 
            onClick={() => onEdit(order)}
        >
            <CardContent className="p-3 sm:p-4">
                <div className="space-y-3">
                    {/* Row 1: order number + status */}
                    <div className="flex items-center justify-between">
                        <div className="font-bold text-gray-900 text-base">
                            #{order.order_number || order.id?.slice(-6)}
                        </div>
                        <span className={cn(
                            'px-2 py-1 rounded text-xs font-bold',
                            statusConfig.className,
                        )}
                        >
                            {statusConfig.label}
                        </span>
                    </div>

                    {/* Row 2: client */}
                    <div className="text-sm font-semibold text-gray-800">
                        {clientName}
                    </div>

                    {/* Row 3: order details */}
                    <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm text-gray-600">
                        <div className="flex items-center gap-1.5 min-w-0">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                            <span className="truncate">{siteName}</span>
                        </div>
                        <div className="flex items-center gap-1.5 min-w-0">
                            <Box className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                            <span className="truncate">{productName}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Scale className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                            <span>{quantity} {language === 'he' ? 'טון' : 'tons'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                            <span>{formatDate(deliveryDate)}</span>
                        </div>
                    </div>

                    {/* Expand/Collapse Controls */}
                    <div className="flex gap-2 pt-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-8 text-[11px] font-medium"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowDetails(!showDetails);
                            }}
                        >
                            {showDetails
                                ? (language === 'he' ? 'הסתר פרטים ▲' : 'Hide details ▲')
                                : (language === 'he' ? 'פרטים נוספים ▼' : 'More details ▼')}
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-8 text-[11px] font-medium"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowActions(!showActions);
                            }}
                        >
                            {showActions
                                ? (language === 'he' ? 'הסתר כפתורים ▲' : 'Hide actions ▲')
                                : (language === 'he' ? 'כפתורי עריכה ▼' : 'Edit actions ▼')}
                        </Button>
                    </div>

                    {/* Expandable: Details */}
                    {showDetails && (
                        <div className="mt-3 pt-3 border-t space-y-2 text-[13px] text-gray-700 fade-in">
                            {(() => {
                                const site = sites[order.site_id];
                                const contactName = order.site_contact || site?.contact_name;
                                const contactPhone = order.site_phone || site?.contact_phone;
                                if (!contactName && !contactPhone) return null;
                                return (
                                    <div className="flex items-center gap-2">
                                        <User className="w-3.5 h-3.5 text-gray-400" />
                                        <span className="font-medium text-gray-500">{language === 'he' ? 'איש קשר:' : 'Contact:'}</span>
                                        <span className="text-gray-900 font-medium">{contactName}</span>
                                        {contactPhone && (
                                            <span className="text-blue-600 font-medium">{contactPhone}</span>
                                        )}
                                    </div>
                                );
                            })()}

                            {order.notes && (
                                <div className="flex items-start gap-2">
                                    <FileText className="w-3.5 h-3.5 text-gray-400 mt-0.5" />
                                    <div>
                                        <div className="font-medium text-gray-500">{language === 'he' ? 'הערות:' : 'Notes:'}</div>
                                        <div className="text-gray-700 whitespace-pre-wrap leading-tight">{order.notes}</div>
                                    </div>
                                </div>
                            )}

                            {order.delivery_note_number && (
                                <div className="flex items-center gap-2">
                                    <Truck className="w-3.5 h-3.5 text-gray-400" />
                                    <span className="font-medium text-gray-500">{language === 'he' ? 'תעודת משלוח:' : 'Delivery note:'}</span>
                                    <span className="text-gray-900 font-medium">{order.delivery_note_number}</span>
                                </div>
                            )}

                            {order.driver_name && (
                                <div className="flex items-center gap-2">
                                    <User className="w-3.5 h-3.5 text-gray-400" />
                                    <span className="font-medium text-gray-500">{language === 'he' ? 'נהג:' : 'Driver:'}</span>
                                    <span className="text-gray-900 font-medium">{order.driver_name}</span>
                                </div>
                            )}
                            
                            {order.delivery_notes && (
                                <div className="flex items-start gap-2">
                                    <FileText className="w-3.5 h-3.5 text-gray-400 mt-0.5" />
                                    <div>
                                        <div className="font-medium text-gray-500">{language === 'he' ? 'הערות אספקה:' : 'Delivery notes:'}</div>
                                        <div className="text-gray-700 whitespace-pre-wrap leading-tight">{order.delivery_notes}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Expandable: Actions */}
                    {showActions && (
                        <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-2 fade-in">
                            {actions.approve && (
                                <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 text-white h-9 text-xs"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onStatusChange(order.id, 'approved');
                                    }}
                                >
                                    {language === 'he' ? 'אשר' : 'Approve'}
                                </Button>
                            )}

                            {actions.reject && (
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    className="h-9 text-xs"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onStatusChange(order.id, 'rejected');
                                    }}
                                >
                                    {language === 'he' ? 'דחה' : 'Reject'}
                                </Button>
                            )}

                            {actions.returnToPending && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-9 text-xs"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onStatusChange(order.id, 'pending');
                                    }}
                                >
                                    {language === 'he' ? 'החזר לממתין' : 'Back to pending'}
                                </Button>
                            )}

                            {actions.updateDelivery && onUpdateDelivery && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-9 text-xs"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onUpdateDelivery(order);
                                    }}
                                >
                                    {language === 'he' ? 'עדכן אספקה' : 'Update delivery'}
                                </Button>
                            )}

                            {actions.sendMessage && onSendMessage && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-9 text-xs"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSendMessage(order);
                                    }}
                                >
                                    {language === 'he' ? 'שלח הודעה' : 'Send message'}
                                </Button>
                            )}

                            {actions.duplicate && onDuplicate && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-9 text-xs"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDuplicate(order);
                                    }}
                                >
                                    {language === 'he' ? 'שכפל הזמנה' : 'Duplicate order'}
                                </Button>
                            )}

                            {actions.delete && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-600 border-red-200 hover:bg-red-50 h-9 text-xs"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(order.id);
                                    }}
                                >
                                    {language === 'he' ? 'מחק' : 'Delete'}
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
