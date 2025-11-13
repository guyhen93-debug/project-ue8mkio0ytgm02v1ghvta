import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { Order, Site, Client, User, Notification } from '@/entities';
import { ProductSelector } from '@/components/order/ProductSelector';
import { Calendar, MapPin, Package, FileText, Truck, Hash, Sun, Sunset, Send, ArrowRightLeft, Factory, Building2, TruckIcon, PackageCheck, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Alert, AlertDescription } from '@/components/ui/alert';

const CreateOrder = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [filteredSites, setFilteredSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [useCubicMeters, setUseCubicMeters] = useState(false);
  const [userClient, setUserClient] = useState<any>(null);

  const [formData, setFormData] = useState({
    client_id: '',
    site_id: '',
    supplier: '',
    product_id: '',
    quantity_tons: '',
    delivery_date: '',
    delivery_window: '',
    delivery_method: '',
    notes: ''
  });

  const CUBIC_TO_TON_RATIO = 1.6;

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (formData.client_id) {
      const clientSites = sites.filter(site => site.client_id === formData.client_id);
      setFilteredSites(clientSites);
      
      if (!clientSites.find(s => s.id === formData.site_id)) {
        setFormData(prev => ({ ...prev, site_id: '' }));
      }
    } else {
      setFilteredSites([]);
      setFormData(prev => ({ ...prev, site_id: '' }));
    }
  }, [formData.client_id, sites]);

  useEffect(() => {
    if (formData.supplier) {
      setFormData(prev => ({ ...prev, product_id: '' }));
    }
  }, [formData.supplier]);

  const loadData = async () => {
    try {
      setLoading(true);
      const currentUser = await User.me();
      console.log('Current user:', currentUser);
      setUser(currentUser);

      const [allClients, allSites] = await Promise.all([
        Client.list('-created_at', 1000),
        Site.list('-created_at', 1000)
      ]);

      console.log('All clients:', allClients);
      console.log('All sites:', allSites);

      const activeClients = allClients.filter(c => c.is_active);
      const activeSites = allSites.filter(s => s.is_active);

      setClients(activeClients);
      setSites(activeSites);

      if (currentUser.role === 'client') {
        let matchingClient = activeClients.find(c => 
          c.created_by === currentUser.email || 
          (currentUser.company && c.name === currentUser.company)
        );

        if (!matchingClient && currentUser.email) {
          matchingClient = activeClients.find(c => 
            currentUser.email.toLowerCase().includes(c.name.toLowerCase()) ||
            c.name.toLowerCase().includes(currentUser.email.split('@')[0].toLowerCase())
          );
        }

        console.log('Matching client for user:', matchingClient);
        
        if (matchingClient) {
          setUserClient(matchingClient);
          setFormData(prev => ({ ...prev, client_id: matchingClient.id }));
          console.log('Set client_id to:', matchingClient.id);
        } else {
          console.warn('No matching client found for user');
          toast({
            title: 'שים לב',
            description: 'לא נמצא לקוח משויך למשתמש זה. אנא פנה למנהל המערכת.',
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'שגיאה',
        description: 'נכשל בטעינת הנתונים',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getSelectedSite = () => {
    return sites.find(s => s.id === formData.site_id);
  };

  const getRegionName = () => {
    const site = getSelectedSite();
    if (!site) return '';
    return site.region_type === 'eilat' ? 'אילת' : 'מחוץ לאילת';
  };

  const getDisplayQuantity = () => {
    if (!formData.quantity_tons) return '';
    const tons = parseFloat(formData.quantity_tons);
    if (isNaN(tons)) return formData.quantity_tons;
    
    if (useCubicMeters) {
      return Math.round(tons / CUBIC_TO_TON_RATIO).toString();
    }
    return Math.round(tons).toString();
  };

  const handleDisplayQuantityChange = (value: string) => {
    if (!value) {
      setFormData({ ...formData, quantity_tons: '' });
      return;
    }
    
    const numValue = parseInt(value);
    if (isNaN(numValue)) return;
    
    if (useCubicMeters) {
      const tons = numValue * CUBIC_TO_TON_RATIO;
      setFormData({ ...formData, quantity_tons: Math.round(tons).toString() });
    } else {
      setFormData({ ...formData, quantity_tons: numValue.toString() });
    }
  };

  const getMinimumQuantity = () => {
    if (formData.delivery_method !== 'external') {
      return 0;
    }

    const site = getSelectedSite();
    if (!site) {
      return 20;
    }

    if (site.region_type === 'outside_eilat') {
      return 40;
    }

    return 20;
  };

  const validateQuantity = () => {
    if (!formData.quantity_tons || !formData.delivery_method) {
      return { valid: true, message: '' };
    }

    const quantity = parseInt(formData.quantity_tons);
    const minQuantity = getMinimumQuantity();

    if (formData.delivery_method === 'external' && quantity < minQuantity) {
      const site = getSelectedSite();
      const regionText = site?.region_type === 'outside_eilat' ? 'לאתר מחוץ לאילת' : '';
      return {
        valid: false,
        message: `מינימום הזמנה להובלה חיצונית ${regionText}: ${minQuantity} טון`
      };
    }

    return { valid: true, message: '' };
  };

  const createNotificationsForManagers = async (orderNumber: string, clientName: string) => {
    try {
      const allUsers = await User.list('-created_at', 1000);
      const managers = allUsers.filter(u => u.role === 'manager');
      
      console.log('Creating notifications for managers:', managers);

      const notificationPromises = managers.map(manager => 
        Notification.create({
          recipient_email: manager.email,
          type: 'new_order',
          message: `הזמנה חדשה #${orderNumber} מלקוח ${clientName}`,
          is_read: false,
          order_id: orderNumber
        })
      );

      await Promise.all(notificationPromises);
      console.log('Notifications created successfully');
    } catch (error) {
      console.error('Error creating notifications:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.client_id || !formData.site_id || !formData.supplier || 
        !formData.product_id || !formData.quantity_tons || !formData.delivery_date || 
        !formData.delivery_window || !formData.delivery_method) {
      toast({
        title: 'שגיאה',
        description: 'אנא מלא את כל השדות הנדרשים',
        variant: 'destructive',
      });
      return;
    }

    const quantityValidation = validateQuantity();
    if (!quantityValidation.valid) {
      toast({
        title: 'כמות לא תקינה',
        description: quantityValidation.message,
        variant: 'destructive',
      });
      return;
    }

    if (user?.role === 'client' && userClient && formData.client_id !== userClient.id) {
      toast({
        title: 'שגיאה',
        description: 'אינך מורשה ליצור הזמנה עבור לקוח אחר',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);

      const lastOrder = await Order.list('-order_number', 1);
      let nextOrderNumber = '2001';
      
      if (lastOrder.length > 0 && lastOrder[0].order_number) {
        const lastNumber = parseInt(lastOrder[0].order_number);
        nextOrderNumber = (lastNumber + 1).toString();
      }

      const orderData = {
        order_number: nextOrderNumber,
        client_id: formData.client_id,
        site_id: formData.site_id,
        product_id: formData.product_id,
        quantity_tons: parseInt(formData.quantity_tons),
        delivery_date: formData.delivery_date,
        delivery_window: formData.delivery_window,
        delivery_method: formData.delivery_method,
        supplier: formData.supplier,
        notes: formData.notes,
        status: 'pending',
        unlinked_site: false
      };

      await Order.create(orderData);

      const selectedClient = clients.find(c => c.id === formData.client_id);
      const clientName = selectedClient?.name || 'לקוח';

      await createNotificationsForManagers(nextOrderNumber, clientName);

      toast({
        title: 'הצלחה!',
        description: `הזמנה #${nextOrderNumber} נוצרה בהצלחה`,
      });

      navigate('/client-dashboard');
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: 'שגיאה',
        description: 'נכשל ביצירת ההזמנה',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const suppliers = [
    { id: 'shifuli_har', name_he: 'שיפולי הר', name_en: 'Shifuli Har' },
    { id: 'maavar_rabin', name_he: 'מעבר רבין', name_en: 'Maavar Rabin' }
  ];

  const isManager = user?.role === 'manager';
  const quantityValidation = validateQuantity();

  if (loading) {
    return (
      <Layout title="יצירת הזמנה">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto mb-4"></div>
            <p className="text-gray-600">טוען...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="יצירת הזמנה">
      <div className="p-4 space-y-6 pb-32">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">הזמנה חדשה</h1>
          <p className="text-gray-600">מלא את הפרטים ליצירת הזמנה</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-5 w-5 text-gray-500" />
                {isManager ? 'לקוח ואתר' : 'אתר'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isManager && (
                <div className="space-y-2">
                  <Label htmlFor="client_id" className="text-right block">
                    לקוח <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.client_id}
                    onValueChange={(value) => setFormData({ ...formData, client_id: value })}
                  >
                    <SelectTrigger className="text-right">
                      <SelectValue placeholder="בחר לקוח" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {!isManager && userClient && (
                <div className="p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg border-2 border-yellow-300 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="bg-yellow-500 p-2 rounded-full">
                      <Building2 className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-yellow-700 font-medium mb-1">לקוח</p>
                      <p className="text-base text-gray-900 font-bold">{userClient.name}</p>
                    </div>
                  </div>
                </div>
              )}

              {!isManager && !userClient && (
                <div className="p-4 bg-red-50 rounded-lg border-2 border-red-200">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-red-600" />
                    <p className="text-sm text-red-700">לא נמצא לקוח משויך. אנא פנה למנהל המערכת.</p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="site_id" className="text-right block">
                  אתר <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.site_id}
                  onValueChange={(value) => setFormData({ ...formData, site_id: value })}
                  disabled={!formData.client_id}
                >
                  <SelectTrigger className="text-right">
                    <SelectValue placeholder={formData.client_id ? "בחר אתר" : "בחר לקוח תחילה"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredSites.length > 0 ? (
                      filteredSites.map((site) => (
                        <SelectItem key={site.id} value={site.id}>
                          {site.site_name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-sites" disabled>
                        אין אתרים זמינים
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {formData.site_id && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    <span className="text-sm text-blue-900 font-medium">אזור:</span>
                    <span className="text-sm text-blue-700 font-bold">{getRegionName()}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-5 w-5 text-gray-500" />
                מוצר וכמות
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="supplier" className="text-right block">
                  ספק <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Factory className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10 pointer-events-none" />
                  <Select
                    value={formData.supplier}
                    onValueChange={(value) => setFormData({ ...formData, supplier: value })}
                  >
                    <SelectTrigger className="text-right pr-10">
                      <SelectValue placeholder="בחר ספק" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name_he}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <ProductSelector
                value={formData.product_id}
                onChange={(value) => setFormData({ ...formData, product_id: value })}
                supplier={formData.supplier}
              />

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="h-4 w-4 text-gray-500" />
                  <Label htmlFor="unit-toggle" className="text-sm font-medium cursor-pointer">
                    הצג בקוב (מ"ק)
                  </Label>
                </div>
                <Switch
                  id="unit-toggle"
                  checked={useCubicMeters}
                  onCheckedChange={setUseCubicMeters}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-right block">
                  כמות ({useCubicMeters ? 'מ"ק' : 'טון'}) <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Hash className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    step="1"
                    value={getDisplayQuantity()}
                    onChange={(e) => handleDisplayQuantityChange(e.target.value)}
                    placeholder={useCubicMeters ? 'הזן כמות במ"ק' : 'הזן כמות בטון'}
                    className="text-right pr-10"
                  />
                </div>
                {useCubicMeters && formData.quantity_tons && (
                  <p className="text-xs text-gray-500 text-right">
                    = {Math.round(parseFloat(formData.quantity_tons))} טון
                  </p>
                )}
                <p className="text-xs text-gray-400 text-right">
                  יחס המרה: 1 מ"ק ≈ {CUBIC_TO_TON_RATIO} טון
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-500" />
                פרטי משלוח
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="delivery_date" className="text-right block">
                  תאריך משלוח <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="delivery_date"
                    type="date"
                    value={formData.delivery_date}
                    onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                    className="text-right pr-10"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="delivery_window" className="text-right block">
                  חלון זמן <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.delivery_window}
                  onValueChange={(value) => setFormData({ ...formData, delivery_window: value })}
                >
                  <SelectTrigger className="text-right">
                    <SelectValue placeholder="בחר חלון זמן" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4" />
                        <span>בוקר (08:00-12:00)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="afternoon">
                      <div className="flex items-center gap-2">
                        <Sunset className="h-4 w-4" />
                        <span>אחר הצהריים (12:00-16:00)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="delivery_method" className="text-right block">
                  שיטת משלוח <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.delivery_method}
                  onValueChange={(value) => setFormData({ ...formData, delivery_method: value })}
                >
                  <SelectTrigger className="text-right">
                    <SelectValue placeholder="בחר שיטת משלוח" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="self">
                      <div className="flex items-center gap-2">
                        <TruckIcon className="h-4 w-4" />
                        <span>איסוף עצמי</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="external">
                      <div className="flex items-center gap-2">
                        <PackageCheck className="h-4 w-4" />
                        <span>הובלה חיצונית</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {!quantityValidation.valid && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {quantityValidation.message}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-500" />
                הערות
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="הערות נוספות להזמנה (אופציונלי)"
                className="text-right min-h-[100px]"
              />
            </CardContent>
          </Card>
        </form>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-50">
          <div className="max-w-md mx-auto">
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-6 text-lg"
            >
              {submitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                  <span>שולח...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Send className="h-5 w-5" />
                  <span>שלח הזמנה</span>
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CreateOrder;