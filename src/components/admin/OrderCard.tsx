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
        <Card className="industrial-card hover:border-yellow-300 transition-colors cursor-pointer" onClick={() => onEdit(order)}>
            <CardContent className="p-3 sm:p-4">
                <div className="space-y-2">
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
                    <div className="text-sm text-gray-600">
                        {clientName}
                    </div>

                    {/* Row 3: order details */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{siteName}</span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                            <Box className="w-4 h-4" />
                            <span>{productName}</span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                            <Scale className="w-4 h-4" />
                            <span>{quantity}ט'</span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(deliveryDate)}</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
