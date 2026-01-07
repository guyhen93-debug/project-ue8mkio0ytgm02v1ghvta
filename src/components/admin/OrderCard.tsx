import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, MapPin, Calendar, Sunrise, Sunset, Truck, FileText, Edit, Trash2, Building2, Factory, Star, CheckCircle, Clock, MessageSquare, Box, Scale } from 'lucide-react';
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
    clients: Record<string, any>;
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
    const isRTL = language === 'he';
    const TimeIcon = order.delivery_window === 'morning' ? Sunrise : Sunset;
    const effectiveStatus = (order.status === 'completed' || order.is_delivered)
        ? 'completed'
        : order.status;
    const statusConfig = getStatusConfig(effectiveStatus, language);

    const getStatusEmoji = (status: string) => {
        switch (status) {
            case 'pending': return "⏳";
            case 'approved': return "✅";
            case 'in_transit': return "🚚";
            case 'completed': return "✔️";
            case 'rejected': return "❌";
            default: return "⏳";
        }
    };

    const statusEmoji = getStatusEmoji(order.status);
    const isNew = order.status === 'pending' && order.created_at && (Date.now() - new Date(order.created_at).getTime() < 1000 * 60 * 60 * 24);
    const actions = getAvailableActions(order.status);
    const hasPrimaryActions = actions.approve || actions.reject || actions.returnToPending;
    const hasSecondaryActions =
        actions.updateDelivery ||
        actions.duplicate ||
        actions.sendMessage ||
        actions.edit ||
        actions.delete;

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const getRegionName = (siteId: string) => {
        const site = sites[siteId];
        if (!site) return '';
        return site.region_type === 'eilat' ? t.eilat : t.outsideEilat;
    };

    return (
        <Card className="industrial-card hover:shadow-md transition-shadow">
            <CardContent className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-bold text-sm sm:text-base text-gray-900">
                                {t.orderNumber} #{order.order_number || order.id.slice(-6)}
                            </h3>
                            <Badge className={statusConfig.className}>
                                <span className={isRTL ? 'ml-1' : 'mr-1'}>{statusEmoji}</span>
                                {statusConfig.label}
                            </Badge>
                            {isNew && (
                                <Badge className="bg-[#DBEAFE] text-[#3B82F6] border border-[#3B82F6] px-2 py-0.5 text-[10px] font-semibold rounded-full">
                                    🆕 {language === 'he' ? 'חדש' : 'New'}
                                </Badge>
                            )}
                            {order.rating && (
                                <Badge className="bg-purple-100 text-purple-800 text-xs">
                                    <Star className="w-3 h-3 ml-1 fill-purple-600" />
                                    {order.rating}/5
                                </Badge>
                            )}
                            {showReminder && (
                                <Badge className="bg-red-100 text-red-700 text-xs flex items-center gap-1">
                                    <span>⚠️</span>
                                    <span className="hidden sm:inline">
                                        {language === 'he' ? 'דורש תשומת לב' : 'Needs attention'}
                                    </span>
                                </Badge>
                            )}
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600">
                            {resolveClientName(order, sites, clients)}
                        </p>
                    </div>
                </div>

                {/* Details */}
                <div className="space-y-2 mb-3">
                    {order.site_id && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-700 font-medium">{t.site}:</span>
                            <span className="font-bold text-gray-900">{getSiteName(order.site_id, sites)}</span>
                        </div>
                    )}
                    {order.site_id && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                            <Building2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                            <span className="text-gray-700 font-medium">{t.region}:</span>
                            <span className="font-bold text-blue-700">{getRegionName(order.site_id)}</span>
                        </div>
                    )}
                    {order.supplier && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                            <Factory className="w-4 h-4 text-orange-500 flex-shrink-0" />
                            <span className="text-gray-700 font-medium">{t.supplier}:</span>
                            <span className="font-bold text-orange-700">{getSupplierName(order.supplier, language)}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <Box className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-700 font-medium">{t.product}:</span>
                        <span className="font-bold text-gray-900">{getProductName(order.product_id, products, language)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <Scale className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-700 font-medium">{t.quantity}:</span>
                        <span className="font-bold text-gray-900">{order.quantity_tons} {t.tons}</span>
                    </div>
                    {order.delivery_date && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                            <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-700 font-medium">{t.deliveryDate}:</span>
                            <span className="font-bold text-gray-900">{formatDate(order.delivery_date)}</span>
                        </div>
                    )}
                    {order.delivery_window && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                            <TimeIcon className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                            <span className="text-gray-700 font-medium">{t.timeWindow}:</span>
                            <span className="font-bold text-gray-900">
                                {order.delivery_window === 'morning' ? t.morning : t.afternoon}
                            </span>
                        </div>
                    )}
                    {order.delivery_method && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                            <Truck className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-700 font-medium">{t.deliveryMethod}:</span>
                            <span className="font-bold text-gray-900">
                                {order.delivery_method === 'self' ? t.self : t.external}
                            </span>
                        </div>
                    )}

                    {/* Delivery Info */}
                    {(order.delivery_note_number || order.driver_name || order.is_delivered || order.delivered_quantity_tons > 0) && (
                        <div className="mt-2 pt-2 border-t border-dashed border-gray-100 space-y-1">
                            {order.delivery_note_number && (
                                <div className="flex items-center gap-2 text-xs sm:text-sm">
                                    <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                    <span className="text-gray-700 font-medium">{t.deliveryNoteNumber}:</span>
                                    <span className="font-bold text-blue-700">{order.delivery_note_number}</span>
                                </div>
                            )}
                            {order.driver_name && (
                                <div className="flex items-center gap-2 text-xs sm:text-sm">
                                    <Truck className="w-4 h-4 text-green-600 flex-shrink-0" />
                                    <span className="text-gray-700 font-medium">{t.driverName}:</span>
                                    <span className="font-bold text-gray-900">{order.driver_name}</span>
                                </div>
                            )}
                            {(order.is_delivered || order.delivered_quantity_tons > 0) && (
                                <div className="flex items-center gap-2 text-xs sm:text-sm">
                                    <Scale className="w-4 h-4 text-orange-500 flex-shrink-0" />
                                    <span className="text-gray-700 font-medium">{t.deliveredQuantity}:</span>
                                    <span className="font-bold text-gray-900">
                                        {order.delivered_quantity_tons || 0} / {order.quantity_tons} {t.tons}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Notes */}
                {order.notes && (
                    <div className="mb-3 pt-3 border-t border-gray-100">
                        <div className="flex items-start gap-2">
                            <FileText className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-xs text-gray-500">{t.notes}:</p>
                                <p className="text-xs sm:text-sm text-gray-700 mt-1">{order.notes}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="space-y-2 pt-3 border-t border-gray-100">
                    {hasPrimaryActions && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {actions.approve && (
                                <Button
                                    size="sm"
                                    onClick={() => onStatusChange(order.id, 'approved')}
                                    className="bg-green-600 hover:bg-green-700 text-white w-full"
                                >
                                    <CheckCircle className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                                    {t.approve}
                                </Button>
                            )}
                            {actions.reject && (
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => onStatusChange(order.id, 'rejected')}
                                    className="w-full"
                                >
                                    {t.reject}
                                </Button>
                            )}
                            {actions.returnToPending && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onStatusChange(order.id, 'pending')}
                                    className="w-full"
                                >
                                    <Clock className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                                    {t.returnToPending}
                                </Button>
                            )}
                        </div>
                    )}

                    {hasSecondaryActions && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {actions.updateDelivery && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onUpdateDelivery?.(order)}
                                    className="w-full"
                                >
                                    <Package className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                                    {t.addDelivery}
                                </Button>
                            )}
                            {actions.duplicate && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onDuplicate?.(order)}
                                    className="w-full"
                                >
                                    <FileText className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                                    {t.duplicateOrder}
                                </Button>
                            )}
                            {actions.sendMessage && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onSendMessage?.(order)}
                                    className="w-full"
                                >
                                    <MessageSquare className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                                    {t.sendMessage}
                                </Button>
                            )}
                            {actions.edit && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onEdit(order)}
                                    className="w-full"
                                >
                                    <Edit className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                                    {t.edit}
                                </Button>
                            )}
                            {actions.delete && (
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => onDelete(order.id)}
                                    className="w-full"
                                >
                                    <Trash2 className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                                    {t.delete}
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                {/* Created Date */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-400">
                        {t.createdAt} {formatDate(order.created_at)}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};
