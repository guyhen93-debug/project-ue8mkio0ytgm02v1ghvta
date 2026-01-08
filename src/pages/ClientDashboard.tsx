import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Order, Site, Product, User, Client, Notification } from '@/entities';
import type { Order as OrderType, User as UserType, Client as ClientType, Site as SiteType, Product as ProductType } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { Plus, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { he as heLocale } from 'date-fns/locale';
import NotificationsCard from '@/components/NotificationsCard';
import { getStatusConfig } from '@/lib/orderUtils';
import { cn } from '@/lib/utils';

const ClientDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [sites, setSites] = useState<SiteType[]>([]);
  const [products, setProducts] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<UserType | null>(null);
  const [userClient, setUserClient] = useState<ClientType | null>(null);

  const translations = {
    he: {
      title: 'דשבורד לקוח',
      welcome: 'ברוך הבא',
      greeting: 'שלום',
      client: 'לקוח',
      myOrders: '📦 ההזמנות האחרונות שלי',
      createOrder: 'צור הזמנה חדשה',
      noOrders: 'אין לך הזמנות עדיין',
      statusTitle: '⚡ סטטוס הזמנות',
      statusOpen: 'פתוחות',
      statusInTransit: 'בדרך',
      statusCompleted: 'הושלמו',
      viewAllMyOrders: 'צפה בכל ההזמנות',
      errorTitle: 'שגיאה בטעינת הנתונים',
      errorMessage: 'ניסיון לטעון מחדש את הדף או לבדוק את החיבור לרשת.',
      retry: 'נסה שוב',
      moreDetails: 'פרטים נוספים',
      hideDetails: 'הסתר פרטים',
      contactLabel: 'איש קשר:',
      notesLabel: 'הערות:',
      deliveryNoteLabel: 'תעודת משלוח:',
      driverLabel: 'נהג:',
    },
    en: {
      title: 'Client Dashboard',
      welcome: 'Welcome',
      greeting: 'Hello',
      client: 'Client',
      myOrders: '📦 My Recent Orders',
      createOrder: 'Create New Order',
      noOrders: 'You have no orders yet',
      statusTitle: '⚡ Order Status',
      statusOpen: 'Open',
      statusInTransit: 'In Transit',
      statusCompleted: 'Completed',
      viewAllMyOrders: 'View all orders',
      errorTitle: 'Error loading data',
      errorMessage: 'Please try again or check your network connection.',
      retry: 'Retry',
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

  // Compute client-specific stats
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const isInCurrentMonth = (dateString?: string) => {
    if (!dateString) return false;
    const d = new Date(dateString);
    return d >= startOfMonth && d <= now;
  };

  const { openOrdersCount, inTransitCount, completedThisMonthCount } = useMemo(() => {
    const checkIsCompleted = (o: OrderType) => {
      return o.status === 'completed' || 
             o.is_delivered === true || 
             (o.delivered_quantity_tons && o.quantity_tons && o.delivered_quantity_tons >= o.quantity_tons);
    };

    const open = orders.filter(o => !checkIsCompleted(o) && (o.status === 'pending' || o.status === 'approved')).length;
    const inTransit = orders.filter(o => !checkIsCompleted(o) && (o.status === 'in_transit' || o.status === 'in-transit')).length;
    
    const completed = orders.filter(o => 
      checkIsCompleted(o) && 
      (isInCurrentMonth(o.delivery_date) || isInCurrentMonth(o.actual_delivery_date) || isInCurrentMonth(o.created_at))
    ).length;

    return {
      openOrdersCount: open,
      inTransitCount: inTransit,
      completedThisMonthCount: completed,
    };
  }, [orders]);

  const displayName = (user && (user.full_name || user.email)) || (userClient && userClient.name) || '';

  // Get top 5 recent orders
  const recentOrders = useMemo(
    () => (orders || []).slice(0, 5),
    [orders]
  );

  // Quick lookup for product names
  const productsById = useMemo(() => {
    const map: Record<string, ProductType> = {};
    products.forEach((p) => {
      (map as any)[p.id] = p;
    });
    return map;
  }, [products]);

  const getProductName = (productId?: string) => {
    if (!productId) return '';
    const product = productsById[productId];
    if (!product) return language === 'he' ? 'מוצר לא ידוע' : 'Unknown product';
    return language === 'he'
      ? (product as any).name_he || (product as any).name_en || (product as any).product_id
      : (product as any).name_en || (product as any).name_he || (product as any).product_id;
  };

  const formatOrderDate = (dateString?: string) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return language === 'he'
      ? format(d, 'dd/MM/yyyy', { locale: heLocale })
      : format(d, 'dd/MM/yyyy');
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setError(null);
      setLoading(true);
      const currentUser = await User.me() as unknown as UserType;
      setUser(currentUser);

      const [allClientsRaw, sitesData, productsData] = await Promise.all([
        Client.list('-created_at', 1000),
        Site.list('-created_at', 1000),
        Product.list('-created_at', 1000)
      ]);

      const allClients = allClientsRaw as unknown as ClientType[];

      // Find user's client
      let matchingClient = allClients.find(c => 
        c.created_by === currentUser.email || 
        (currentUser.company && c.name === currentUser.company)
      );

      if (!matchingClient && currentUser.email) {
        matchingClient = allClients.find(c => 
          currentUser.email.toLowerCase().includes(c.name.toLowerCase()) ||
          c.name.toLowerCase().includes(currentUser.email.split('@')[0].toLowerCase())
        );
      }

      if (matchingClient) {
        setUserClient(matchingClient);
        
        // Load client's orders
        const clientOrdersRaw = await Order.filter({ client_id: matchingClient.id }, '-created_at', 1000);
        setOrders(clientOrdersRaw as unknown as OrderType[]);
      }
      
      setSites(sitesData as unknown as SiteType[]);
      setProducts(productsData as unknown as ProductType[]);
    } catch (error) {
      console.error('Error loading data:', error);
      setError(t.errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title={t.title}>
      <div className="p-3 sm:p-4 md:p-6 pb-24" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Error Alert */}
        {error && (
          <div className="mb-4">
            <Alert variant="destructive">
              <AlertTitle>{t.errorTitle}</AlertTitle>
              <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-1">
                <span>{error}</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-300 text-red-700 hover:bg-red-50"
                  onClick={loadData}
                >
                  {t.retry}
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Personalized Greeting */}
        <div className="mb-6">
          <p className="text-sm text-gray-500 mb-1">{t.welcome}</p>
          <h1 className="text-xl sm:text-2xl font-bold flex items-baseline gap-2">
            <span>👋</span>
            {t.greeting},
            <span className="text-yellow-600">{displayName || t.client}</span>
          </h1>
        </div>

        {/* Highlighted Quick Action */}
        <div className="mb-6">
          <Button
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-6"
            onClick={() => navigate('/create-order')}
          >
            <Plus className="w-5 h-5 mr-2" />
            {t.createOrder}
          </Button>
        </div>

        {/* Status Tiles Grid */}
        <div className="mb-6">
          <h2 className="text-base sm:text-lg font-semibold mb-3 flex items-center gap-2">
            {t.statusTitle}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Open Orders Tile */}
            <div className="rounded-xl border border-orange-100 bg-orange-50 px-4 py-3 shadow-sm flex flex-col gap-1">
              <span className="text-xs font-medium text-orange-800 uppercase tracking-wide">
                {t.statusOpen}
              </span>
              <span className="text-2xl font-bold text-orange-700">
                {openOrdersCount}
              </span>
            </div>

            {/* In Transit Tile */}
            <div className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 shadow-sm flex flex-col gap-1">
              <span className="text-xs font-medium text-sky-800 uppercase tracking-wide">
                {t.statusInTransit}
              </span>
              <span className="text-2xl font-bold text-sky-700">
                {inTransitCount}
              </span>
            </div>

            {/* Completed Tile */}
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 shadow-sm flex flex-col gap-1">
              <span className="text-xs font-medium text-emerald-800 uppercase tracking-wide">
                {t.statusCompleted}
              </span>
              <span className="text-2xl font-bold text-emerald-700">
                {completedThisMonthCount}
              </span>
            </div>
          </div>
        </div>

        {/* Notifications Card */}
        <div className="mb-6">
          <NotificationsCard />
        </div>

        {/* Recent Orders */}
        <Card className="industrial-card">
          <CardHeader className="p-3 sm:p-4 md:p-5 border-b">
            <CardTitle className="text-base sm:text-lg flex items-center justify-between gap-2">
              <span>{t.myOrders}</span>
              <Button
                variant="link"
                size="sm"
                className="p-0 h-auto text-xs sm:text-sm text-yellow-600 hover:text-yellow-700"
                onClick={() => navigate('/order-history')}
              >
                {t.viewAllMyOrders}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-12 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500" />
              </div>
            ) : userClient && recentOrders.length > 0 ? (
              <div className="divide-y">
                {recentOrders.map((order) => {
                  const effectiveStatus = (order.status === 'completed' || (order as any).is_delivered ||
                    ((order as any).delivered_quantity_tons && order.quantity_tons && (order as any).delivered_quantity_tons >= order.quantity_tons))
                    ? 'completed'
                    : order.status;
                  const status = getStatusConfig(effectiveStatus, language);
                  const productName = getProductName((order as any).product_id);

                  return (
                    <div
                      key={order.id}
                      className="p-3 sm:p-4 hover:bg-gray-50 cursor-pointer flex items-center justify-between gap-4 transition-colors"
                      onClick={() => navigate('/order-history')}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-900 text-sm sm:text-base truncate">
                          #{order.order_number}
                        </div>
                        <div className="text-[11px] sm:text-xs text-gray-500 mt-0.5 truncate">
                          {productName} • {order.quantity_tons}ט' • {formatOrderDate(order.delivery_date)}
                        </div>
                      </div>
                      <div
                        className={cn(
                          "px-2 py-1 rounded text-[10px] sm:text-xs font-semibold whitespace-nowrap border shadow-sm",
                          status.className
                        )}
                      >
                        {status.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 text-sm">
                {t.noOrders}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ClientDashboard;
