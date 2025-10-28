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
import { Order, Notification } from '@/entities';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2 } from 'lucide-react';

const CreateOrder: React.FC = () => {
  const [formData, setFormData] = useState({
    product: '',
    quantity: '',
    delivery_date: '',
    delivery_time: '',
    delivery_type: 'self_transport',
    delivery_location: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const products = [
    { value: 'sand_0_3', label: t('sand_0_3') },
    { value: 'sesame_4_9_5', label: t('sesame_4_9_5') },
    { value: 'lentil_9_5_19', label: t('lentil_9_5_19') },
    { value: 'polia_19_25', label: t('polia_19_25') },
    { value: 'granite_10_60', label: t('granite_10_60') }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);

    try {
      const deliveryDateTime = `${formData.delivery_date}T${formData.delivery_time}`;
      
      await Order.create({
        client_id: user.id,
        client_name: user.name,
        client_company: user.company,
        product: formData.product,
        quantity: parseFloat(formData.quantity),
        delivery_date: deliveryDateTime,
        delivery_type: formData.delivery_type,
        delivery_location: formData.delivery_location,
        status: 'pending',
        notes: formData.notes
      });

      toast({
        title: t('order_submitted'),
        description: 'Your order has been submitted successfully.',
      });

      navigate('/client');
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit order. Please try again.',
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
           formData.delivery_time && 
           formData.delivery_location.trim();
  };

  return (
    <Layout title={t('create_order')} showBottomNav={false}>
      <div className="px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/client')}
            className="p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-gray-900">
            {t('create_order')}
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>{t('order_details')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Product Selection */}
              <div className="space-y-2">
                <Label htmlFor="product">{t('product')} *</Label>
                <Select
                  value={formData.product}
                  onValueChange={(value) => setFormData({ ...formData, product: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product" />
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
              <div className="space-y-2">
                <Label htmlFor="quantity">{t('quantity')} ({t('tons')}) *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="Enter quantity in tons"
                  required
                />
              </div>

              {/* Delivery Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="delivery_date">{t('delivery_date')} *</Label>
                  <Input
                    id="delivery_date"
                    type="date"
                    value={formData.delivery_date}
                    onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delivery_time">Time *</Label>
                  <Input
                    id="delivery_time"
                    type="time"
                    value={formData.delivery_time}
                    onChange={(e) => setFormData({ ...formData, delivery_time: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Delivery Type */}
              <div className="space-y-3">
                <Label>{t('delivery_type')} *</Label>
                <RadioGroup
                  value={formData.delivery_type}
                  onValueChange={(value) => setFormData({ ...formData, delivery_type: value })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="self_transport" id="self_transport" />
                    <Label htmlFor="self_transport">{t('self_transport')}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="external" id="external" />
                    <Label htmlFor="external">{t('external')}</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Delivery Location */}
              <div className="space-y-2">
                <Label htmlFor="delivery_location">{t('delivery_location')} *</Label>
                <Textarea
                  id="delivery_location"
                  value={formData.delivery_location}
                  onChange={(e) => setFormData({ ...formData, delivery_location: e.target.value })}
                  placeholder="Enter the complete delivery address"
                  rows={3}
                  required
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any special instructions or notes"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="mt-6 space-y-3">
            <Button
              type="submit"
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-black"
              size="lg"
              disabled={!isFormValid() || isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('submit_order')}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              className="w-full"
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