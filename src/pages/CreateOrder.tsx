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
import { Order, Site, Client } from '@/entities';
import { superdevClient } from '@/lib/superdev/client';
import { Calendar, MapPin, Package, FileText, Truck, Hash, Sun, Sunset, Send, ArrowRightLeft } from 'lucide-react';
import { format } from 'date-fns';

const CreateOrder = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [filteredSites, setFilteredSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [useCubicMeters, setUseCubicMeters] = useState(false);

  const [formData, setFormData] = useState({
    client_id: '',
    site_id: '',
    product_id: '',
    quantity_tons: '',
    delivery_date: '',
    delivery_window: '',
    delivery_method: '',
    notes: ''
  });

  // Conversion factor: 1 cubic meter ≈ 1.6 tons (average for aggregates)
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

  const loadData = async () => {
    try {
      setLoading(true);
      const currentUser = await superdevClient.auth.me();
      setUser(currentUser);

      const [allClients, allSites] = await Promise.all([
        Client.list('-created_at', 1000),
        Site.list('-created_at', 1000)
      ]);

      setClients(allClients.filter(c => c.is_active));
      setSites(allSites.filter(s => s.is_active));
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

  const handleQuantityChange = (value: string) => {
    setFormData({ ...formData, quantity_tons: value });
  };

  const getDisplayQuantity = () => {
    if (!formData.quantity_tons) return '';
    const tons = parseFloat(formData.quantity_tons);
    if (isNaN(tons)) return formData.quantity_tons;
    
    if (useCubicMeters) {
      return (tons / CUBIC_TO_TON_RATIO).toFixed(2);
    }
    return formData.quantity_tons;
  };

  const handleDisplayQuantityChange = (value: string) => {
    if (!value) {
      setFormData({ ...formData, quantity_tons: '' });
      return;
    }
    
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;
    
    if (useCubicMeters) {
      const tons = numValue * CUBIC_TO_TON_RATIO;
      setFormData({ ...formData, quantity_tons: tons.toFixed(2) });
    } else {
      setFormData({ ...formData, quantity_tons: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.client_id || !formData.site_id || !formData.product_id || 
        !formData.quantity_tons || !formData.delivery_date || 
        !formData.delivery_window || !formData.delivery_method) {
      toast({
        title: 'שגיאה',
        description: 'אנא מלא את כל השדות הנדרשים',
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
        quantity_tons: parseFloat(formData.quantity_tons),
        delivery_date: formData.delivery_date,
        delivery_window: formData.delivery_window,
        delivery_method: formData.delivery_method,
        notes: formData.notes,
        status: 'pending',
        unlinked_site: false
      };

      await Order.create(orderData);

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

  const products = [
    { id: 'granite_10_60', name: 'גרניט 10-60' },
    { id: 'granite_0_10', name: 'גרניט 0-10' },
    { id: 'p_new_sand_0_4', name: 'חול חדש 0-4' },
    { id: 'sand_0_4', name: 'חול 0-4' },
    { id: 'sand_dune', name: 'חול דיונות' },
    { id: 'gravel_10_20', name: 'חצץ 10-20' },
    { id: 'gravel_20_40', name: 'חצץ 20-40' }
  ];

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
      <div className="p-4 space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">הזמנה חדשה</h1>
          <p className="text-gray-600">מלא את הפרטים ליצירת הזמנה</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Client Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-5 w-5 text-gray-500" />
                לקוח ואתר
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                    {filteredSites.map((site) => (
                      <SelectItem key={site.id} value={site.id}>
                        {site.site_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Product and Quantity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-5 w-5 text-gray-500" />
                מוצר וכמות
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product_id" className="text-right block">
                  מוצר <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.product_id}
                  onValueChange={(value) => setFormData({ ...formData, product_id: value })}
                >
                  <SelectTrigger className="text-right">
                    <SelectValue placeholder="בחר מוצר" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Unit Toggle */}
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
                    min="0"
                    step="0.1"
                    value={getDisplayQuantity()}
                    onChange={(e) => handleDisplayQuantityChange(e.target.value)}
                    placeholder={`הזן כמות ב${useCubicMeters ? 'מטרים קוביים' : 'טונים'}`}
                    className="text-right pr-10"
                  />
                </div>
                {useCubicMeters && formData.quantity_tons && (
                  <p className="text-xs text-gray-500 text-right">
                    = {parseFloat(formData.quantity_tons).toFixed(2)} טון
                  </p>
                )}
                <p className="text-xs text-gray-400 text-right">
                  יחס המרה: 1 מ"ק ≈ {CUBIC_TO_TON_RATIO} טון
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Details */}
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
                <Input
                  id="delivery_date"
                  type="date"
                  value={formData.delivery_date}
                  onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className="text-right"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="delivery_window" className="text-right block">
                  חלון אספקה <span className="text-red-500">*</span>
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
                        <span>בוקר (06:00-12:00)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="afternoon">
                      <div className="flex items-center gap-2">
                        <Sunset className="h-4 w-4 text-orange-500" />
                        <span>צהריים (12:00-18:00)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="delivery_method" className="text-right block">
                  שיטת אספקה <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Truck className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10 pointer-events-none" />
                  <Select
                    value={formData.delivery_method}
                    onValueChange={(value) => setFormData({ ...formData, delivery_method: value })}
                  >
                    <SelectTrigger className="text-right pr-10">
                      <SelectValue placeholder="בחר שיטת אספקה" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="self">משלוח עצמי</SelectItem>
                      <SelectItem value="external">הובלה חיצונית</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
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
                placeholder="הוסף הערות נוספות (אופציונלי)"
                className="text-right min-h-[100px]"
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="sticky bottom-20 pt-4">
            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-black h-14 text-lg font-bold shadow-lg hover:shadow-xl transition-all"
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
        </form>
      </div>
    </Layout>
  );
};

export default CreateOrder;