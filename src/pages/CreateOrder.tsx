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
import { Calendar, MapPin, Package, FileText, Truck, Hash, Sun, Sunset, Send, ArrowRightLeft, Factory, Building2, TruckIcon, PackageCheck, AlertCircle, Info, User as UserIcon, Phone } from 'lucide-react';
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
      
      // Auto-set delivery method to external for Maavar Rabin
      if (formData.supplier === 'maavar_rabin') {
        setFormData(prev => ({ ...prev, delivery_method: 'external' }));
      }
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
    // Special rule for Maavar Rabin: minimum 40 tons for all orders
    if (formData.supplier === 'maavar_rabin') {
      return 40;
    }

    // For Shifuli Har, only external delivery has minimum requirements
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

  const getMultipleRequirement = () => {
    // Shifuli Har: multiples of 20
    if (formData.supplier === 'shifuli_har') {
      return 20;
    }
    
    // Maavar Rabin: multiples of 40
    if (formData.supplier === 'maavar_rabin') {
      return 40;
    }
    
    return 0;
  };

  const validateQuantity = () => {
    if (!formData.quantity_tons) {
      return { valid: true, message: '' };
    }

    const quantity = parseInt(formData.quantity_tons);
    const minQuantity = getMinimumQuantity();
    const multipleRequirement = getMultipleRequirement();

    // Check multiples requirement
    if (multipleRequirement > 0 && quantity % multipleRequirement !== 0) {
      const supplierName = formData.supplier === 'shifuli_har' ? 'שיפולי הר' : 'מעבר רבין';
      return {
        valid: false,
        message: `הזמנה מ${supplierName} חייבת להיות בכפולות של ${multipleRequirement} טון (${multipleRequirement}, ${multipleRequirement * 2}, ${multipleRequirement * 3}...)`
      };
    }

    // Special validation for Maavar Rabin minimum
    if (formData.supplier === 'maavar_rabin' && quantity < 40) {
      return {
        valid: false,
        message: 'מינימום הזמנה ממעבר רבין: 40 טון'
      };
    }

    // Validation for Shifuli Har external delivery
    if (formData.supplier === 'shifuli_har' && formData.delivery_method === 'external' && quantity < minQuantity) {
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
  const isMaavarRabin = formData.supplier === 'maavar_rabin';
  const selectedSite = getSelectedSite();
  const multipleRequirement = getMultipleRequirement();

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
      <div className="relative min-h-screen">
        <div className="p-4 space-y-6 pb-48">
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

                {formData.site_id && selectedSite && (
                  <div className="space-y-3">
                    {/* Region Info */}
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-blue-600" />
                        <span className="text-sm text-blue-900 font-medium">אזור:</span>
                        <span className="text-sm text-blue-700 font-bold">{getRegionName()}</span>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200 shadow-sm">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 pb-2 border-b border-green-200">
                          <UserIcon className="h-5 w-5 text-green-600" />
                          <span className="text-sm font-bold text-green-900">איש קשר באתר</span>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-700 font-medium">שם:</span>
                            <span className="text-sm text-gray-900 font-bold">
                              {selectedSite.contact_name || 'לא צוין'}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-700 font-medium">טלפון:</span>
                            {selectedSite.contact_phone ? (
                              <a 
                                href={`tel:${selectedSite.contact_phone}`}
                                className="text-sm text-blue-600 hover:text-blue-800 font-bold hover:underline"
                              >
                                {selectedSite.contact_phone}
                              </a>
                            ) : (
                              <span className="text-sm text-gray-500">לא צוין</span>
                            )}
                          </div>
                        </div>
                      </div>
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
                  <Select
                    value={formData.supplier}
                    onValueChange={(value) => setFormData({ ...formData, supplier: value })}
                  >
                    <SelectTrigger className="text-right">
                      <SelectValue placeholder="בחר ספק" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          <div className="flex items-center gap-2">
                            <Factory className="h-4 w-4" />
                            {supplier.name_he}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.supplier && (
                  <>
                    <ProductSelector
                      supplier={formData.supplier}
                      value={formData.product_id}
                      onChange={(value) => setFormData({ ...formData, product_id: value })}
                    />

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="quantity" className="text-right">
                          כמות <span className="text-red-500">*</span>
                        </Label>
                        <div className="flex items-center gap-2">
                          <Label htmlFor="unit-toggle" className="text-sm text-gray-600">
                            {useCubicMeters ? 'מ״ק' : 'טון'}
                          </Label>
                          <Switch
                            id="unit-toggle"
                            checked={useCubicMeters}
                            onCheckedChange={setUseCubicMeters}
                          />
                        </div>
                      </div>
                      <Input
                        id="quantity"
                        type="number"
                        min="0"
                        step={multipleRequirement || "1"}
                        value={getDisplayQuantity()}
                        onChange={(e) => handleDisplayQuantityChange(e.target.value)}
                        placeholder={`הכנס כמות ב${useCubicMeters ? 'מ״ק' : 'טון'}`}
                        className="text-right"
                      />
                      <p className="text-xs text-gray-500 text-right">
                        {useCubicMeters 
                          ? `≈ ${formData.quantity_tons || '0'} טון` 
                          : `≈ ${formData.quantity_tons ? Math.round(parseInt(formData.quantity_tons) / CUBIC_TO_TON_RATIO) : '0'} מ״ק`
                        }
                      </p>
                    </div>

                    {/* Quantity Requirements Info */}
                    {formData.supplier && (
                      <Alert className="bg-blue-50 border-blue-200">
                        <Info className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-sm text-blue-900">
                          <div className="space-y-1">
                            <p className="font-bold">
                              {formData.supplier === 'shifuli_har' ? 'שיפולי הר' : 'מעבר רבין'}:
                            </p>
                            <p>
                              • הזמנה בכפולות של {multipleRequirement} טון בלבד
                            </p>
                            {formData.supplier === 'maavar_rabin' && (
                              <p>• מינימום הזמנה: 40 טון</p>
                            )}
                            {formData.supplier === 'shifuli_har' && formData.delivery_method === 'external' && (
                              <p>• מינימום הזמנה להובלה חיצונית: {getMinimumQuantity()} טון</p>
                            )}
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}

                    {!quantityValidation.valid && formData.quantity_tons && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          {quantityValidation.message}
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  מועד אספקה
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="delivery_date" className="text-right block">
                    תאריך אספקה <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="delivery_date"
                    type="date"
                    value={formData.delivery_date}
                    onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                    className="text-right"
                    min={new Date().toISOString().split('T')[0]}
                  />
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
                          <Sun className="h-4 w-4 text-yellow-500" />
                          בוקר (08:00-12:00)
                        </div>
                      </SelectItem>
                      <SelectItem value="afternoon">
                        <div className="flex items-center gap-2">
                          <Sunset className="h-4 w-4 text-orange-500" />
                          אחר הצהריים (12:00-16:00)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Truck className="h-5 w-5 text-gray-500" />
                  שיטת אספקה
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="delivery_method" className="text-right block">
                    סוג הובלה <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.delivery_method}
                    onValueChange={(value) => setFormData({ ...formData, delivery_method: value })}
                    disabled={isMaavarRabin}
                  >
                    <SelectTrigger className="text-right">
                      <SelectValue placeholder="בחר סוג הובלה" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="self">
                        <div className="flex items-center gap-2">
                          <TruckIcon className="h-4 w-4 text-blue-600" />
                          איסוף עצמי
                        </div>
                      </SelectItem>
                      <SelectItem value="external">
                        <div className="flex items-center gap-2">
                          <PackageCheck className="h-4 w-4 text-green-600" />
                          הובלה חיצונית
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {isMaavarRabin && (
                    <p className="text-xs text-gray-500 text-right">
                      מעבר רבין: הובלה חיצונית בלבד
                    </p>
                  )}
                </div>
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
                  rows={4}
                />
              </CardContent>
            </Card>

            <div className="fixed bottom-20 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-lg z-30">
              <div className="max-w-7xl mx-auto">
                <Button
                  type="submit"
                  disabled={submitting || !quantityValidation.valid}
                  className="w-full piter-yellow text-lg py-6 font-bold"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black ml-2"></div>
                      שולח הזמנה...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5 ml-2" />
                      שלח הזמנה
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default CreateOrder;