import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, MapPin, Calendar, Sunrise, Sunset, Truck, FileText, Edit, Trash2, Building2, Factory, Star, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { getProductName, getSiteName, getClientName as resolveClientName, getSupplierName, getStatusConfig } from '@/lib/orderUtils';

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
    onStatusChange
}) => {
    const isRTL = language === 'he';
    const TimeIcon = order.delivery_window === 'morning' ? Sunrise : Sunset;
    const statusConfig = getStatusConfig(order.status, language);

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
        <Card>
            <CardContent className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-bold text-sm sm:text-base">
                                {t.orderNumber} #{order.order_number || order.id.slice(-6)}
                            </h3>
                            <Badge className={`${statusConfig.className} text-xs`}>
                                {statusConfig.label}
                            </Badge>
                            {order.is_delivered && !order.is_client_confirmed && (
                                <Badge className="bg-orange-100 text-orange-800 text-xs">
                                    <Clock className="w-3 h-3 ml-1" />
                                    {t.waitingClientConfirm}
                                </Badge>
                            )}
                            {order.is_client_confirmed && (
                                <Badge className="bg-green-100 text-green-800 text-xs">
                                    <CheckCircle className="w-3 h-3 ml-1" />
                                    {t.clientConfirmed}
                                </Badge>
                            )}
                            {order.rating && (
                                <Badge className="bg-purple-100 text-purple-800 text-xs">
                                    <Star className="w-3 h-3 ml-1 fill-purple-600" />
                                    {order.rating}/5
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
                            <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0" />
                            <span className="text-gray-500">{t.site}:</span>
                            <span className="font-medium text-gray-900">{getSiteName(order.site_id, sites)}</span>
                        </div>
                    )}
                    {order.site_id && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                            <Building2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                            <span className="text-gray-500">{t.region}:</span>
                            <span className="font-medium text-blue-700">{getRegionName(order.site_id)}</span>
                        </div>
                    )}
                    {order.supplier && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                            <Factory className="w-4 h-4 text-orange-500 flex-shrink-0" />
                            <span className="text-gray-500">{t.supplier}:</span>
                            <span className="font-medium text-orange-700">{getSupplierName(order.supplier, language)}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <Package className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <span className="text-gray-500">{t.product}:</span>
                        <span className="font-medium text-gray-900">{getProductName(order.product_id, products, language)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <Package className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <span className="text-gray-500">{t.quantity}:</span>
                        <span className="font-medium text-gray-900">{order.quantity_tons} {t.tons}</span>
                    </div>
                    {order.delivery_date && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                            <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
                            <span className="text-gray-500">{t.deliveryDate}:</span>
                            <span className="font-medium text-gray-900">{formatDate(order.delivery_date)}</span>
                        </div>
                    )}
                    {order.delivery_window && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                            <TimeIcon className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                            <span className="text-gray-500">{t.timeWindow}:</span>
                            <span className="font-medium text-gray-900">
                                {order.delivery_window === 'morning' ? t.morning : t.afternoon}
                            </span>
                        </div>
                    )}
                    {order.delivery_method && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                            <Truck className="w-4 h-4 text-gray-500 flex-shrink-0" />
                            <span className="text-gray-500">{t.deliveryMethod}:</span>
                            <span className="font-medium text-gray-900">
                                {order.delivery_method === 'self' ? t.self : t.external}
                            </span>
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
                    <div className="flex gap-2">
                        {order.status === 'pending' && (
                            <>
                                <Button
                                    size="sm"
                                    onClick={() => onStatusChange(order.id, 'approved')}
                                    className="bg-green-600 hover:bg-green-700 text-white flex-1"
                                >
                                    <CheckCircle className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                                    {t.approve}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => onStatusChange(order.id, 'rejected')}
                                    className="flex-1"
                                >
                                    {t.reject}
                                </Button>
                            </>
                        )}
                        {order.status === 'approved' && (
                            <>
                                <Button
                                    size="sm"
                                    onClick={() => onStatusChange(order.id, 'completed')}
                                    className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
                                >
                                    <CheckCircle className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                                    {t.markCompleted}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onStatusChange(order.id, 'pending')}
                                    className="flex-1"
                                >
                                    <Clock className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                                    {t.returnToPending}
                                </Button>
                            </>
                        )}
                        {order.status === 'rejected' && (
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
                        {order.status === 'completed' && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onStatusChange(order.id, 'approved')}
                                className="w-full"
                            >
                                <Clock className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                                {t.returnToApproved}
                            </Button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onEdit(order)}
                            className="flex-1"
                        >
                            <Edit className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                            {t.edit}
                        </Button>
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => onDelete(order.id)}
                            className="flex-1"
                        >
                            <Trash2 className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                            {t.delete}
                        </Button>
                    </div>
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
