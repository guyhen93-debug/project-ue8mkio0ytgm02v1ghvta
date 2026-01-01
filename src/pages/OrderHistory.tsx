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
import { Package, Calendar, MapPin, Loader2, AlertCircle, RefreshCw, CheckCircle, Clock, Star, Factory } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { getClientName as resolveClientName } from '@/lib/orderUtils';

const OrderHistory: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { language } = useLanguage();
    const [orders, setOrders] = useState<any[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
    const [products, setProducts] = useState<Record<string, any>>({});
    const [sites, setSites] = useState<Record<string, any>>({});
    const [clients, setClients] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const translations = {
        he: {
            title: 'ההזמנות שלי',
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
            delivered: 'סופק',
            confirmed: 'אושר',
            rated: 'דורג',
            supplier: 'ספק',
            shifuliHar: 'שיפולי הר',
            maavarRabin: 'מעבר רבין'
        },
        en: {
            title: 'My Orders',
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
            delivered: 'Delivered',
            confirmed: 'Confirmed',
            rated: 'Rated',
            supplier: 'Supplier',
            shifuliHar: 'Shifuli Har',
            maavarRabin: 'Maavar Rabin'
        }
    };

    const t = translations[language];
    const isRTL = language === 'he';

    useEffect(() => {
        loadOrders();
    }, [user]);

    useEffect(() => {
        applyFilters();
    }, [orders, statusFilter, dateRange]);

    const loadOrders = async () => {
        if (!user) {
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
            filtered = filtered.filter(order => order.status === statusFilter);
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

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            pending: { label: t.pending, className: 'bg-yellow-100 text-yellow-800' },
            approved: { label: t.approved, className: 'bg-green-100 text-green-800' },
            rejected: { label: t.rejected, className: 'bg-red-100 text-red-800' },
            completed: { label: t.completed, className: 'bg-blue-100 text-blue-800' }
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
        return <Badge className={config.className}>{config.label}</Badge>;
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

    const getSupplierName = (supplier: string) => {
        return supplier === 'shifuli_har' ? t.shifuliHar : t.maavarRabin;
    };

    // Calculate counts for each status
    const allCount = orders.length;
    const pendingCount = orders.filter(o => o.status === 'pending').length;
    const approvedCount = orders.filter(o => o.status === 'approved').length;
    const rejectedCount = orders.filter(o => o.status === 'rejected').length;
    const completedCount = orders.filter(o => o.status === 'completed').length;

    if (loading) {
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
                            className={statusFilter === 'all' ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : ''}
                        >
                            {t.filterAll} ({allCount})
                        </Button>
                        <Button
                            variant={statusFilter === 'pending' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setStatusFilter('pending')}
                            className={statusFilter === 'pending' ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : ''}
                        >
                            {t.filterPending} ({pendingCount})
                        </Button>
                        <Button
                            variant={statusFilter === 'approved' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setStatusFilter('approved')}
                            className={statusFilter === 'approved' ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : ''}
                        >
                            {t.filterApproved} ({approvedCount})
                        </Button>
                        <Button
                            variant={statusFilter === 'rejected' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setStatusFilter('rejected')}
                            className={statusFilter === 'rejected' ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : ''}
                        >
                            {t.filterRejected} ({rejectedCount})
                        </Button>
                        <Button
                            variant={statusFilter === 'completed' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setStatusFilter('completed')}
                            className={statusFilter === 'completed' ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : ''}
                        >
                            {t.filterCompleted} ({completedCount})
                        </Button>
                    </div>
                </div>

                {/* Orders List */}
                {filteredOrders.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-600">{t.noOrders}</p>
                        </CardContent>
                    </Card>
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
                                                {getStatusBadge(order.status)}
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
                                            <Package className="h-4 w-4 text-gray-400" />
                                            <span className="font-medium">{getProductName(order.product_id)}</span>
                                            <span className="text-gray-500">•</span>
                                            <span className="font-bold">{order.quantity_tons} {t.tons}</span>
                                        </div>

                                        {order.supplier && (
                                            <div className="flex items-center gap-2 text-gray-700">
                                                <Factory className="h-4 w-4 text-gray-400" />
                                                <span className="font-medium text-blue-700">{getSupplierName(order.supplier)}</span>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2 text-gray-700">
                                            <Calendar className="h-4 w-4 text-gray-400" />
                                            <span>
                                                {format(new Date(order.delivery_date), 'dd/MM/yyyy', { locale: he })}
                                            </span>
                                            <span className="text-gray-500">•</span>
                                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                                {order.delivery_window === 'morning' ? 'בוקר' : 'צהריים'}
                                            </span>
                                        </div>
                                    </div>
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