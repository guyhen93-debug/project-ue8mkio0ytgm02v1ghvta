import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { mockDataService } from '@/services/mockDataService';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, MapPin } from 'lucide-react';

const CreateOrder: React.FC = () => {
  const [formData, setFormData] = useState({
    product: '',
    quantity: '',
    delivery_date: '',
    delivery_time: 'morning',
    delivery_type: 'self_transport',
    delivery_location: '',
    notes: '',
    has_truck_access: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMinimumError, setShowMinimumError] = useState(false);
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const products = [
    { value: 'sand_0_3', label: t('sand_0_3') },
    { value: 'sesame_4_9_5', label: t('sesame_4_9_5') },
    { value: 'lentil_9_5_19', label: t('lentil_9_5_19') },
    { value: 'polia_19_25', label: t('polia_19_25') },
    { value: 'granite_10_60', label: t('granite_10_60') }
  ];

  const timeSlots = [
    { value: 'morning', label: t('morning_shift') },
    { value: 'afternoon', label: t('afternoon_shift') }
  ];

  const handleQuantityChange = (value: string) => {
    setFormData({ ...formData, quantity: value });
    
    // Check minimum quantity for external delivery
    if (formData.delivery_type === 'external' && parseFloat(value) < 20 && value !== '') {
      setShowMinimumError(true);
    } else {
      setShowMinimumError(false);
    }
  };

  const handleDeliveryTypeChange = (value: string) => {
    setFormData({ ...formData, delivery_type: value });
    
    // Check minimum quantity when delivery type changes
    if (value === 'external' && formData.quantity && parseFloat(formData.quantity) < 20) {
      setShowMinimumError(true);
    } else {
      setShowMinimumError(false);
    }
  };

  const shareLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const locationString = `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`;
          setFormData({ 
            ...formData, 
            delivery_location: formData.delivery_location + (formData.delivery_location ? '\n' : '') + locationString 
          });
          toast({
            title: language === 'he' ? 'מיקום נשתף' : 'Location Shared',
            description: language === 'he' ? 'המיקום שלך נוסף לכתובת האספקה' : 'Your location has been added to the delivery address',
          });
        },
        (error) => {
          toast({
            title: language === 'he' ? 'שגיאה בשיתוף מיקום' : 'Location Error',
            description: language === 'he' ? 'לא ניתן לגשת למיקום שלך' : 'Unable to access your location',
            variant: 'destructive',
          });
        }
      );
    } else {
      toast({
        title: language === 'he' ? 'שיתוף מיקום לא נתמך' : 'Location Not Supported',
        description: language === 'he' ? 'הדפדפן שלך לא תומך בשיתוף מיקום' : 'Your browser does not support location sharing',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate minimum quantity for external delivery
    if (formData.delivery_type === 'external' && parseFloat(formData.quantity) < 20) {
      toast({
        title: language === 'he' ? 'כמות לא מספיקה' : 'Insufficient Quantity',
        description: t('minimum_quantity_required'),
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const timeMapping = {
        morning: '09:00',
        afternoon: '14:00'
      };
      
      const deliveryDateTime = `${formData.delivery_date}T${timeMapping[formData.delivery_time]}:00`;
      
      await mockDataService.createOrder({
        client_id: user.id,
        client_name: user.name,
        client_company: user.company,
        product: formData.product,
        quantity: parseFloat(formData.quantity),
        delivery_date: deliveryDateTime,
        delivery_type: formData.delivery_type,
        delivery_location: formData.delivery_location,
        status: 'pending',
        notes: formData.notes + (formData.has_truck_access ? '' : '\n' + (language === 'he' ? 'אין מקום לפול טריילר - דאבל בלבד' : 'No full trailer access - double only'))
      });

      toast({
        title: t('order_submitted'),
        description: t('order_submitted'),
      });

      navigate('/client');
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: language === 'he' ? 'שגיאה' : 'Error',
        description: language === 'he' ? 'נכשל בשליחת ההזמנה. אנא נסו שוב.' : 'Failed to submit order. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = () => {
    return formData.product && 
           formData.quantity && 
           formData.delivery_date && 
           formData.delivery_location.trim() &&
           !(formData.delivery_type === 'external' && parseFloat(formData.quantity) < 20);
  };

  return (
    <Layout title={t('create_order')} showBottomNav={false}>
      <div className="px-4 py-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/client')}
            className="p-2 hover:bg-white rounded-xl"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('create_order')}
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="text-xl font-bold">{t('order_details')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Product Selection */}
              <div className="space-y-3">
                <Label htmlFor="product" className="text-base font-bold">
                  {t('product')} *
                </Label>
                <Select
                  value={formData.product}
                  onValueChange={(value) => setFormData({ ...formData, product: value })}
                >
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder={t('select_product')} />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.value} value={product.value}>
                        {product.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quantity */}
              <div className="space-y-3">
                <Label htmlFor="quantity" className="text-base font-bold">
                  {t('quantity')} *
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={formData.quantity}
                  onChange={(e) => handleQuantityChange(e.target.value)}
                  placeholder={t('enter_quantity')}
                  className="h-12 text-base"
                  required
                />
                {showMinimumError && (
                  <p className="text-red-600 text-sm font-semibold">
                    {t('minimum_quantity_required')}
                  </p>
                )}
              </div>

              {/* Delivery Date */}
              <div className="space-y-3">
                <Label htmlFor="delivery_date" className="text-base font-bold">
                  {t('delivery_date')} *
                </Label>
                <Input
                  id="delivery_date"
                  type="date"
                  value={formData.delivery_date}
                  onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="h-12 text-base"
                  required
                />
              </div>

              {/* Time Selection */}
              <div className="space-y-3">
                <Label className="text-base font-bold">{t('time')} *</Label>
                <RadioGroup
                  value={formData.delivery_time}
                  onValueChange={(value) => setFormData({ ...formData, delivery_time: value })}
                  className="space-y-3"
                >
                  {timeSlots.map((slot) => (
                    <div key={slot.value} className="flex items-center space-x-3">
                      <RadioGroupItem value={slot.value} id={slot.value} />
                      <Label htmlFor={slot.value} className="text-base font-semibold">
                        {slot.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Delivery Type */}
              <div className="space-y-3">
                <Label className="text-base font-bold">{t('delivery_type')} *</Label>
                <RadioGroup
                  value={formData.delivery_type}
                  onValueChange={handleDeliveryTypeChange}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="self_transport" id="self_transport" />
                    <Label htmlFor="self_transport" className="text-base font-semibold">
                      {t('self_transport')}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="external" id="external" />
                    <Label htmlFor="external" className="text-base font-semibold">
                      {t('external')}
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Truck Access Checkbox */}
              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <Checkbox
                  id="truck_access"
                  checked={formData.has_truck_access}
                  onCheckedChange={(checked) => setFormData({ ...formData, has_truck_access: checked as boolean })}
                />
                <Label htmlFor="truck_access" className="text-base font-semibold">
                  {t('truck_access')}
                </Label>
              </div>

              {/* Delivery Location */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="delivery_location" className="text-base font-bold">
                    {t('delivery_location')} *
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={shareLocation}
                    className="text-sm"
                  >
                    <MapPin className="h-4 w-4 mr-1" />
                    {t('share_location')}
                  </Button>
                </div>
                <Textarea
                  id="delivery_location"
                  value={formData.delivery_location}
                  onChange={(e) => setFormData({ ...formData, delivery_location: e.target.value })}
                  placeholder={t('enter_address')}
                  rows={4}
                  className="text-base"
                  required
                />
              </div>

              {/* Notes */}
              <div className="space-y-3">
                <Label htmlFor="notes" className="text-base font-bold">
                  {t('additional_notes')}
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder={t('special_instructions')}
                  rows={3}
                  className="text-base"
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="mt-6 space-y-4">
            <Button
              type="submit"
              className="w-full h-14 bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-lg shadow-lg"
              size="lg"
              disabled={!isFormValid() || isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              {t('submit_order')}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 font-bold text-base"
              onClick={() => navigate('/client')}
            >
              {t('cancel')}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default CreateOrder;