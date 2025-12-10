import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Order, Site, Client, Product, User, Notification } from '@/entities';
import { useLanguage } from '@/contexts/LanguageContext';
import { Search, RefreshCw, CheckCircle, XCircle, Clock, Package, MapPin, Calendar, Sunrise, Sunset, Truck, FileText, Plus, Edit, Trash2, Building2, Factory, Star } from 'lucide-react';
import OrderEditDialog from './OrderEditDialog';

export const OrderManagement: React.FC = () => {
    const { language } = useLanguage();
    const [orders, setOrders] = useState<any[]>([]);
    const [sites, setSites] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [editingOrder, setEditingOrder] = useState<any>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    const translations = {
        he: {
            title: 'ניהול הזמנות',
            addOrder: 'הוסף הזמנה',
            search: 'חיפוש הזמנה...',
            refresh: 'רענן',
            filterAll: 'הכל',
            filterPending: 'ממתין',
            filterApproved: 'מאושר',
            filterRejected: 'נדחה',
            filterCompleted: 'הושלם',
            orderNumber: 'הזמנה',
            client: 'לקוח',
            site: 'אתר',
            region: 'אזור',
            eilat: 'אילת',
            outsideEilat: 'מחוץ לאילת',
            supplier: 'ספק',
            shifuliHar: 'שיפולי הר',
            maavarRabin: 'מעבר רבין',
            product: 'מוצר',
            quantity: 'כמות',
            deliveryDate: 'תאריך אספקה',
            timeWindow: 'חלון זמן',
            morning: 'בוקר',
            afternoon: 'אחר הצהריים',
            deliveryMethod: 'שיטת אספקה',
            self: 'עצמי',
            external: 'חיצוני',
            notes: 'הערות',
            status: 'סטטוס',
            pending: 'ממתין לאישור',
            approved: 'אושר',
            rejected: 'נדחה',
            completed: 'הושלם',
            actions: 'פעולות',
            approve: 'אשר',
            reject: 'דחה',
            markCompleted: 'סמן כהושלם',
            returnToPending: 'החזר לממתין',
            returnToApproved: 'החזר לאושר',
            edit: 'ערוך',
            delete: 'מחק',
            noOrders: 'אין הזמנות במערכת',
            orderApproved: 'הזמנה אושרה בהצלחה',
            orderRejected: 'הזמנה נדחתה',
            orderCompleted: 'הזמנה סומנה כהושלמה',
            orderUpdated: 'הזמנה עודכנה בהצלחה',
            orderDeleted: 'הזמנה נמחקה בהצלחה',
            deleteConfirm: 'האם אתה בטוח שברצונך למחוק הזמנה זו?',
            error: 'שגיאה',
            tons: 'טון',
            createdAt: 'נוצר ב',
            delivered: 'סופק',
            notDelivered: 'לא סופק',
            waitingClientConfirm: 'ממתין לאישור',
            clientConfirmed: 'אושר ע"י לקוח',
            rating: 'דירוג'
        },
        en: {
            title: 'Order Management',
            addOrder: 'Add Order',
            search: 'Search order...',
            refresh: 'Refresh',
            filterAll: 'All',
            filterPending: 'Pending',
            filterApproved: 'Approved',
            filterRejected: 'Rejected',
            filterCompleted: 'Completed',
            orderNumber: 'Order',
            client: 'Client',
            site: 'Site',
            region: 'Region',
            eilat: 'Eilat',
            outsideEilat: 'Outside Eilat',
            supplier: 'Supplier',
            shifuliHar: 'Shifuli Har',
            maavarRabin: 'Maavar Rabin',
            product: 'Product',
            quantity: 'Quantity',
            deliveryDate: 'Delivery Date',
            timeWindow: 'Time Window',
            morning: 'Morning',
            afternoon: 'Afternoon',
            deliveryMethod: 'Delivery Method',
            self: 'Self',
            external: 'External',
            notes: 'Notes',
            status: 'Status',
            pending: 'Pending Approval',
            approved: 'Approved',
            rejected: 'Rejected',
            completed: 'Completed',
            actions: 'Actions',
            approve: 'Approve',
            reject: 'Reject',
            markCompleted: 'Mark Completed',
            returnToPending: 'Return to Pending',
            returnToApproved: 'Return to Approved',
            edit: 'Edit',
            delete: 'Delete',
            noOrders: 'No orders in the system',
            orderApproved: 'Order approved successfully',
            orderRejected: 'Order rejected',
            orderCompleted: 'Order marked as completed',
            orderUpdated: 'Order updated successfully',
            orderDeleted: 'Order deleted successfully',
            deleteConfirm: 'Are you sure you want to delete this order?',
            error: 'Error',
            tons: 'tons',
            createdAt: 'Created at',
            delivered: 'Delivered',
            notDelivered: 'Not delivered',
            waitingClientConfirm: 'Waiting confirmation',
            clientConfirmed: 'Confirmed by client',
            rating: 'Rating'
        }
    };

    const t = translations[language];
    const isRTL = language === 'he';

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [ordersData, sitesData, clientsData, productsData] = await Promise.all([
                Order.list('-created_at', 1000),
                Site.list('-created_at', 1000),
                Client.list('-created_at', 1000),
                Product.list('-created_at', 1000)
            ]);
            setOrders(ordersData);
            setSites(sitesData);
            setClients(clientsData);
            setProducts(productsData);
        } catch (error) {
            console.error('Error loading data:', error);
            toast({
                title: t.error,
                description: 'Failed to load data',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const createStatusChangeNotifications = async (order: any, newStatus: string) => {
        try {
            const statusMessages = {
                approved: `הזמנה #${order.order_number} אושרה`,
                rejected: `הזמנה #${order.order_number} נדחתה`,
                completed: `הזמנה #${order.order_number} הושלמה`,
                pending: `הזמנה #${order.order_number} הוחזרה לסטטוס ממתין`
            };

            const message = statusMessages[newStatus] || `הזמנה #${order.order_number} עודכנה`;

            const allUsers = await User.list('-created_at', 1000);
            const managers = allUsers.filter(u => u.role === 'manager');
            const orderCreator = allUsers.find(u => u.email === order.created_by);

            const managerNotifications = managers.map(manager =>
                Notification.create({
                    recipient_email: manager.email,
                    type: 'order_status_change',
                    message: message,
                    is_read: false,
                    order_id: order.order_number
                })
            );

            if (orderCreator && orderCreator.role === 'client') {
                managerNotifications.push(
                    Notification.create({
                        recipient_email: orderCreator.email,
                        type: 'order_status_change',
                        message: message,
                        is_read: false,
                        order_id: order.order_number
                    })
                );
            }

            await Promise.all(managerNotifications);
        } catch (error) {
            console.error('Error creating status change notifications:', error);
        }
    };

    const updateOrderStatus = async (orderId: string, newStatus: string) => {
        try {
            const order = orders.find(o => o.id === orderId);

            await Order.update(orderId, { status: newStatus });

            if (order) {
                await createStatusChangeNotifications(order, newStatus);
            }

            const messages = {
                approved: t.orderApproved,
                rejected: t.orderRejected,
                completed: t.orderCompleted,
                pending: t.orderUpdated
            };
            toast({ title: messages[newStatus] || t.orderUpdated });
            loadData();
        } catch (error) {
            console.error('Error updating order:', error);
            toast({
                title: t.error,
                description: 'Failed to update order',
                variant: 'destructive'
            });
        }
    };

    const handleDelete = async (orderId: string) => {
        if (!confirm(t.deleteConfirm)) return;

        try {
            await Order.delete(orderId);
            toast({ title: t.orderDeleted });
            loadData();
        } catch (error) {
            console.error('Error deleting order:', error);
            toast({
                title: t.error,
                description: 'Failed to delete order',
                variant: 'destructive'
            });
        }
    };

    const getProductName = (productId: string) => {
        const product = products.find(p => p.product_id === productId);
        return product ? (language === 'he' ? product.name_he : product.name_en) : productId;
    };

    const getSite = (siteId: string) => {
        return sites.find(s => s.id === siteId);
    };

    const getSiteName = (siteId: string) => {
        const site = getSite(siteId);
        return site?.site_name || t.site;
    };

    const getClientName = (siteId: string) => {
        const site = getSite(siteId);
        if (!site) return '';
        const client = clients.find(c => c.id === site.client_id);
        return client?.name || '';
    };

    const getRegionName = (siteId: string) => {
        const site = getSite(siteId);
        if (!site) return '';
        return site.region_type === 'eilat' ? t.eilat : t.outsideEilat;
    };

    const getSupplierName = (supplier: string) => {
        if (!supplier) return '';
        return supplier === 'shifuli_har' ? t.shifuliHar : t.maavarRabin;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const getStatusColor = (status: string) => {
        const colors = {
            pending: 'status-pending',
            approved: 'status-approved',
            rejected: 'status-rejected',
            completed: 'status-completed'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch =
            order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            getSiteName(order.site_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
            getProductName(order.product_id).toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="relative flex-1">
                    <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4`} />
                    <Input
                        placeholder={t.search}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={isRTL ? 'pr-10' : 'pl-10'}
                    />
                </div>
                <div className="flex gap-2">
                    <Button
                        className="piter-yellow flex-1 sm:flex-none"
                        onClick={() => {
                            setEditingOrder(null);
                            setIsEditDialogOpen(true);
                        }}
                    >
                        <Plus className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                        {t.addOrder}
                    </Button>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t.filterAll}</SelectItem>
                            <SelectItem value="pending">{t.filterPending}</SelectItem>
                            <SelectItem value="approved">{t.filterApproved}</SelectItem>
                            <SelectItem value="rejected">{t.filterRejected}</SelectItem>
                            <SelectItem value="completed">{t.filterCompleted}</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={loadData} size="icon" className="flex-shrink-0">
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Orders List */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto"></div>
                </div>
            ) : filteredOrders.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-600">{t.noOrders}</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {filteredOrders.map((order) => {
                        const TimeIcon = order.delivery_window === 'morning' ? Sunrise : Sunset;

                        return (
                            <Card key={order.id}>
                                <CardContent className="p-4">
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <h3 className="font-bold text-sm sm:text-base">
                                                    {t.orderNumber} #{order.order_number || order.id.slice(-6)}
                                                </h3>
                                                <Badge className={`${getStatusColor(order.status)} text-xs`}>
                                                    {t[order.status]}
                                                </Badge>
                                                {/* Client confirmation status badges */}
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
                                                {/* Rating badge */}
                                                {order.rating && (
                                                    <Badge className="bg-purple-100 text-purple-800 text-xs">
                                                        <Star className="w-3 h-3 ml-1 fill-purple-600" />
                                                        {order.rating}/5
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-xs sm:text-sm text-gray-600">
                                                {getClientName(order.site_id)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div className="space-y-2 mb-3">
                                        {order.site_id && (
                                            <div className="flex items-center gap-2 text-xs sm:text-sm">
                                                <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                                <span className="text-gray-500">{t.site}:</span>
                                                <span className="font-medium text-gray-900">{getSiteName(order.site_id)}</span>
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
                                                <span className="font-medium text-orange-700">{getSupplierName(order.supplier)}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                                            <Package className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                            <span className="text-gray-500">{t.product}:</span>
                                            <span className="font-medium text-gray-900">{getProductName(order.product_id)}</span>
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
                                                        onClick={() => updateOrderStatus(order.id, 'approved')}
                                                        className="bg-green-600 hover:bg-green-700 text-white flex-1"
                                                    >
                                                        <CheckCircle className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                                                        {t.approve}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => updateOrderStatus(order.id, 'rejected')}
                                                        className="flex-1"
                                                    >
                                                        <XCircle className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                                                        {t.reject}
                                                    </Button>
                                                </>
                                            )}
                                            {order.status === 'approved' && (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => updateOrderStatus(order.id, 'completed')}
                                                        className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
                                                    >
                                                        <CheckCircle className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                                                        {t.markCompleted}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => updateOrderStatus(order.id, 'pending')}
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
                                                    onClick={() => updateOrderStatus(order.id, 'pending')}
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
                                                    onClick={() => updateOrderStatus(order.id, 'approved')}
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
                                                onClick={() => {
                                                    setEditingOrder(order);
                                                    setIsEditDialogOpen(true);
                                                }}
                                                className="flex-1"
                                            >
                                                <Edit className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                                                {t.edit}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => handleDelete(order.id)}
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
                    })}
                </div>
            )}

            {/* Edit/Create Dialog */}
            <OrderEditDialog
                order={editingOrder}
                isOpen={isEditDialogOpen}
                onClose={() => {
                    setEditingOrder(null);
                    setIsEditDialogOpen(false);
                }}
                onSave={() => {
                    setEditingOrder(null);
                    setIsEditDialogOpen(false);
                    loadData();
                }}
            />
        </div>
    );
};