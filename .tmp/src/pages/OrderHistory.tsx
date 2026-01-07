import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Order, Product, Site, Client } from '@/entities';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Package, Calendar as CalendarIcon, MapPin, Loader2, AlertCircle, RefreshCw, CheckCircle, Clock, Star, Factory, X, Plus, Sparkles, Box, Scale, User as UserIcon, Phone, Truck, FileText } from 'lucide-react';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { he } from 'date-fns/locale';
import { getClientName as resolveClientName } from '@/lib/orderUtils';

const OrderHistory: React.FC = () => {
    const navigate = useNavigate();
    const { user, isManager } = useAuth();
    const { language } = useLanguage();
    const [orders, setOrders] = useState<any[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
    const [products, setProducts] = useState<Record<string, any>>({});
    const [sites, setSites] = useState<Record<string, any>>({});
    const [clients, setClients] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

    const toggleExpanded = (orderId: string) => {
        setExpandedOrderId(prev => (prev === orderId ? null : orderId));
    };

    const translations = {
        he: {
            title: 'הזמנות',
            filterAll: 'הכל',
            filterPending: 'ממתין',
            filterApproved: 'מאושר',
            filterRejected: 'נדחה',
            filterCompleted: 'הושלם',
            noOrders: 'אין הזמנות להצגה',
            error: 'שגיאה בטעינת הזמנות',
            retry: 'נסה שוב',
            orderNumber: 'הזמנה',
            product: 'מוצר',
            site: 'אתר',
            quantity: 'כמות',
            tons: 'טון',
            deliveryDate: 'תאריך',
            status: 'סטטוס',
            pending: 'ממתין',
            approved: 'מאושר',
            rejected: 'נדחה',
            completed: 'הושלם',
            inTransit: 'בדרך',
            delivered: 'סופק',
            confirmed: 'אושר',
            rated: 'דורג',
            supplier: 'ספק',
            shifuliHar: 'שיפולי הר',
            maavarRabin: 'מעבר רבין',
            dateRangeLabel: 'טווח תאריכים',
            clearFilter: 'נקה',
            createOrderButton: 'צור הזמנה חדשה',
            moreDetails: 'פרטים נוספים',
            hideDetails: 'הסתר פרטים',
            contactLabel: 'איש קשר:',
            notesLabel: 'הערות:',
            deliveryNoteLabel: 'תעודת משלוח:',
            driverLabel: 'נהג:',
        },
        en: {
            title: 'Orders',
            filterAll: 'All',
            filterPending: 'Pending',
            filterApproved: 'Approved',
            filterRejected: 'Rejected',
            filterCompleted: 'Completed',
            noOrders: 'No orders to display',
            error: 'Error loading orders',
            retry: 'Retry',
            orderNumber: 'Order',
            product: 'Product',
            site: 'Site',
            quantity: 'Quantity',
            tons: 'tons',
            deliveryDate: 'Date',
            status: 'Status',
            pending: 'Pending',
            approved: 'Approved',
            rejected: 'Rejected',
            completed: 'Completed',
            inTransit: 'In Transit',
            delivered: 'Delivered',
            confirmed: 'Confirmed',
            rated: 'Rated',
            supplier: 'Supplier',
            shifuliHar: 'Shifuli Har',
            maavarRabin: 'Maavar Rabin',
            dateRangeLabel: 'Date range',
            clearFilter: 'Clear',
            createOrderButton: 'Create New Order',
            moreDetails: 'More details',
            hideDetails: 'Hide details',
            contactLabel: 'Contact:',
            notesLabel: 'Notes:',
            deliveryNoteLabel: 'Delivery note:',
            driverLabel: 'Driver:',
        }
    };

    const t = translations[language];
    const isRTL = language === 'he';

    useEffect(() => {
        if (isManager) {
            navigate('/orders', { replace: true });
            return;
        }
        loadOrders();
    }, [user, isManager, navigate]);

    useEffect(() => {
        applyFilters();
    }, [orders, statusFilter, dateRange]);

    const loadOrders = async () => {
        if (!user || isManager) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Load all user's orders
            const ordersList = await Order.filter({ created_by: user.email }, '-created_at', 1000);

            // Load products, sites, and clients
            const [allProducts, allSites, allClients] = await Promise.all([
                Product.list('-created_at', 1000).catch(() => []),
                Site.list('-created_at', 1000).catch(() => []),
                Client.list('-created_at', 1000).catch(() => [])
            ]);

            const productsMap: Record<string, any> = {};
            allProducts.forEach(product => {
                productsMap[product.id] = product;
            });

            const sitesMap: Record<string, any> = {};
            allSites.forEach(site => {
                sitesMap[site.id] = site;
            });

            const clientsMap: Record<string, any> = {};
            allClients.forEach(client => {
                clientsMap[client.id] = client;
            });

            setProducts(productsMap);
            setSites(sitesMap);
            setClients(clientsMap);
            setOrders(ordersList);
            setLoading(false);
        } catch (error) {
            console.error('Error loading orders:', error);
            setError(t.error);
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...orders];

        if (statusFilter !== 'all') {
            filtered = filtered.filter(order => {
                const isCompletedLike =
                    order.status === 'completed' ||
                    order.is_delivered === true ||
                    (order.delivered_quantity_tons && order.quantity_tons && order.delivered_quantity_tons >= order.quantity_tons);

                if (statusFilter === 'completed') {
                    return isCompletedLike;
                }

                return order.status === statusFilter;
            });
        }

        if (dateRange?.from) {
            const from = startOfDay(dateRange.from);
            const to = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
            
            filtered = filtered.filter(order => {
                const orderDate = new Date(order.delivery_date);
                return isWithinInterval(orderDate, { start: from, end: to });
            });
        }

        setFilteredOrders(filtered);
    };

    const handleRetry = () => {
        loadOrders();
    };

    const getStatusBadge = (order: any) => {
        const effectiveStatus = (order.status === 'completed' || order.is_delivered)
            ? 'completed'
            : order.status;

        const statusConfig = {
            pending: { label: t.pending, className: 'bg-orange-100 text-orange-700 border border-orange-200' },
            approved: { label: t.approved, className: 'bg-green-100 text-green-700 border border-green-200' },
            rejected: { label: t.rejected, className: 'bg-red-100 text-red-700 border border-red-200' },
            completed: { label: t.completed, className: 'bg-emerald-100 text-emerald-700 border border-emerald-200' },
            in_transit: { label: t.inTransit, className: 'bg-blue-100 text-blue-700 border border-blue-200' },
        };

        const config = statusConfig[effectiveStatus as keyof typeof statusConfig] || statusConfig.pending;
        return <Badge className={cn("px-2.5 py-1 text-[11px] font-semibold rounded-full", config.className)}>{config.label}</Badge>;
    };

    const getProductName = (productId: string) => {
        const product = products[productId];
        if (!product) return 'מוצר לא ידוע';
        return product.name_he || product.name_en || product.product_id || 'מוצר לא ידוע';
    };

    const getClientName = (order: any) => {
        return resolveClientName(order, sites, clients);
    };

    const getSiteName = (siteId: string) => {
        const site = sites[siteId];
        return site?.site_name || 'אתר לא ידוע';
    };

    const getSiteContact = (order: any) => {
        const site = sites[order.site_id];
        return {
            name: order.site_contact || site?.contact_name || '',
            phone: order.site_phone || site?.contact_phone || ''
        };
    };

    const getSupplierName = (supplier: string) => {
        return supplier === 'shifuli_har' ? t.shifuliHar : t.maavarRabin;
    };

    // Calculate counts for each status
    const allCount = orders.length;
    const pendingCount = orders.filter(o => o.status === 'pending').length;
    const approvedCount = orders.filter(o => o.status === 'approved').length;
    const rejectedCount = orders.filter(o => o.status === 'rejected').length;
    const completedCount = orders.filter(o => (
        o.status === 'completed' ||
        o.is_delivered === true ||
        (o.delivered_quantity_tons && o.quantity_tons && o.delivered_quantity_tons >= o.quantity_tons)
    )).length;

    if (loading || isManager) {
        return (
            <Layout title={t.title}>
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
                </div>
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout title={t.title}>
                <div className="text-center py-8 p-4">
                    <AlertCircle className="h-12 w-12 mx-auto mb-3 text-red-400" />
                    <p className="text-red-600 mb-4">{error}</p>
                    <Button onClick={handleRetry} variant="outline" className="gap-2">
                        <RefreshCw className="h-4 w-4" />
                        {t.retry}
                    </Button>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title={t.title}>
            <div className="p-3 sm:p-4 md:p-6 pb-24" dir={isRTL ? 'rtl' : 'ltr'}>
                {/* Create New Order Button */}
                <div className="mb-6">
                    <Button
                        className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-6"
                        onClick={() => navigate('/create-order')}
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        צור הזמנה חדשה
                    </Button>
                </div>

                {/* Filters */}
                <div className="mb-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-full sm:w-[260px] justify-start text-left font-normal",
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
                                className="h-8 px-2 text-xs"
                            >
                                <X className="w-3 h-3 ml-1" />
                                {t.clearFilter}
                            </Button>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant={statusFilter === 'all' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setStatusFilter('all')}
                            className={statusFilter === 'all' ? 'bg-yellow-500 hover:bg-yellow-600 text-black border-yellow-500' : ''}
                        >
                            {t.filterAll} ({allCount})
                        </Button>
                        <Button
                            variant={statusFilter === 'pending' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setStatusFilter('pending')}
                            className={statusFilter === 'pending' ? 'bg-yellow-500 hover:bg-yellow-600 text-black border-yellow-500' : ''}
                        >
                            {t.filterPending} ({pendingCount})
                        </Button>
                        <Button
                            variant={statusFilter === 'approved' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setStatusFilter('approved')}
                            className={statusFilter === 'approved' ? 'bg-yellow-500 hover:bg-yellow-600 text-black border-yellow-500' : ''}
                        >
                            {t.filterApproved} ({approvedCount})
                        </Button>
                        <Button
                            variant={statusFilter === 'rejected' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setStatusFilter('rejected')}
                            className={statusFilter === 'rejected' ? 'bg-yellow-500 hover:bg-yellow-600 text-black border-yellow-500' : ''}
                        >
                            {t.filterRejected} ({rejectedCount})
                        </Button>
                        <Button
                            variant={statusFilter === 'completed' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setStatusFilter('completed')}
                            className={statusFilter === 'completed' ? 'bg-yellow-500 hover:bg-yellow-600 text-black border-yellow-500' : ''}
                        >
                            {t.filterCompleted} ({completedCount})
                        </Button>
                    </div>
                </div>

                {/* Orders List */}
                {filteredOrders.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>אין הזמנות להצגה</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredOrders.map((order) => (
                            <Card key={order.id} className="industrial-card hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <span className="font-bold text-gray-900">
                                                    {t.orderNumber} #{order.order_number}
                                                </span>
                                                {getStatusBadge(order)}
                                                {order.is_client_confirmed && (
                                                    <Badge className="bg-green-100 text-green-800 text-xs">
                                                        <CheckCircle className="w-3 h-3 ml-1" />
                                                        {t.confirmed}
                                                    </Badge>
                                                )}
                                                {order.rating && (
                                                    <Badge className="bg-purple-100 text-purple-800 text-xs">
                                                        <Star className="w-3 h-3 ml-1 fill-purple-600" />
                                                        {order.rating}/5
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">{getClientName(order)}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2 text-gray-700">
                                            <MapPin className="h-4 w-4 text-gray-400" />
                                            <span className="font-medium">{getSiteName(order.site_id)}</span>
                                        </div>

                                        <div className="flex items-center gap-2 text-gray-700">
                                            <Box className="h-4 w-4 text-gray-400" />
                                            <span className="font-medium">{getProductName(order.product_id)}</span>
                                        </div>

                                        <div className="flex items-center gap-2 text-gray-700">
                                            <Scale className="h-4 w-4 text-gray-400" />
                                            <span className="font-bold">{order.quantity_tons} {t.tons}</span>
                                        </div>

                                        {order.supplier && (
                                            <div className="flex items-center gap-2 text-gray-700">
                                                <Factory className="h-4 w-4 text-gray-400" />
                                                <span className="font-medium text-blue-700">{getSupplierName(order.supplier)}</span>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2 text-gray-700">
                                            <CalendarIcon className="h-4 w-4 text-gray-400" />
                                            <span>
                                                {format(new Date(order.delivery_date), 'dd/MM/yyyy', { locale: he })}
                                            </span>
                                            <span className="text-gray-500">•</span>
                                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                                {order.delivery_window === 'morning' ? 'בוקר' : 'צהריים'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* More Details Toggle */}
                                    <div className="mt-4 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleExpanded(order.id);
                                            }}
                                            className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                                        >
                                            <span className="font-medium">
                                                {expandedOrderId === order.id ? t.hideDetails : t.moreDetails}
                                            </span>
                                            <span className="text-[10px]">
                                                {expandedOrderId === order.id ? '▲' : '▼'}
                                            </span>
                                        </button>
                                    </div>

                                    {/* Expandable Details Section */}
                                    {expandedOrderId === order.id && (
                                        <div className="mt-4 pt-4 border-t space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                            {/* Contact person */}
                                            {(() => {
                                                const contact = getSiteContact(order);
                                                return contact.name && (
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <UserIcon className="w-4 h-4 text-gray-500" />
                                                        <span className="font-medium">{t.contactLabel}</span>
                                                        <span>{contact.name}</span>
                                                        {contact.phone && (
                                                            <a
                                                                href={`tel:${contact.phone}`}
                                                                className="text-blue-600 inline-flex items-center gap-1 hover:underline ml-1"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <Phone className="w-3.5 h-3.5" />
                                                                <span>{contact.phone}</span>
                                                            </a>
                                                        )}
                                                    </div>
                                                );
                                            })()}

                                            {/* Notes */}
                                            {order.notes && (
                                                <div className="flex items-start gap-2 text-sm">
                                                    <FileText className="w-4 h-4 text-gray-500 mt-0.5" />
                                                    <div>
                                                        <span className="font-medium">{t.notesLabel}</span>
                                                        <p className="text-gray-600 mt-1 whitespace-pre-wrap leading-relaxed">{order.notes}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Delivery note number */}
                                            {order.delivery_note_number && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <FileText className="w-4 h-4 text-gray-500" />
                                                    <span className="font-medium">{t.deliveryNoteLabel}</span>
                                                    <span className="font-mono text-xs sm:text-sm bg-gray-50 px-1.5 py-0.5 rounded border">
                                                        {order.delivery_note_number}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Driver */}
                                            {order.driver_name && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Truck className="w-4 h-4 text-gray-500" />
                                                    <span className="font-medium">{t.driverLabel}</span>
                                                    <span>{order.driver_name}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default OrderHistory;
