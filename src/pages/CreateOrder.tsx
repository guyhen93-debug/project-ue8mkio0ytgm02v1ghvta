import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Order } from '@/entities';
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
    product_id: '',
    quantity: '',
    delivery_date: undefined as Date | undefined,
    time_slot: '',
    delivery_type: '',
    site_name: '',
    delivery_location: '',
    quarry: '',
    notes: '',
    truck_access: true
  });
  
  const [loading, setLoading] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const products = [
    { id: 'p_new_sand_0_4', name: t('p_new_sand_0_4') },
    { id: 'sesame_4_9_5', name: t('sesame_4_9_5') },
    { id: 'lentil_9_5_19', name: t('lentil_9_5_19') },
    { id: 'polia_19_25', name: t('polia_19_25') },
    { id: 'granite_10_60', name: t('granite_10_60') }
  ];

  const quarries = [
    { id: 'shifolei_har', name: t('shifolei_har') },
    { id: 'yitzhak_rabin', name: t('yitzhak_rabin') }
  ];

  const timeSlots = [
    { 
      id: 'morning', 
      label: isRTL ? 'בוקר (07:00–12:00)' : 'Morning (07:00–12:00)'
    },
    { 
      id: 'afternoon', 
      label: isRTL ? 'צהריים (12:00–17:00)' : 'Afternoon (12:00–17:00)'
    }
  ];

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

    // Validation
    if (!formData.product_id || !formData.quantity || !formData.delivery_date || 
        !formData.time_slot || !formData.delivery_type || !formData.delivery_location) {
      toast({
        title: t('validation_error'),
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    // Validate quantity for external delivery
    if (formData.delivery_type === 'external') {
      const quantity = parseFloat(formData.quantity);
      if (quantity < 20 || quantity % 20 !== 0) {
        toast({
          title: t('validation_error'),
          description: t('external_multiple_20'),
          variant: 'destructive'
        });
        return;
      }
    }

    // Validate date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (formData.delivery_date < today) {
      toast({
        title: t('validation_error'),
        description: t('past_date'),
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);
      
      const orderData = {
        product_id: formData.product_id,
        quantity: parseFloat(formData.quantity),
        delivery_date: formData.delivery_date.toISOString(),
        time_slot: formData.time_slot,
        delivery_type: formData.delivery_type,
        site_name: formData.site_name,
        delivery_location: formData.delivery_location,
        quarry: formData.quarry || 'shifolei_har',
        notes: formData.notes,
        truck_access: formData.truck_access,
        status: 'pending',
        created_by: user.email
      };

      await Order.create(orderData);
      
      toast({
        title: t('order_submitted'),
        description: t('order_submitted_description')
      });
      
      navigate('/client');
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: t('error'),
        description: t('order_submission_failed'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
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
                  <SelectTrigger>
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
                  {t('quantity')} *
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  step="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                  placeholder={t('enter_quantity')}
                />
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
                        !formData.delivery_date && "text-muted-foreground"
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

              {/* Time Slot */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {t('time')} *
                </Label>
                <RadioGroup
                  value={formData.time_slot}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, time_slot: value }))}
                  className={cn("grid grid-cols-1 gap-3", isRTL && "text-right")}
                >
                  {timeSlots.map((slot) => (
                    <div key={slot.id} className="flex items-center space-x-2 space-x-reverse">
                      <RadioGroupItem value={slot.id} id={slot.id} />
                      <Label 
                        htmlFor={slot.id} 
                        className={cn("cursor-pointer", isRTL && "mr-2 ml-0")}
                      >
                        {slot.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Delivery Type */}
              <div className="space-y-3">
                <Label>{t('delivery_type')} *</Label>
                <RadioGroup
                  value={formData.delivery_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, delivery_type: value }))}
                  className={cn("grid grid-cols-1 gap-3", isRTL && "text-right")}
                >
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="self_transport" id="self_transport" />
                    <Label 
                      htmlFor="self_transport" 
                      className={cn("cursor-pointer", isRTL && "mr-2 ml-0")}
                    >
                      {t('self_transport')}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="external" id="external" />
                    <Label 
                      htmlFor="external" 
                      className={cn("cursor-pointer", isRTL && "mr-2 ml-0")}
                    >
                      {t('external')}
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Site Name */}
              <div className="space-y-2">
                <Label htmlFor="site_name" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {t('site_name')}
                </Label>
                <Input
                  id="site_name"
                  value={formData.site_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, site_name: e.target.value }))}
                  placeholder={t('site_name')}
                />
              </div>

              {/* Delivery Location */}
              <div className="space-y-2">
                <Label htmlFor="delivery_location">
                  {t('delivery_location')} *
                </Label>
                <Textarea
                  id="delivery_location"
                  value={formData.delivery_location}
                  onChange={(e) => setFormData(prev => ({ ...prev, delivery_location: e.target.value }))}
                  placeholder={t('enter_address')}
                  rows={3}
                />
              </div>

              {/* Quarry Selection */}
              <div className="space-y-2">
                <Label htmlFor="quarry">
                  {t('quarry_crossing')}
                </Label>
                <Select 
                  value={formData.quarry} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, quarry: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('select_quarry')} />
                  </SelectTrigger>
                  <SelectContent>
                    {quarries.map((quarry) => (
                      <SelectItem key={quarry.id} value={quarry.id}>
                        {quarry.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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