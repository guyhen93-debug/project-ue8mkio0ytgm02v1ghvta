import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Order, User, Notification } from '@/entities';
import { useLanguage } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { Package } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { OrderFilters } from './OrderFilters';
import { OrderCard } from './OrderCard';
import OrderEditDialog from './OrderEditDialog';
import { getProductName, getSiteName } from '@/lib/orderUtils';

export const OrderManagement: React.FC = () => {
    const { language } = useLanguage();
    const { products, sites, clients, productsMap, sitesMap, clientsMap, loading: dataLoading } = useData();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [editingOrder, setEditingOrder] = useState<any>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    useEffect(() => {
        try {
            const params = new URLSearchParams(window.location.search);
            
            // Status filter from URL
            const statusFromUrl = params.get('status');
            const allowed = ['all', 'pending', 'approved', 'rejected', 'completed', 'in_transit'];
            if (statusFromUrl && allowed.includes(statusFromUrl)) {
                setStatusFilter(statusFromUrl);
            }

            // Order search from URL
            const orderSearch = params.get('order');
            if (orderSearch) {
                setSearchTerm(orderSearch);
            }
        } catch (e) {
            console.warn('Could not read parameters from URL', e);
        }
    }, []);

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
            rating: 'דירוג',
            deliveryNoteNumber: 'תעודת משלוח',
            driverName: 'שם נהג',
            deliveredQuantity: 'כמות שסופקה'
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
            rating: 'Rating',
            deliveryNoteNumber: 'Delivery Note',
            driverName: 'Driver Name',
            deliveredQuantity: 'Delivered Quantity'
        }
    };

    const t = translations[language];
    const isRTL = language === 'he';

    useEffect(() => {
        if (!dataLoading) {
            loadData();
        }
    }, [dataLoading]);

    const loadData = async () => {
        try {
            setLoading(true);
            const ordersData = await Order.list('-created_at', 1000);
            setOrders(ordersData);
        } catch (error: any) {
            const errorMessage = error?.message || '';
            const isBenign = 
                errorMessage.includes('Failed to fetch') || 
                errorMessage.includes('401') || 
                errorMessage.includes('Unauthorized') || 
                errorMessage.includes('Not authenticated');

            if (isBenign) {
                console.info('Orders load skipped due to auth/connection issue');
            } else {
                console.error('Error loading data:', error);
                toast({
                    title: t.error,
                    description: 'Failed to load data',
                    variant: 'destructive'
                });
            }
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

    const filteredOrders = orders.filter(order => {
        const matchesSearch =
            order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            getSiteName(order.site_id, sitesMap).toLowerCase().includes(searchTerm.toLowerCase()) ||
            getProductName(order.product_id, productsMap, language).toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    if (loading || dataLoading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Filters */}
            <OrderFilters
                searchTerm={searchTerm}
                statusFilter={statusFilter}
                onSearchChange={setSearchTerm}
                onStatusChange={setStatusFilter}
                onRefresh={loadData}
                onAddNew={() => {
                    setEditingOrder(null);
                    setIsEditDialogOpen(true);
                }}
                translations={t}
                isRTL={isRTL}
            />

            {/* Orders List */}
            {filteredOrders.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-600">{t.noOrders}</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {filteredOrders.map((order) => (
                        <OrderCard
                            key={order.id}
                            order={order}
                            products={productsMap}
                            sites={sitesMap}
                            clients={clientsMap}
                            language={language}
                            translations={t}
                            onEdit={(order) => {
                                setEditingOrder(order);
                                setIsEditDialogOpen(true);
                            }}
                            onDelete={handleDelete}
                            onStatusChange={updateOrderStatus}
                        />
                    ))}
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
