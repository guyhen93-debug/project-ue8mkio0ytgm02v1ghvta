import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Order, Product, Client, Site } from '@/entities';
import { Package, Calendar, MapPin, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface RecentOrdersListProps {
  limit?: number;
  clientId?: string;
}

const RecentOrdersList: React.FC<RecentOrdersListProps> = ({ limit = 5, clientId }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<Record<string, any>>({});
  const [clients, setClients] = useState<Record<string, any>>({});
  const [sites, setSites] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, [clientId, limit]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      
      let ordersList;
      if (clientId) {
        ordersList = await Order.filter({ client_id: clientId }, '-created_at', limit);
      } else {
        ordersList = await Order.list('-created_at', limit);
      }

      // טעינת כל המוצרים, לקוחות ואתרים
      const [allProducts, allClients, allSites] = await Promise.all([
        Product.list('-created_at', 1000),
        Client.list('-created_at', 1000),
        Site.list('-created_at', 1000)
      ]);

      // יצירת מפות לגישה מהירה
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
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
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

  const getDeliveryMethodLabel = (method: string) => {
    return method === 'self' ? 'הובלה עצמית' : 'הובלה חיצונית';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-yellow-500" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
        <p>אין הזמנות להצגה</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
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
                <MapPin className="h-4 w-4 text-gray-400" />
                <span>{getSiteName(order.site_id)}</span>
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
  );
};

export default RecentOrdersList;