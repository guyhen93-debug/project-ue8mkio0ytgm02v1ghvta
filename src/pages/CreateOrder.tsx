import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { OrderService, CreateOrderData } from '@/services/orderService';
import { Site, Client } from '@/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from '@/hooks/use-toast';
import { CalendarIcon, MapPin, Package, Clock, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { he, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const CreateOrder: React.FC = () => {
  const { t, language, isRTL } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    client_id: '',
    site_id: '',
    product_id: '',
    quantity_tons: '',
    delivery_date: undefined as Date | undefined,
    delivery_window: '',
    delivery_method: '',
    notes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [sites, setSites] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedSite, setSelectedSite] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (formData.site_id) {
      const site = sites.find(s => s.id === formData.site_id);
      setSelectedSite(site);
      if (site && site.client_id) {
        setFormData(prev => ({ ...prev, client_id: site.client_id }));
      }
    }
  }, [formData.site_id, sites]);

  const loadData = async () => {
    try {
      const [sitesData, clientsData] = await Promise.all([
        Site.filter({ is_active: true }, '-created_at'),
        Client.filter({ is_active: true }, '-created_at')
      ]);
      setSites(sitesData);
      setClients(clientsData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const products = [
    { id: 'p_new_sand_0_4', name: t('p_new_sand_0_4') },
    { id: 'sesame_4_9_5', name: t('sesame_4_9_5') },
    { id: 'lentil_9_5_19', name: t('lentil_9_5_19') },
    { id: 'polia_19_25', name: t('polia_19_25') },
    { id: 'granite_10_60', name: t('granite_10_60') }
  ];

  const deliveryWindows = [
    { 
      id: 'morning', 
      label: isRTL ? 'בוקר (07:00–12:00)' : 'Morning (07:00–12:00)'
    },
    { 
      id: 'afternoon', 
      label: isRTL ? 'צהריים (12:00–17:00)' : 'Afternoon (12:00–17:00)'
    }
  ];

  const getValidationMessage = (errorKey: string): string => {
    const messages = {
      he: {
        min_outside_eilat: 'לאתרים שמחוץ לאילת חובה להזמין מינימום של 40 טון בהובלה חיצונית.',
        multiples_of_20: 'בהובלה חיצונית הכמות חייבת להיות בכפולות של 20.',
        site_required: 'בחר אתר אספקה מהרשימה.',
        window_required: 'בחר חלון אספקה (בוקר/צהריים).',
        past_date: 'תאריך האספקה לא יכול להיות בעבר.'
      },
      en: {
        min_outside_eilat: 'For sites outside Eilat, a minimum of 40 tons is required for external delivery.',
        multiples_of_20: 'For external delivery, quantity must be in multiples of 20.',
        site_required: 'Please select a delivery site from the list.',
        window_required: 'Please select a delivery window (Morning/Afternoon).',
        past_date: 'Delivery date cannot be in the past.'
      }
    };

    return messages[language as keyof typeof messages]?.[errorKey as keyof typeof messages.en] || errorKey;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.email) {
      toast({
        title: t('error'),
        description: t('login_error'),
        variant: 'destructive'
      });
      return;
    }

    if (!formData.delivery_date) {
      toast({
        title: t('validation_error'),
        description: getValidationMessage('window_required'),
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);
      
      const orderData: CreateOrderData = {
        client_id: formData.client_id,
        site_id: formData.site_id,
        product_id: formData.product_id,
        quantity_tons: parseFloat(formData.quantity_tons),
        delivery_date: formData.delivery_date.toISOString(),
        delivery_window: formData.delivery_window as 'morning' | 'afternoon',
        delivery_method: formData.delivery_method as 'self' | 'external',
        notes: formData.notes
      };

      await OrderService.createOrder(orderData, user.email);
      
      toast({
        title: t('order_submitted'),
        description: t('order_submitted_description')
      });
      
      navigate('/client');
    } catch (error: any) {
      console.error('Error creating order:', error);
      
      // Handle validation errors
      if (error.message.includes('Validation failed:')) {
        const errorKeys = error.message.replace('Validation failed: ', '').split(', ');
        const errorMessages = errorKeys.map(getValidationMessage).join('\n');
        
        toast({
          title: t('validation_error'),
          description: errorMessages,
          variant: 'destructive'
        });
      } else {
        toast({
          title: t('error'),
          description: t('order_submission_failed'),
          variant: 'destructive'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const getSiteDisplayName = (site: any): string => {
    const client = clients.find(c => c.id === site.client_id);
    return `${site.site_name} (${client?.name || 'Unknown Client'})`;
  };

  return (
    <Layout title={t('create_order')}>
      <div className="p-4 max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              {t('create_new_order')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Site Selection - Dropdown Only */}
              <div className="space-y-2">
                <Label htmlFor="site" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {isRTL ? "בחר אתר אספקה" : "Select Delivery Site"} *
                </Label>
                <Select 
                  value={formData.site_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, site_id: value }))}
                >
                  <SelectTrigger className={cn(isRTL ? "text-right" : "text-left")}>
                    <SelectValue placeholder={isRTL ? "בחר אתר אספקה" : "Select Delivery Site"} />
                  </SelectTrigger>
                  <SelectContent>
                    {sites.map((site) => (
                      <SelectItem key={site.id} value={site.id}>
                        {getSiteDisplayName(site)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedSite && (
                  <div className="text-sm text-gray-600 mt-2">
                    <p>{isRTL ? "איש קשר:" : "Contact:"} {selectedSite.contact_name}</p>
                    <p>{isRTL ? "טלפון:" : "Phone:"} {selectedSite.contact_phone}</p>
                    <p>{isRTL ? "אזור:" : "Region:"} {t(selectedSite.region_type)}</p>
                  </div>
                )}
              </div>

              {/* Product Selection */}
              <div className="space-y-2">
                <Label htmlFor="product" className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  {t('product')} *
                </Label>
                <Select 
                  value={formData.product_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, product_id: value }))}
                >
                  <SelectTrigger className={cn(isRTL ? "text-right" : "text-left")}>
                    <SelectValue placeholder={t('select_product')} />
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

              {/* Quantity */}
              <div className="space-y-2">
                <Label htmlFor="quantity">
                  {t('quantity')} ({t('tons')}) *
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  step="1"
                  value={formData.quantity_tons}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity_tons: e.target.value }))}
                  placeholder={t('enter_quantity')}
                  className={cn(isRTL ? "text-right" : "text-left")}
                />
                {formData.delivery_method === 'external' && selectedSite?.region_type === 'outside_eilat' && (
                  <p className="text-sm text-amber-600">
                    {getValidationMessage('min_outside_eilat')}
                  </p>
                )}
                {formData.delivery_method === 'external' && (
                  <p className="text-sm text-blue-600">
                    {getValidationMessage('multiples_of_20')}
                  </p>
                )}
              </div>

              {/* Delivery Date */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  {t('delivery_date')} *
                </Label>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.delivery_date && "text-muted-foreground",
                        isRTL && "text-right"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.delivery_date ? (
                        format(formData.delivery_date, "PPP", { 
                          locale: language === 'he' ? he : enUS 
                        })
                      ) : (
                        <span>{t('delivery_date')}</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.delivery_date}
                      onSelect={(date) => {
                        setFormData(prev => ({ ...prev, delivery_date: date }));
                        setCalendarOpen(false);
                      }}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      locale={language === 'he' ? he : enUS}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Delivery Window */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {isRTL ? "חלון אספקה" : "Delivery Window"} *
                </Label>
                <RadioGroup
                  value={formData.delivery_window}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, delivery_window: value }))}
                  className={cn("grid grid-cols-1 gap-3")}
                >
                  {deliveryWindows.map((window) => (
                    <div key={window.id} className={cn(
                      "flex items-center gap-2",
                      isRTL ? "flex-row-reverse" : "flex-row"
                    )}>
                      <RadioGroupItem value={window.id} id={window.id} />
                      <Label 
                        htmlFor={window.id} 
                        className="cursor-pointer"
                      >
                        {window.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Delivery Method */}
              <div className="space-y-3">
                <Label>{isRTL ? "שיטת אספקה" : "Delivery Method"} *</Label>
                <RadioGroup
                  value={formData.delivery_method}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, delivery_method: value }))}
                  className={cn("grid grid-cols-1 gap-3")}
                >
                  <div className={cn(
                    "flex items-center gap-2",
                    isRTL ? "flex-row-reverse" : "flex-row"
                  )}>
                    <RadioGroupItem value="self" id="self" />
                    <Label 
                      htmlFor="self" 
                      className="cursor-pointer"
                    >
                      {t('self_transport')}
                    </Label>
                  </div>
                  <div className={cn(
                    "flex items-center gap-2",
                    isRTL ? "flex-row-reverse" : "flex-row"
                  )}>
                    <RadioGroupItem value="external" id="external" />
                    <Label 
                      htmlFor="external" 
                      className="cursor-pointer"
                    >
                      {t('external')}
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Additional Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  {t('additional_notes')}
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder={t('special_instructions')}
                  rows={3}
                  className={cn(isRTL ? "text-right" : "text-left")}
                />
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-medium"
                disabled={loading}
              >
                {loading ? t('loading') : t('submit_order')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default CreateOrder;