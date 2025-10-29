import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockDataService } from '@/services/mockDataService';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2 } from 'lucide-react';

// Import form components
import ProductSelector from '@/components/order/ProductSelector';
import QuantityInput from '@/components/order/QuantityInput';
import DeliveryDateInput from '@/components/order/DeliveryDateInput';
import TimeSlotSelector from '@/components/order/TimeSlotSelector';
import DeliveryTypeSelector from '@/components/order/DeliveryTypeSelector';
import TruckAccessCheckbox from '@/components/order/TruckAccessCheckbox';
import DeliveryLocationInput from '@/components/order/DeliveryLocationInput';
import NotesInput from '@/components/order/NotesInput';

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
              <ProductSelector
                value={formData.product}
                onChange={(value) => setFormData({ ...formData, product: value })}
              />

              <QuantityInput
                value={formData.quantity}
                onChange={handleQuantityChange}
                showMinimumError={showMinimumError}
              />

              <DeliveryDateInput
                value={formData.delivery_date}
                onChange={(value) => setFormData({ ...formData, delivery_date: value })}
              />

              <TimeSlotSelector
                value={formData.delivery_time}
                onChange={(value) => setFormData({ ...formData, delivery_time: value })}
              />

              <DeliveryTypeSelector
                value={formData.delivery_type}
                onChange={handleDeliveryTypeChange}
              />

              <TruckAccessCheckbox
                checked={formData.has_truck_access}
                onChange={(checked) => setFormData({ ...formData, has_truck_access: checked })}
              />

              <DeliveryLocationInput
                value={formData.delivery_location}
                onChange={(value) => setFormData({ ...formData, delivery_location: value })}
              />

              <NotesInput
                value={formData.notes}
                onChange={(value) => setFormData({ ...formData, notes: value })}
              />
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