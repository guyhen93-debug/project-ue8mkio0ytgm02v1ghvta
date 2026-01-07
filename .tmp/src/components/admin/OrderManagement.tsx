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
import { Package, Plus, Search, X, Calendar as CalendarIcon } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { OrderCard } from './OrderCard';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { he } from 'date-fns/locale';
import OrderEditDialog from './OrderEditDialog';
import { getProductName, getSiteName } from '@/lib/orderUtils';
import { useDebounce } from '@/hooks/useDebounce';
import { OrderCardSkeleton } from '@/components/OrderCardSkeleton';
import { cn } from '@/lib/utils';

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
    const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
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
            title: 'הזמנות',
            addOrder: 'צור הזמנה חדשה',
            addDelivery: 'עדכן אספקה',
            sendMessage: 'שלח הודעה',
            search: 'חיפוש לפי הזמנה, אתר או מוצר...',
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
            markCompleted: 'סמן כהושלמה',
            returnToPending: 'החזר לממתין',
            returnToApproved: 'החזר לאושר',
            edit: 'ערוך',
            delete: 'מחק',
            noOrders: 'אין הזמנות להצגה',
            clearFilters: 'נקה סינונים',
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
            duplicateOrder: 'שכפל הזמנה 📋',
            dateRangeLabel: 'טווח תאריכים',
            clearFilter: 'נקה'
        },
        en: {
            title: 'Orders',
            addOrder: 'Create new order',
            addDelivery: 'Update Delivery',
            sendMessage: 'Send Message',
            search: 'Search by order, site or product...',
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
            noOrders: 'No orders to show',
            clearFilters: 'Clear filters',
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
            duplicateOrder: 'Duplicate order 📋',
            dateRangeLabel: 'Date range',
            clearFilter: 'Clear'
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
            const clientSuffix = clientName ? ` - ${clientName}` : '';

            const statusMessages: Record<string, string> = {
                approved: `הזמנה #${order.order_number} אושרה${clientSuffix}`,
                rejected: `הזמנה #${order.order_number} נדחתה${clientSuffix}`,
                completed: `הזמנה #${order.order_number} הושלמה${clientSuffix}`,
                pending: `הזמנה #${order.order_number} הוחזרה לסטטוס ממתין${clientSuffix}`,
                in_transit: `הזמנה #${order.order_number} בדרך${clientSuffix}`
            };

            const message = statusMessages[newStatus] || `הזמנה #${order.order_number} עודכנה${clientSuffix}`;

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

            const isCompletedLike =
                order.status === 'completed' ||
                order.is_delivered === true ||
                (order.delivered_quantity_tons && order.quantity_tons && order.delivered_quantity_tons >= order.quantity_tons);

            const matchesStatus =
                statusFilter === 'all' ||
                order.status === statusFilter ||
                (statusFilter === 'completed' && isCompletedLike);

            let matchesDate = true;
            if (dateRange?.from) {
                const from = startOfDay(dateRange.from);
                const to = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
                const orderDate = new Date(order.delivery_date);
                matchesDate = isWithinInterval(orderDate, { start: from, end: to });
            }

            return matchesSearch && matchesStatus && matchesDate;
        });
    }, [orders, debouncedSearch, statusFilter, dateRange, sitesMap, productsMap, language]);

    if (loading || dataLoading) {
        return (
            <div className="space-y-3" dir={isRTL ? 'rtl' : 'ltr'}>
                <OrderCardSkeleton />
                <OrderCardSkeleton />
                <OrderCardSkeleton />
                <OrderCardSkeleton />
                <OrderCardSkeleton />
            </div>
        );
    }

    return (
        <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Header: Title + Create Button */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                    <Package className="w-6 h-6 text-yellow-600" />
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t.title}</h1>
                </div>
                
                <Button
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-6 shadow-sm"
                    onClick={() => navigate('/create-order')}
                >
                    <Plus className="w-5 h-5 mr-2" />
                    {t.addOrder}
                </Button>
            </div>

            {/* Filters & Search */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Search Bar */}
                    <div className="relative flex-1">
                        <Search className={cn(
                            "absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10",
                            isRTL ? "right-3" : "left-3"
                        )} />
                        <Input
                            type="text"
                            placeholder={t.search}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={cn(
                                "w-full border-gray-200 focus-visible:ring-yellow-500",
                                isRTL ? "pr-10" : "pl-10"
                            )}
                        />
                    </div>

                    {/* Date Range Selector */}
                    <div className="flex items-center gap-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-full sm:w-[240px] justify-start text-left font-normal border-gray-200",
                                        !dateRange?.from && "text-muted-foreground",
                                        isRTL && "text-right flex-row-reverse"
                                    )}
                                >
                                    <CalendarIcon className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                                    {dateRange?.from ? (
                                        dateRange.to ? (
                                            <>
                                                {format(dateRange.from, "dd/MM/yyyy")} -{" "}
                                                {format(dateRange.to, "dd/MM/yyyy")}
                                            </>
                                        ) : (
                                            format(dateRange.from, "dd/MM/yyyy")
                                        )
                                    ) : (
                                        <span>{t.dateRangeLabel}</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={dateRange?.from}
                                    selected={dateRange}
                                    onSelect={setDateRange}
                                    numberOfMonths={1}
                                    locale={isRTL ? he : undefined}
                                />
                            </PopoverContent>
                        </Popover>
                        
                        {dateRange?.from && (
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setDateRange({})}
                                className="h-9 px-2 text-gray-500 hover:text-gray-700"
                            >
                                <X className="w-4 h-4 ml-1" />
                                {t.clearFilter}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Status Filter Row */}
                <div className="flex flex-wrap gap-2 pb-2 overflow-x-auto no-scrollbar">
                    {[
                        { value: 'all', label: t.filterAll },
                        { value: 'pending', label: t.filterPending },
                        { value: 'approved', label: t.filterApproved },
                        { value: 'in_transit', label: t.filterInTransit },
                        { value: 'completed', label: t.filterCompleted },
                        { value: 'rejected', label: t.filterRejected },
                    ].map((filter) => {
                        const count = filter.value === 'all' 
                            ? orders.length 
                            : orders.filter(o => {
                                if (filter.value === 'completed') {
                                    return o.status === 'completed' || o.is_delivered === true || (o.delivered_quantity_tons && o.quantity_tons && o.delivered_quantity_tons >= o.quantity_tons);
                                }
                                return o.status === filter.value;
                            }).length;

                        return (
                            <Button
                                key={filter.value}
                                variant={statusFilter === filter.value ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setStatusFilter(filter.value)}
                                className={cn(
                                    "rounded-md px-4 h-9 whitespace-nowrap transition-all font-bold border-gray-200",
                                    statusFilter === filter.value 
                                        ? 'bg-yellow-500 hover:bg-yellow-600 text-black border-yellow-500 shadow-sm' 
                                        : 'text-gray-700 hover:bg-gray-50'
                                )}
                            >
                                {filter.label} ({count})
                            </Button>
                        );
                    })}
                </div>
            </div>

            {/* Orders List */}
            {filteredOrders.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="py-12 text-center">
                        <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium mb-4">{t.noOrders}</p>
                        {(searchTerm || statusFilter !== 'all' || dateRange.from) && (
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                    setSearchTerm('');
                                    setStatusFilter('all');
                                    setDateRange({});
                                }}
                                className="rounded-md"
                            >
                                <X className="w-4 h-4 mr-2" />
                                {t.clearFilters}
                            </Button>
                        )}
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
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-gray-100">
                    <div className="text-sm text-gray-600 font-medium order-2 sm:order-1">
                        {isRTL ? 'מציג' : 'Showing'} {((page - 1) * PAGE_SIZE) + 1}-{Math.min(page * PAGE_SIZE, totalCount)} {isRTL ? 'מתוך' : 'of'} {totalCount} {isRTL ? 'הזמנות' : 'orders'}
                    </div>
                    <div className="flex items-center gap-2 order-1 sm:order-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="rounded-lg h-10 px-4"
                        >
                            {isRTL ? 'הקודם' : 'Previous'}
                        </Button>
                        <div className="px-4 py-2 bg-gray-50 rounded-lg text-sm font-medium text-gray-700 min-w-[100px] text-center">
                            {isRTL ? 'עמוד' : 'Page'} {page} {isRTL ? 'מתוך' : 'of'} {Math.max(1, Math.ceil(totalCount / PAGE_SIZE) || 1)}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => p + 1)}
                            disabled={page >= Math.ceil(totalCount / PAGE_SIZE)}
                            className="rounded-lg h-10 px-4"
                        >
                            {isRTL ? 'הבא' : 'Next'}
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
