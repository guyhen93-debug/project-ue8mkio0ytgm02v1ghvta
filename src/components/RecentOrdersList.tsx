import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Order, Product, Client, Site } from '@/entities';
import { Package, Calendar, MapPin, Loader2, Factory, AlertCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface RecentOrdersListProps {
  limit?: number;
  clientId?: string;
}

const RecentOrdersList: React.FC<RecentOrdersListProps> = ({ limit = 5, clientId }) => {
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

  const applyFilters = () => {
    let filtered = [...orders];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    if (supplierFilter !== 'all') {
      filtered = filtered.filter(order => order.supplier === supplierFilter);
    }

    setFilteredOrders(filtered);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'ממתין', className: 'status-pending' },
      approved: { label: 'אושר', className: 'status-approved' },
      rejected: { label: 'נדחה', className: 'status-rejected' },
      completed: { label: 'הושלם', className: 'status-completed' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getProductName = (productId: string) => {
    const product = products[productId];
    if (!product) return 'מוצר לא ידוע';
    return product.name_he || product.name_en || product.product_id || 'מוצר לא ידוע';
  };

  const getClientName = (clientId: string) => {
    const client = clients[clientId];
    return client?.name || 'לקוח לא ידוע';
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
        {/* Status Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('all')}
            className={statusFilter === 'all' ? 'piter-yellow' : ''}
          >
            הכל
          </Button>
          <Button
            variant={statusFilter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('pending')}
            className={statusFilter === 'pending' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' : ''}
          >
            ממתין
          </Button>
          <Button
            variant={statusFilter === 'approved' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('approved')}
            className={statusFilter === 'approved' ? 'bg-green-100 text-green-800 hover:bg-green-200' : ''}
          >
            אושר
          </Button>
          <Button
            variant={statusFilter === 'rejected' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('rejected')}
            className={statusFilter === 'rejected' ? 'bg-red-100 text-red-800 hover:bg-red-200' : ''}
          >
            נדחה
          </Button>
          <Button
            variant={statusFilter === 'completed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('completed')}
            className={statusFilter === 'completed' ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' : ''}
          >
            הושלם
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
          {filteredOrders.map((order) => (
            <Card key={order.id} className="industrial-card hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-900">#{order.order_number}</span>
                      {getStatusBadge(order.status)}
                    </div>
                    <p className="text-sm text-gray-600">{getClientName(order.client_id)}</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Package className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{getProductName(order.product_id)}</span>
                    <span className="text-gray-500">•</span>
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentOrdersList;