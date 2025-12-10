import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ClientManagement } from '@/components/admin/ClientManagement';
import { SiteManagement } from '@/components/admin/SiteManagement';
import { ProductManagement } from '@/components/admin/ProductManagement';
import { OrderManagement } from '@/components/admin/OrderManagement';
import { UserManagement } from '@/components/admin/UserManagement';
import { Order, Product, Site, Client } from '@/entities';
import { useLanguage } from '@/contexts/LanguageContext';
import { Users, Building2, Package2, ClipboardList, UserCog, History, Search, RefreshCw, Package, MapPin, Calendar, CheckCircle, Clock, Star, Factory } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

const AdminPanel: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { language } = useLanguage();
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'orders');

    // History tab state
    const [historyOrders, setHistoryOrders] = useState<any[]>([]);
    const [filteredHistoryOrders, setFilteredHistoryOrders] = useState<any[]>([]);
    const [products, setProducts] = useState<Record<string, any>>({});
    const [sites, setSites] = useState<Record<string, any>>({});
    const [clients, setClients] = useState<Record<string, any>>({});
    const [historyLoading, setHistoryLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [clientFilter, setClientFilter] = useState('all');
    const [siteFilter, setSiteFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    const translations = {
        he: {
            title: 'פאנל ניהול',
            orders: 'הזמנות',
            history: 'כל ההזמנות',
            clients: 'לקוחות',
            sites: 'אתרים',
            products: 'מוצרים',
            users: 'משתמשים',
            search: 'חיפוש...',
            refresh: 'רענן',
            filterByClient: 'סנן לפי לקוח',
            filterBySite: 'סנן לפי אתר',
            filterByStatus: 'סנן לפי סטטוס',
            allClients: 'כל הלקוחות',
            allSites: 'כל האתרים',
            allStatuses: 'כל הסטטוסים',
            pending: 'ממתין',
            approved: 'מאושר',
            rejected: 'נדחה',
            completed: 'הושלם',
            noOrders: 'אין הזמנות להצגה',
            orderNumber: 'הזמנה',
            client: 'לקוח',
            site: 'אתר',
            product: 'מוצר',
            quantity: 'כמות',
            tons: 'טון',
            deliveryDate: 'תאריך',
            confirmed: 'אושר',
            rated: 'דורג',
            supplier: 'ספק',
            shifuliHar: 'שיפולי הר',
            maavarRabin: 'מעבר רבין'
        },
        en: {
            title: 'Admin Panel',
            orders: 'Orders',
            history: 'All Orders',
            clients: 'Clients',
            sites: 'Sites',
            products: 'Products',
            users: 'Users',
            search: 'Search...',
            refresh: 'Refresh',
            filterByClient: 'Filter by client',
            filterBySite: 'Filter by site',
            filterByStatus: 'Filter by status',
            allClients: 'All clients',
            allSites: 'All sites',
            allStatuses: 'All statuses',
            pending: 'Pending',
            approved: 'Approved',
            rejected: 'Rejected',
            completed: 'Completed',
            noOrders: 'No orders to display',
            orderNumber: 'Order',
            client: 'Client',
            site: 'Site',
            product: 'Product',
            quantity: 'Quantity',
            tons: 'tons',
            deliveryDate: 'Date',
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
        const tab = searchParams.get('tab');
        if (tab) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    useEffect(() => {
        if (activeTab === 'history') {
            loadHistoryData();
        }
    }, [activeTab]);

    useEffect(() => {
        applyHistoryFilters();
    }, [historyOrders, searchTerm, clientFilter, siteFilter, statusFilter]);

    const loadHistoryData = async () => {
        try {
            setHistoryLoading(true);

            const [ordersData, productsData, sitesData, clientsData] = await Promise.all([
                Order.list('-created_at', 1000),
                Product.list('-created_at', 1000),
                Site.list('-created_at', 1000),
                Client.list('-created_at', 1000)
            ]);

            const productsMap: Record<string, any> = {};
            productsData.forEach(p => { productsMap[p.id] = p; });

            const sitesMap: Record<string, any> = {};
            sitesData.forEach(s => { sitesMap[s.id] = s; });

            const clientsMap: Record<string, any> = {};
            clientsData.forEach(c => { clientsMap[c.id] = c; });

            setProducts(productsMap);
            setSites(sitesMap);
            setClients(clientsMap);
            setHistoryOrders(ordersData);
            setHistoryLoading(false);
        } catch (error) {
            console.error('Error loading history:', error);
            setHistoryLoading(false);
        }
    };

    const applyHistoryFilters = () => {
        let filtered = [...historyOrders];

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(order =>
                order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                getProductName(order.product_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
                getSiteName(order.site_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
                getClientName(order.site_id).toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Client filter
        if (clientFilter !== 'all') {
            filtered = filtered.filter(order => {
                const site = sites[order.site_id];
                return site?.client_id === clientFilter;
            });
        }

        // Site filter
        if (siteFilter !== 'all') {
            filtered = filtered.filter(order => order.site_id === siteFilter);
        }

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(order => order.status === statusFilter);
        }

        setFilteredHistoryOrders(filtered);
    };

    const getProductName = (productId: string) => {
        const product = products[productId];
        return product ? (language === 'he' ? product.name_he : product.name_en) : productId;
    };

    const getSiteName = (siteId: string) => {
        const site = sites[siteId];
        return site?.site_name || '';
    };

    const getClientName = (siteId: string) => {
        const site = sites[siteId];
        if (!site) return '';
        const client = clients[site.client_id];
        return client?.name || '';
    };

    const getSupplierName = (supplier: string) => {
        return supplier === 'shifuli_har' ? t.shifuliHar : t.maavarRabin;
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

    const uniqueClients = Array.from(new Set(
        Object.values(sites).map((site: any) => site.client_id)
    )).map(clientId => clients[clientId]).filter(Boolean);

    return (
        <Layout title={t.title}>
            <div className="p-3 sm:p-4 md:p-6 pb-24" dir={isRTL ? 'rtl' : 'ltr'}>
                <Card className="industrial-card">
                    <CardHeader className="p-3 sm:p-6">
                        <CardTitle className="text-xl sm:text-2xl font-bold">{t.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-6 pt-0">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 gap-2 h-auto bg-transparent p-0 mb-6">
                                <TabsTrigger
                                    value="orders"
                                    className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black flex items-center gap-2 py-3 px-4"
                                >
                                    <ClipboardList className="w-4 h-4" />
                                    <span>{t.orders}</span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="history"
                                    className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black flex items-center gap-2 py-3 px-4"
                                >
                                    <History className="w-4 h-4" />
                                    <span>{t.history}</span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="clients"
                                    className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black flex items-center gap-2 py-3 px-4"
                                >
                                    <Users className="w-4 h-4" />
                                    <span>{t.clients}</span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="sites"
                                    className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black flex items-center gap-2 py-3 px-4"
                                >
                                    <Building2 className="w-4 h-4" />
                                    <span>{t.sites}</span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="products"
                                    className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black flex items-center gap-2 py-3 px-4"
                                >
                                    <Package2 className="w-4 h-4" />
                                    <span>{t.products}</span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="users"
                                    className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black flex items-center gap-2 py-3 px-4"
                                >
                                    <UserCog className="w-4 h-4" />
                                    <span>{t.users}</span>
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="orders" className="mt-0">
                                <OrderManagement />
                            </TabsContent>

                            <TabsContent value="history" className="mt-0">
                                <div className="space-y-4">
                                    {/* Filters */}
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <div className="relative flex-1">
                                            <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4`} />
                                            <Input
                                                placeholder={t.search}
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className={isRTL ? 'pr-10' : 'pl-10'}
                                            />
                                        </div>
                                        <Select value={clientFilter} onValueChange={setClientFilter}>
                                            <SelectTrigger className="w-full sm:w-[200px]">
                                                <SelectValue placeholder={t.filterByClient} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">{t.allClients}</SelectItem>
                                                {uniqueClients.map((client) => (
                                                    <SelectItem key={client.id} value={client.id}>
                                                        {client.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Select value={siteFilter} onValueChange={setSiteFilter}>
                                            <SelectTrigger className="w-full sm:w-[200px]">
                                                <SelectValue placeholder={t.filterBySite} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">{t.allSites}</SelectItem>
                                                {Object.values(sites).map((site: any) => (
                                                    <SelectItem key={site.id} value={site.id}>
                                                        {site.site_name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                                            <SelectTrigger className="w-full sm:w-[180px]">
                                                <SelectValue placeholder={t.filterByStatus} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">{t.allStatuses}</SelectItem>
                                                <SelectItem value="pending">{t.pending}</SelectItem>
                                                <SelectItem value="approved">{t.approved}</SelectItem>
                                                <SelectItem value="rejected">{t.rejected}</SelectItem>
                                                <SelectItem value="completed">{t.completed}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Button variant="outline" onClick={loadHistoryData} size="icon">
                                            <RefreshCw className="w-4 h-4" />
                                        </Button>
                                    </div>

                                    {/* Orders List */}
                                    {historyLoading ? (
                                        <div className="text-center py-12">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto"></div>
                                        </div>
                                    ) : filteredHistoryOrders.length === 0 ? (
                                        <Card>
                                            <CardContent className="py-12 text-center">
                                                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                                <p className="text-gray-600">{t.noOrders}</p>
                                            </CardContent>
                                        </Card>
                                    ) : (
                                        <div className="space-y-3">
                                            {filteredHistoryOrders.map((order) => (
                                                <Card key={order.id} className="industrial-card hover:shadow-md transition-shadow">
                                                    <CardContent className="p-4">
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                                    <span className="font-bold text-sm">
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
                                                                <p className="text-xs text-gray-600">{getClientName(order.site_id)}</p>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2 text-sm">
                                                            <div className="flex items-center gap-2 text-gray-700">
                                                                <MapPin className="h-4 w-4 text-gray-400" />
                                                                <span>{getSiteName(order.site_id)}</span>
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
                            </TabsContent>

                            <TabsContent value="clients" className="mt-0">
                                <ClientManagement />
                            </TabsContent>

                            <TabsContent value="sites" className="mt-0">
                                <SiteManagement />
                            </TabsContent>

                            <TabsContent value="products" className="mt-0">
                                <ProductManagement />
                            </TabsContent>

                            <TabsContent value="users" className="mt-0">
                                <UserManagement />
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
};

export default AdminPanel;