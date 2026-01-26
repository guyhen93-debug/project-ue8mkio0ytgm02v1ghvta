import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
    Package, MapPin, Calendar, Sunrise, Sunset, Truck, FileText, 
    Edit, Trash2, Building2, Factory, Star, CheckCircle, Clock, 
    MessageSquare, Box, Scale, User, ChevronDown, ChevronUp, Globe2,
    Plus, X
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
    clients: Record<string, any> | any;
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
    const effectiveStatus = (order.status === 'completed' || order.is_delivered ||
        (order.delivered_quantity_tons && order.quantity_tons && order.delivered_quantity_tons >= order.quantity_tons))
        ? 'completed'
        : order.status;
    const statusConfig = getStatusConfig(effectiveStatus, language);
    const actions = getAvailableActions(effectiveStatus);

    const showDuplicateForApproved = (
        order.status === 'approved' &&
        (!order.is_delivered ||
            (order.delivered_quantity_tons && order.quantity_tons && order.delivered_quantity_tons < order.quantity_tons))
    );

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
            className={cn(
                "industrial-card hover:border-yellow-300 transition-all cursor-pointer overflow-hidden border-l-4",
                effectiveStatus === 'pending' ? "border-l-yellow-400" : 
                effectiveStatus === 'approved' ? "border-l-green-500" :
                effectiveStatus === 'in_transit' ? "border-l-blue-400" :
                effectiveStatus === 'completed' ? "border-l-blue-600" : "border-l-gray-300"
            )}
            onClick={() => onEdit(order)}
        >
            <CardContent className="p-2 sm:p-3">
                <div className="space-y-2">
                    {/* Row 1: order number + status */}
                    <div className="flex items-center justify-between">
                        <div className="font-bold text-gray-900 text-sm sm:text-base">
                            #{order.order_number || order.id?.slice(-6)}
                            {showReminder && <span className="ml-1 text-red-500">⏰</span>}
                        </div>
                        <span className={cn(
                            'px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold uppercase tracking-wider',
                            statusConfig.className,
                        )}
                        >
                            {statusConfig.label}
                        </span>
                    </div>

                    {/* Row 2: client */}
                    <div className="text-sm font-bold text-gray-800 leading-tight">
                        {clientName}
                    </div>

                    {/* Row 3: order details */}
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] sm:text-sm text-gray-600">
                        <div className="flex items-center gap-1.5 min-w-0">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                            <span className="truncate font-medium">{siteName}</span>
                        </div>
                        <div className="flex items-center gap-1.5 min-w-0">
                            <Box className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                            <span className="truncate font-medium">{productName}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Scale className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                            <span className="font-bold text-gray-900">{quantity} {language === 'he' ? 'טון' : 'tons'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                            <span className="font-medium">{formatDate(deliveryDate)}</span>
                        </div>
                    </div>

                    {/* Row 4: operational details (Metadata) */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] sm:text-xs text-gray-400 mt-1 pt-1 border-t border-gray-50">
                        {(() => {
                            const site = sites[order.site_id];
                            const regionType = site?.region_type;
                            if (!regionType) return null;
                            return (
                                <div className="flex items-center gap-1">
                                    <Globe2 className="w-3 h-3 text-blue-400" />
                                    <span>{regionType === 'eilat' ? (language === 'he' ? 'אילת' : 'Eilat') : (language === 'he' ? 'מחוץ לאילת' : 'Outside Eilat')}</span>
                                </div>
                            );
                        })()}

                        <div className="flex items-center gap-1">
                            <span className="text-gray-200">•</span>
                            <Factory className="w-3 h-3" />
                            <span>
                                {order.supplier === 'shifuli_har'
                                    ? (language === 'he' ? 'שיפולי הר' : 'Shifuli Har')
                                    : (language === 'he' ? 'מעבר רבין' : 'Maavar Rabin')}
                            </span>
                        </div>

                        <div className="flex items-center gap-1">
                            <span className="text-gray-200">•</span>
                            <Clock className="w-3 h-3" />
                            <span>{order.delivery_window === 'morning' ? (language === 'he' ? 'בוקר' : 'Morning') : (language === 'he' ? 'אחר הצהריים' : 'Afternoon')}</span>
                        </div>

                        <div className="flex items-center gap-1">
                            <span className="text-gray-200">•</span>
                            <Truck className="w-3 h-3" />
                            <span>
                                {order.delivery_method === 'self'
                                    ? (language === 'he' ? 'עצמית' : 'Self')
                                    : (language === 'he' ? 'חיצונית' : 'External')}
                            </span>
                        </div>
                    </div>

                    {/* Expand/Collapse Controls */}
                    <div className="flex gap-2 pt-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="flex-1 h-7 text-[10px] font-bold text-gray-500 hover:bg-gray-50"
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
                            variant="ghost"
                            size="sm"
                            className="flex-1 h-7 text-[10px] font-bold text-yellow-600 hover:bg-yellow-50 hover:text-yellow-700"
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
                        <div className="mt-2 pt-2 border-t space-y-1.5 text-[12px] text-gray-600 fade-in bg-gray-50/50 p-2 rounded-md">
                            {(() => {
                                const site = sites[order.site_id];
                                const contactName = order.site_contact || site?.contact_name;
                                const contactPhone = order.site_phone || site?.contact_phone;
                                if (!contactName && !contactPhone) return null;
                                return (
                                    <div className="flex items-center gap-2">
                                        <User className="w-3.5 h-3.5 text-gray-400" />
                                        <span className="font-medium text-gray-500">{language === 'he' ? 'איש קשר:' : 'Contact:'}</span>
                                        <span className="text-gray-900 font-bold">{contactName}</span>
                                        {contactPhone && (
                                            <span className="text-blue-600 font-bold ml-auto">{contactPhone}</span>
                                        )}
                                    </div>
                                );
                            })()}

                            {order.notes && (
                                <div className="flex items-start gap-2">
                                    <FileText className="w-3.5 h-3.5 text-gray-400 mt-0.5" />
                                    <div>
                                        <div className="font-medium text-gray-500">{language === 'he' ? 'הערות:' : 'Notes:'}</div>
                                        <div className="text-gray-800 whitespace-pre-wrap leading-tight">{order.notes}</div>
                                    </div>
                                </div>
                            )}

                            {order.delivery_note_number && (
                                <div className="flex items-center gap-2">
                                    <Truck className="w-3.5 h-3.5 text-gray-400" />
                                    <span className="font-medium text-gray-500">{language === 'he' ? 'תעודת משלוח:' : 'Delivery note:'}</span>
                                    <span className="text-gray-900 font-bold">{order.delivery_note_number}</span>
                                </div>
                            )}

                            {order.driver_name && (
                                <div className="flex items-center gap-2">
                                    <User className="w-3.5 h-3.5 text-gray-400" />
                                    <span className="font-medium text-gray-500">{language === 'he' ? 'נהג:' : 'Driver:'}</span>
                                    <span className="text-gray-900 font-bold">{order.driver_name}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Expandable: Actions */}
                    {showActions && (
                        <div className="mt-2 pt-2 border-t grid grid-cols-2 gap-2 fade-in">
                            {actions.approve && (
                                <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 text-white h-9 text-xs font-bold"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onStatusChange(order.id, 'approved');
                                    }}
                                >
                                    <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                                    {language === 'he' ? 'אשר הזמנה' : 'Approve Order'}
                                </Button>
                            )}

                            {actions.reject && (
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    className="h-9 text-xs font-bold"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onStatusChange(order.id, 'rejected');
                                    }}
                                >
                                    <X className="w-3.5 h-3.5 mr-1.5" />
                                    {language === 'he' ? 'דחה הזמנה' : 'Reject Order'}
                                </Button>
                            )}

                            {actions.updateDelivery && onUpdateDelivery && (
                                <Button
                                    size="sm"
                                    className="h-9 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white border-blue-600 col-span-2"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onUpdateDelivery(order);
                                    }}
                                >
                                    <Truck className="w-3.5 h-3.5 mr-1.5" />
                                    {language === 'he' ? 'עדכן אספקה' : 'Update Delivery'}
                                </Button>
                            )}

                            {actions.sendMessage && onSendMessage && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-9 text-xs font-medium border-gray-200"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSendMessage(order);
                                    }}
                                >
                                    <MessageSquare className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                                    {language === 'he' ? 'שלח הודעה' : 'Message'}
                                </Button>
                            )}

                            {(actions.duplicate || showDuplicateForApproved) && onDuplicate && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-9 text-xs font-medium border-gray-200"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDuplicate(order);
                                    }}
                                >
                                    <Plus className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                                    {language === 'he' ? 'שכפל' : 'Duplicate'}
                                </Button>
                            )}

                            {actions.returnToPending && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-9 text-xs font-medium border-gray-200"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onStatusChange(order.id, 'pending');
                                    }}
                                >
                                    <Clock className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                                    {language === 'he' ? 'החזר לממתין' : 'To Pending'}
                                </Button>
                            )}

                            {actions.delete && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-500 border-red-100 hover:bg-red-50 hover:text-red-600 h-9 text-xs font-medium"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(order.id);
                                    }}
                                >
                                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
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
