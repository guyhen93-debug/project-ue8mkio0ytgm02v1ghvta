import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Order, Product, Client, Site } from '@/entities';
import { Package, Calendar, MapPin, Loader2, Factory, AlertCircle, RefreshCw, FileText, CheckCircle, Clock, Star, Box, Scale, User as UserIcon, Phone, Truck } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { getClientName as resolveClientName } from '@/lib/orderUtils';
import { useLanguage } from '@/contexts/LanguageContext';
import OrderContactDialog from './order/OrderContactDialog';
import OrderConfirmation from './order/OrderConfirmation';
import OrderRating from './order/OrderRating';

interface RecentOrdersListProps {
    limit?: number;
    clientId?: string;
}

const RecentOrdersList: React.FC<RecentOrdersListProps> = ({ limit = 5, clientId }) => {
    const { language } = useLanguage();
    const [orders, setOrders] = useState<any[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
    const [products, setProducts] = useState<Record<string, any>>({});
    const [clients, setClients] = useState<Record<string, any>>({});
    const [sites, setSites] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [supplierFilter, setSupplierFilter] = useState<string>('all');
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

    const toggleExpanded = (orderId: string) => {
        setExpandedOrderId(prev => (prev === orderId ? null : orderId));
    };

    const translations = {
        he: {
            moreDetails: 'פרטים נוספים',
            hideDetails: 'הסתר פרטים',
            contactLabel: 'איש קשר:',
            notesLabel: 'הערות:',
            deliveryNoteLabel: 'תעודת משלוח:',
            driverLabel: 'נהג:',
        },
        en: {
            moreDetails: 'More details',
            hideDetails: 'Hide details',
            contactLabel: 'Contact:',
            notesLabel: 'Notes:',
            deliveryNoteLabel: 'Delivery note:',
            driverLabel: 'Driver:',
        }
    };

    const t = translations[language as keyof typeof translations] || translations.he;

    useEffect(() => {
        loadOrders();
    }, [clientId, limit, retryCount]);

    useEffect(() => {
        applyFilters();
    }, [orders, statusFilter, supplierFilter]);

    const loadOrders = async () => {
        try {
            setLoading(true);
            setError(null);

            await new Promise(resolve => setTimeout(resolve, 300));

            let ordersList = [];
            let allProducts = [];
            let allClients = [];
            let allSites = [];

            try {
                if (clientId) {
                    ordersList = await Order.filter({ client_id: clientId }, '-created_at', limit);
                } else {
                    ordersList = await Order.list('-created_at', limit);
                }
            } catch (orderError) {
                console.error('Error fetching orders:', orderError);
                ordersList = [];
            }

            try {
                [allProducts, allClients, allSites] = await Promise.all([
                    Product.list('-created_at', 1000).catch(() => []),
                    Client.list('-created_at', 1000).catch(() => []),
                    Site.list('-created_at', 1000).catch(() => [])
                ]);
            } catch (dataError) {
                console.error('Error fetching related data:', dataError);
            }

            const productsMap: Record<string, any> = {};
            allProducts.forEach(product => {
                productsMap[product.id] = product;
            });

            const clientsMap: Record<string, any> = {};
            allClients.forEach(client => {
                clientsMap[client.id] = client;
            });

            const sitesMap: Record<string, any> = {};
            allSites.forEach(site => {
                sitesMap[site.id] = site;
            });

            setProducts(productsMap);
            setClients(clientsMap);
            setSites(sitesMap);
            setOrders(ordersList);
            setLoading(false);
        } catch (error) {
            console.error('Error loading orders:', error);
            setError('שגיאה בטעינת ההזמנות. אנא נסה שוב.');
            setLoading(false);

            if (retryCount === 0) {
                setTimeout(() => {
                    setRetryCount(1);
                }, 2000);
            }
        }
    };

    const handleRetry = () => {
        setRetryCount(prev => prev + 1);
    };

    const checkIsCompleted = (order: any) => {
        return order.status === 'completed' || 
               order.is_delivered === true || 
               (order.delivered_quantity_tons && order.quantity_tons && order.delivered_quantity_tons >= order.quantity_tons);
    };

    const applyFilters = () => {
        let filtered = [...orders];

        if (statusFilter !== 'all') {
            filtered = filtered.filter(order => {
                const isCompletedLike = checkIsCompleted(order);

                if (statusFilter === 'completed') {
                    return isCompletedLike;
                }

                return order.status === statusFilter;
            });
        }

        if (supplierFilter !== 'all') {
            filtered = filtered.filter(order => order.supplier === supplierFilter);
        }

        setFilteredOrders(filtered);
    };

    const handleShowContact = (order: any) => {
        setSelectedOrder(order);
        setDialogOpen(true);
    };

    // Calculate counts for each status
    const allCount = orders.length;
    const pendingCount = orders.filter(o => o.status === 'pending').length;
    const approvedCount = orders.filter(o => o.status === 'approved').length;
    const rejectedCount = orders.filter(o => o.status === 'rejected').length;
    const completedCount = orders.filter(o => checkIsCompleted(o)).length;

    const getStatusBadge = (order: any) => {
        const effectiveStatus = checkIsCompleted(order)
            ? 'completed'
            : order.status;

        const statusConfig: Record<string, { label: string; className: string }> = {
            pending: {
                label: 'ממתין',
                className: 'bg-orange-100 text-orange-700 border border-orange-200',
            },
            approved: {
                label: 'אושר',
                className: 'bg-green-100 text-green-700 border border-green-200',
            },
            completed: {
                label: 'הושלם',
                className: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
            },
            in_transit: {
                label: 'בדרך',
                className: 'bg-blue-100 text-blue-700 border border-blue-200',
            },
            rejected: {
                label: 'נדחה',
                className: 'bg-red-100 text-red-700 border border-red-200',
            },
        };

        const config = statusConfig[effectiveStatus] || statusConfig.pending;
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

    const getSiteRegion = (siteId: string) => {
        const site = sites[siteId];
        if (!site || !site.region_type) return '';
        return site.region_type === 'eilat' ? 'אילת' : 'מחוץ לאילת';
    };

    const getSiteContact = (order: any) => {
        const site = sites[order.site_id];
        return {
            name: order.site_contact || site?.contact_name || '',
            phone: order.site_phone || site?.contact_phone || ''
        };
    };

    const getDeliveryMethodLabel = (method: string) => {
        return method === 'self' ? 'הובלה עצמית' : 'הובלה חיצונית';
    };

    const getSupplierName = (supplier: string) => {
        return supplier === 'shifuli_har' ? 'שיפולי הר' : 'מעבר רבין';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-yellow-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 mx-auto mb-3 text-red-400" />
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={handleRetry} variant="outline" className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    נסה שוב
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Filters Section */}
            <div className="space-y-3">
                {/* Status Filter Buttons with Counts */}
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant={statusFilter === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setStatusFilter('all')}
                        className={statusFilter === 'all' ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : ''}
                    >
                        הכל ({allCount})
                    </Button>
                    <Button
                        variant={statusFilter === 'pending' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setStatusFilter('pending')}
                        className={statusFilter === 'pending' ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : ''}
                    >
                        ממתין ({pendingCount})
                    </Button>
                    <Button
                        variant={statusFilter === 'approved' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setStatusFilter('approved')}
                        className={statusFilter === 'approved' ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : ''}
                    >
                        אושר ({approvedCount})
                    </Button>
                    <Button
                        variant={statusFilter === 'rejected' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setStatusFilter('rejected')}
                        className={statusFilter === 'rejected' ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : ''}
                    >
                        נדחה ({rejectedCount})
                    </Button>
                    <Button
                        variant={statusFilter === 'completed' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setStatusFilter('completed')}
                        className={statusFilter === 'completed' ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : ''}
                    >
                        הושלם ({completedCount})
                    </Button>
                </div>

                {/* Supplier Filter */}
                <div className="flex items-center gap-2">
                    <Factory className="h-4 w-4 text-gray-500" />
                    <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="בחר ספק" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">כל הספקים</SelectItem>
                            <SelectItem value="shifuli_har">שיפולי הר</SelectItem>
                            <SelectItem value="maavar_rabin">מעבר רבין</SelectItem>
                        </SelectContent>
                    </Select>
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
                    {filteredOrders.map((order) => {
                        const siteContact = getSiteContact(order);

                        return (
                            <Card key={order.id} className="industrial-card hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <span className="font-bold text-gray-900">#{order.order_number}</span>
                                                {getStatusBadge(order)}
                                                {/* Delivery and confirmation badges */}
                                                {(order.is_delivered || checkIsCompleted(order)) && !order.is_client_confirmed && (
                                                    <Badge className="bg-orange-100 text-orange-800 text-xs">
                                                        <Clock className="w-3 h-3 ml-1" />
                                                        ממתין לאישור לקוח
                                                    </Badge>
                                                )}
                                                {order.is_client_confirmed && (
                                                    <Badge className="bg-green-100 text-green-800 text-xs">
                                                        <CheckCircle className="w-3 h-3 ml-1" />
                                                        אושר ע"י לקוח
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
                                            <p className="text-sm text-gray-600">{getClientName(order)}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2 text-gray-700">
                                            <Box className="h-4 w-4 text-gray-400" />
                                            <span className="font-medium">{getProductName(order.product_id)}</span>
                                        </div>

                                        <div className="flex items-center gap-2 text-gray-700">
                                            <Scale className="h-4 w-4 text-gray-400" />
                                            <span className="font-bold">{order.quantity_tons} טון</span>
                                        </div>

                                        <div className="flex items-center gap-2 text-gray-700">
                                            <Factory className="h-4 w-4 text-gray-400" />
                                            <span className="font-medium text-blue-700">{getSupplierName(order.supplier)}</span>
                                        </div>

                                        <div className="flex items-center gap-2 text-gray-700">
                                            <MapPin className="h-4 w-4 text-gray-400" />
                                            <span>{getSiteName(order.site_id)}</span>
                                            {getSiteRegion(order.site_id) && (
                                                <>
                                                    <span className="text-gray-500">•</span>
                                                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                                        {getSiteRegion(order.site_id)}
                                                    </span>
                                                </>
                                            )}
                                        </div>

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

                                        <div className="flex items-center gap-2 text-gray-700">
                                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                {getDeliveryMethodLabel(order.delivery_method)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Order Confirmation Component */}
                                    {(order.status === 'approved' || order.status === 'completed' || checkIsCompleted(order)) && (
                                        <div className="mt-4">
                                            <OrderConfirmation order={order} onConfirm={loadOrders} />
                                        </div>
                                    )}

                                    {/* Order Rating Component - Show only after confirmation */}
                                    {(order.status === 'approved' || order.status === 'completed' || checkIsCompleted(order)) && order.is_client_confirmed && (
                                        <div className="mt-3">
                                            <OrderRating order={order} onRate={loadOrders} />
                                        </div>
                                    )}

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
                                            {siteContact.name && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <UserIcon className="w-4 h-4 text-gray-500" />
                                                    <span className="font-medium">{t.contactLabel}</span>
                                                    <span>{siteContact.name}</span>
                                                    {siteContact.phone && (
                                                        <a
                                                            href={`tel:${siteContact.phone}`}
                                                            className="text-blue-600 inline-flex items-center gap-1 hover:underline ml-1"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <Phone className="w-3.5 h-3.5" />
                                                            <span>{siteContact.phone}</span>
                                                        </a>
                                                    )}
                                                </div>
                                            )}

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
                        );
                    })}
                </div>
            )}

            {/* Contact Dialog */}
            {selectedOrder && (
                <OrderContactDialog
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    contactName={getSiteContact(selectedOrder).name}
                    contactPhone={getSiteContact(selectedOrder).phone}
                    notes={selectedOrder.notes || ''}
                    orderNumber={selectedOrder.order_number}
                />
            )}
        </div>
    );
};

export default RecentOrdersList;
