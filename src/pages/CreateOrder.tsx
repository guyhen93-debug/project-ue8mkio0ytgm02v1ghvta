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
import QuarryCrossingSelector from '@/components/order/QuarryCrossingSelector';

const CreateOrder: React.FC = () => {
  const [formData, setFormData] = useState({
    product: '',
    quantity: '',
    delivery_date: '',
    delivery_time: 'morning',
    delivery_type: 'self_transport',
    delivery_location: '',
    notes: '',
    has_truck_access: false, // Default to unchecked
    quarry_or_crossing: 'default'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMinimumError, setShowMinimumError] = useState(false);
  const [showMultipleError, setShowMultipleError] = useState(false);
  const [showDistanceError, setShowDistanceError] = useState(false);
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const validateQuantityForExternal = (quantity: string, deliveryType: string) => {
    if (deliveryType === 'external' && quantity) {
      const qty = parseFloat(quantity);
      if (qty < 20) {
        setShowMinimumError(true);
        setShowMultipleError(false);
      } else if (qty % 20 !== 0) {
        setShowMinimumError(false);
        setShowMultipleError(true);
      } else {
        setShowMinimumError(false);
        setShowMultipleError(false);
      }
    } else {
      setShowMinimumError(false);
      setShowMultipleError(false);
    }
  };

  const handleQuantityChange = (value: string) => {
    setFormData({ ...formData, quantity: value });
    validateQuantityForExternal(value, formData.delivery_type);
    setShowDistanceError(false); // Reset distance error when quantity changes
  };

  const handleDeliveryTypeChange = (value: string) => {
    setFormData({ ...formData, delivery_type: value });
    validateQuantityForExternal(formData.quantity, value);
  };

  const validateDateTime = (date: string, time: string): { valid: boolean; error?: string } => {
    const now = new Date();
    const orderDate = new Date(date);
    
    // Check if date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    orderDate.setHours(0, 0, 0, 0);
    
    if (orderDate < today) {
      return { valid: false, error: t('past_date_error') };
    }
    
    // Check if it's today and time slot is in the past or after hours
    if (orderDate.getTime() === today.getTime()) {
      const currentHour = now.getHours();
      if (currentHour >= 17) {
        return { valid: false, error: t('after_hours_error') };
      }
      if (time === 'morning' && currentHour >= 12) {
        return { valid: false, error: t('morning_slot_passed') };
      }
    }
    
    return { valid: true };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate date and time
    const dateTimeValidation = validateDateTime(formData.delivery_date, formData.delivery_time);
    if (!dateTimeValidation.valid) {
      toast({
        title: t('validation_error'),
        description: dateTimeValidation.error,
        variant: 'destructive',
      });
      return;
    }

    // Validate external delivery requirements
    if (formData.delivery_type === 'external') {
      const qty = parseFloat(formData.quantity);
      if (qty < 20) {
        toast({
          title: t('validation_error'),
          description: t('minimum_quantity_external'),
          variant: 'destructive',
        });
        return;
      }
      if (qty % 20 !== 0) {
        toast({
          title: t('validation_error'),
          description: t('quantity_multiple_twenty'),
          variant: 'destructive',
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const timeMapping = {
        morning: '09:00',
        afternoon: '14:00'
      };
      
      const deliveryDateTime = `${formData.delivery_date}T${timeMapping[formData.delivery_time]}:00`;
      
      const result = await mockDataService.createOrder({
        client_id: user.id,
        client_name: user.name,
        client_company: user.company,
        product: formData.product,
        quantity: parseFloat(formData.quantity),
        delivery_date: deliveryDateTime,
        delivery_type: formData.delivery_type,
        delivery_location: formData.delivery_location,
        status: 'pending',
        notes: formData.notes + (formData.has_truck_access ? '' : '\n' + t('no_trailer_access_note')),
        quarry_or_crossing: formData.quarry_or_crossing
      });

      if (result.success) {
        toast({
          title: t('order_submitted'),
          description: t('order_submitted_description'),
        });
        navigate('/client');
      } else {
        toast({
          title: t('validation_error'),
          description: t(result.error || 'unknown_error'),
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: t('error'),
        description: t('order_submission_failed'),
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
           !showMinimumError &&
           !showMultipleError &&
           !showDistanceError;
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
                showMultipleError={showMultipleError}
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

              <QuarryCrossingSelector
                value={formData.quarry_or_crossing}
                onChange={(value) => setFormData({ ...formData, quarry_or_crossing: value })}
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