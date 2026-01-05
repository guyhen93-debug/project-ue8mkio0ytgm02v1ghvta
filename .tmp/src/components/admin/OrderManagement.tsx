import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Order, User, Notification } from '@/entities';
import type { Order as OrderType, User as UserType, Client as ClientType, Site as SiteType, Product as ProductType } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Package } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { OrderFilters } from './OrderFilters';
import { OrderCard } from './OrderCard';
import OrderEditDialog from './OrderEditDialog';
import { getProductName, getSiteName } from '@/lib/orderUtils';
import { useDebounce } from '@/hooks/useDebounce';

export const OrderManagement: React.FC = () => {
    const navigate = useNavigate();
    const { language } = useLanguage();
    const { user: currentUser } = useAuth();
    const { products, sites, clients, productsMap, sitesMap, clientsMap, loading: dataLoading } = useData();
    const [orders, setOrders] = useState<OrderType[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 300);
    const [statusFilter, setStatusFilter] = useState('all');
    const [editingOrder, setEditingOrder] = useState<OrderType | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [managersCache, setManagersCache] = useState<UserType[]>([]);
    const [cacheLoaded, setCacheLoaded] = useState(false);
    const PAGE_SIZE = 20;

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
            addDelivery: 'עדכן אספקה',
            sendMessage: 'שלח הודעה',
            search: 'חיפוש הזמנה...',
            refresh: 'רענן',
            filterAll: 'הכל',
            filterPending: 'ממתין',
            filterApproved: 'מאושר',
            filterRejected: 'נדחה',
            filterCompleted: 'הושלם',
            filterInTransit: 'בדרך',
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
            deliveredQuantity: 'כמות שסופקה',
            duplicateOrder: 'שכפל הזמנה 📋'
        },
        en: {
            title: 'Order Management',
            addOrder: 'Add Order',
            addDelivery: 'Update Delivery',
            sendMessage: 'Send Message',
            search: 'Search order...',
            refresh: 'Refresh',
            filterAll: 'All',
            filterPending: 'Pending',
            filterApproved: 'Approved',
            filterRejected: 'Rejected',
            filterCompleted: 'Completed',
            filterInTransit: 'In Transit',
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
            deliveredQuantity: 'Delivered Quantity',
            duplicateOrder: 'Duplicate order 📋'
        }
    };

    const t = translations[language];
    const isRTL = language === 'he';

    useEffect(() => {
        if (!dataLoading) {
            loadData();
        }
    }, [dataLoading, page]);

    useEffect(() => {
        if (!cacheLoaded && !dataLoading) {
            loadManagersCache();
        }
    }, [cacheLoaded, dataLoading]);

    const checkAndCreateReminders = async (ordersData: OrderType[]) => {
        try {
            if (!currentUser || currentUser.role !== 'manager' || currentUser.reminders_enabled === false) {
                return;
            }

            const delayHours = currentUser.reminders_delay_hours ?? 24;
            const now = new Date();

            for (const order of ordersData) {
                // 1. Pending too long
                if (order.status === 'pending' && order.created_at) {
                    const createdAt = new Date(order.created_at);
                    const hoursSinceCreated = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

                    if (hoursSinceCreated >= delayHours) {
                        const existing = await Notification.filter({
                            recipient_email: currentUser.email,
                            order_id: order.order_number,
                            type: 'order_pending_reminder'
                        }, '-created_at', 1);

                        if (existing.length === 0) {
                            await Notification.create({
                                recipient_email: currentUser.email,
                                type: 'order_pending_reminder',
                                message: `הזמנה #${order.order_number} ממתינה לאישור כבר ${delayHours} שעות ⏰`,
                                is_read: false,
                                order_id: order.order_number
                            });
                        }
                    }
                }

                // 2. Approved but delivery overdue
                if (order.status === 'approved' && order.delivery_date && !order.is_delivered) {
                    const deliveryDate = new Date(order.delivery_date);
                    const isOverdue = deliveryDate.getTime() < now.getTime();

                    if (isOverdue) {
                        const existing = await Notification.filter({
                            recipient_email: currentUser.email,
                            order_id: order.order_number,
                            type: 'order_delivery_overdue'
                        }, '-created_at', 1);

                        if (existing.length === 0) {
                            await Notification.create({
                                recipient_email: currentUser.email,
                                type: 'order_delivery_overdue',
                                message: `הזמנה #${order.order_number} לא סומנה כסופקה למרות שתאריך האספקה כבר עבר 📅`,
                                is_read: false,
                                order_id: order.order_number
                            });
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error in checkAndCreateReminders:', error);
        }
    };

    const shouldShowReminder = (order: OrderType) => {
        if (!currentUser || currentUser.role !== 'manager' || currentUser.reminders_enabled === false) {
            return false;
        }

        const delayHours = currentUser.reminders_delay_hours ?? 24;
        const now = new Date();

        if (order.status === 'pending' && order.created_at) {
            const createdAt = new Date(order.created_at);
            const hoursSinceCreated = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
            if (hoursSinceCreated >= delayHours) return true;
        }

        if (order.status === 'approved' && order.delivery_date && !order.is_delivered) {
            const deliveryDate = new Date(order.delivery_date);
            if (deliveryDate.getTime() < now.getTime()) return true;
        }

        return false;
    };

    const loadData = async () => {
        try {
            setLoading(true);
            const ordersData = await Order.list('-created_at', PAGE_SIZE, (page - 1) * PAGE_SIZE);
            setOrders(ordersData as unknown as OrderType[]);

            // Try to use a count API if available; otherwise approximate from what we know
            const anyOrder = Order as any;
            if (typeof anyOrder.count === 'function') {
                try {
                    const count = await anyOrder.count();
                    setTotalCount(count);
                } catch (e) {
                    console.warn('Order.count failed, falling back to length approximation', e);
                    setTotalCount((page - 1) * PAGE_SIZE + ordersData.length);
                }
            } else {
                setTotalCount((page - 1) * PAGE_SIZE + ordersData.length);
            }
            
            // Check for reminders in background
            checkAndCreateReminders(ordersData as unknown as OrderType[]).catch(error => {
                console.error('Error checking reminders:', error);
            });
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

    const loadManagersCache = async () => {
        try {
            const allUsers = await User.list('-created_at', 1000) as unknown as UserType[];
            const managers = allUsers.filter((u: UserType) => u.role === 'manager');
            setManagersCache(managers);
            setCacheLoaded(true);
            return managers;
        } catch (error) {
            console.error('Error loading managers cache:', error);
            return [];
        }
    };

    const getOrderClientName = (order: OrderType) => {
        if (order.client_id && clientsMap[order.client_id]?.name) {
            return clientsMap[order.client_id].name;
        }
        const site = sitesMap[order.site_id];
        if (site && clientsMap[site.client_id]?.name) {
            return clientsMap[site.client_id].name;
        }
        return '';
    };

    const createStatusChangeNotifications = async (order: OrderType, newStatus: string) => {
        try {
            const clientName = getOrderClientName(order);
            const suffix = clientName ? ` - ${clientName}` : '';

            const statusMessages = {
                approved: `הזמנה #${order.order_number} אושרה${suffix}`,
                rejected: `הזמנה #${order.order_number} נדחתה${suffix}`,
                completed: `הזמנה #${order.order_number} הושלמה${suffix}`,
                pending: `הזמנה #${order.order_number} הוחזרה לסטטוס ממתין${suffix}`
            };

            const message = statusMessages[newStatus] || `הזמנה #${order.order_number} עודכנה${suffix}`;

            let managers: UserType[] = managersCache;
            if (!managers || managers.length === 0) {
                managers = await loadManagersCache();
            }

            const allUsers = await User.list('-created_at', 1000) as unknown as UserType[];
            const orderCreator = allUsers.find((u: UserType) => u.email === order.created_by);

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

    const handleUpdateDeliveryClick = (order: OrderType) => {
        setEditingOrder(order);
        setIsEditDialogOpen(true);
    };

    const handleSendMessage = (order: OrderType) => {
        const subject = language === 'he' 
            ? `הודעה לגבי הזמנה #${order.order_number}`
            : `Message regarding order #${order.order_number}`;
        
        navigate('/inbox', { 
            state: { 
                newMessage: { 
                    subject, 
                    orderId: order.id 
                } 
            } 
        });
    };

    const handleDuplicateOrder = (order: OrderType) => {
        navigate('/create-order', { state: { duplicateOrder: order } });
    };

    const filteredOrders = useMemo(() => {
        const search = debouncedSearch.toLowerCase();

        return orders.filter(order => {
            const matchesSearch =
                order.order_number?.toLowerCase().includes(search) ||
                getSiteName(order.site_id, sitesMap).toLowerCase().includes(search) ||
                getProductName(order.product_id, productsMap, language).toLowerCase().includes(search);

            const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [orders, debouncedSearch, statusFilter, sitesMap, productsMap, language]);

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
                            onUpdateDelivery={handleUpdateDeliveryClick}
                            onSendMessage={handleSendMessage}
                            onDuplicate={handleDuplicateOrder}
                            showReminder={shouldShowReminder(order)}
                        />
                    ))}
                </div>
            )}

            {totalCount > 0 && (
                <div className="flex items-center justify-between mt-6 p-4 border-t">
                    <div className="text-sm text-gray-600">
                        מציג {((page - 1) * PAGE_SIZE) + 1}-{Math.min(page * PAGE_SIZE, totalCount)} מתוך {totalCount} הזמנות
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            הקודם
                        </Button>
                        <span className="px-3 py-1 bg-gray-100 rounded text-sm">
                            עמוד {page} מתוך {Math.max(1, Math.ceil(totalCount / PAGE_SIZE) || 1)}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => p + 1)}
                            disabled={page >= Math.ceil(totalCount / PAGE_SIZE)}
                        >
                            הבא
                        </Button>
                    </div>
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
