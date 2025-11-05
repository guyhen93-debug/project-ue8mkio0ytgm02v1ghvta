import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { mockDataService } from '@/services/mockDataService';
import { toast } from '@/hooks/use-toast';
import { Trash2 } from 'lucide-react';

interface OrderEditDialogProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const OrderEditDialog: React.FC<OrderEditDialogProps> = ({ order, isOpen, onClose, onSave }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    product: '',
    quantity: '',
    delivery_date: '',
    delivery_time: 'morning',
    delivery_type: 'self_transport',
    client_id: '',
    site_id: '',
    status: 'pending',
    notes: '',
    quarry_or_crossing: 'default'
  });
  const [products, setProducts] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (order && isOpen) {
      loadFormData();
      loadDropdownData();
    }
  }, [order, isOpen]);

  const loadFormData = () => {
    const deliveryDateTime = new Date(order.delivery_date);
    const dateStr = deliveryDateTime.toISOString().split('T')[0];
    const timeStr = deliveryDateTime.getHours() < 12 ? 'morning' : 'afternoon';

    setFormData({
      product: order.product || '',
      quantity: order.quantity?.toString() || '',
      delivery_date: dateStr,
      delivery_time: timeStr,
      delivery_type: order.delivery_type || 'self_transport',
      client_id: order.client_id || '',
      site_id: order.site_id || '',
      status: order.status || 'pending',
      notes: order.notes || '',
      quarry_or_crossing: order.quarry_or_crossing || 'default'
    });
  };

  const loadDropdownData = async () => {
    try {
      const [productList, clientList, siteList] = await Promise.all([
        mockDataService.getProducts(),
        mockDataService.getClients({ is_active: true }),
        mockDataService.getSites({ is_active: true })
      ]);
      setProducts(productList);
      setClients(clientList);
      setSites(siteList);
    } catch (error) {
      console.error('Error loading dropdown data:', error);
    }
  };

  const handleSave = async () => {
    try {
      const timeMapping = { morning: '09:00', afternoon: '14:00' };
      const deliveryDateTime = `${formData.delivery_date}T${timeMapping[formData.delivery_time]}:00`;

      const updates = {
        product: formData.product,
        quantity: parseFloat(formData.quantity),
        delivery_date: deliveryDateTime,
        delivery_type: formData.delivery_type,
        client_id: formData.client_id,
        site_id: formData.site_id,
        status: formData.status,
        notes: formData.notes,
        quarry_or_crossing: formData.quarry_or_crossing
      };

      await mockDataService.updateOrder(order.id, updates);
      
      toast({
        title: t('order_updated'),
        description: t('order_updated_successfully'),
      });
      
      onSave();
      onClose();
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: t('error'),
        description: t('update_failed'),
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    try {
      await mockDataService.deleteOrder(order.id);
      
      toast({
        title: t('order_deleted'),
        description: t('order_deleted_successfully'),
      });
      
      onSave();
      onClose();
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting order:', error);
      toast({
        title: t('error'),
        description: t('delete_failed'),
        variant: 'destructive',
      });
    }
  };

  const getFilteredSites = () => {
    return sites.filter(site => site.client_id === formData.client_id);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              {t('edit_order')} #{order?.order_number}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Client Selection */}
            <div>
              <Label>{t('select_client')}</Label>
              <Select
                value={formData.client_id}
                onValueChange={(value) => setFormData({ ...formData, client_id: value, site_id: '' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('select_client')} />
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

            {/* Site Selection */}
            <div>
              <Label>{t('select_site')}</Label>
              <Select
                value={formData.site_id}
                onValueChange={(value) => setFormData({ ...formData, site_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('select_site')} />
                </SelectTrigger>
                <SelectContent>
                  {getFilteredSites().map((site) => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.site_name} ({t(site.region_type)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Product Selection */}
            <div>
              <Label>{t('product')}</Label>
              <Select
                value={formData.product}
                onValueChange={(value) => setFormData({ ...formData, product: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('select_product')} />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.display_name_he}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quantity */}
            <div>
              <Label>{t('quantity')}</Label>
              <Input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder={t('enter_quantity')}
              />
            </div>

            {/* Delivery Date */}
            <div>
              <Label>{t('delivery_date')}</Label>
              <Input
                type="date"
                value={formData.delivery_date}
                onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
              />
            </div>

            {/* Delivery Time */}
            <div>
              <Label>{t('delivery_time')}</Label>
              <Select
                value={formData.delivery_time}
                onValueChange={(value) => setFormData({ ...formData, delivery_time: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">{t('morning_slot')}</SelectItem>
                  <SelectItem value="afternoon">{t('afternoon_slot')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Delivery Type */}
            <div>
              <Label>{t('delivery_type')}</Label>
              <Select
                value={formData.delivery_type}
                onValueChange={(value) => setFormData({ ...formData, delivery_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="self_transport">{t('self_transport')}</SelectItem>
                  <SelectItem value="external">{t('external_delivery')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Quarry/Crossing */}
            <div>
              <Label>{t('quarry_or_crossing')}</Label>
              <Select
                value={formData.quarry_or_crossing}
                onValueChange={(value) => setFormData({ ...formData, quarry_or_crossing: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">{t('shifolei_har')}</SelectItem>
                  <SelectItem value="yitzhak_rabin">{t('yitzhak_rabin_crossing')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div>
              <Label>{t('status')}</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">{t('pending')}</SelectItem>
                  <SelectItem value="approved">{t('approved')}</SelectItem>
                  <SelectItem value="rejected">{t('rejected')}</SelectItem>
                  <SelectItem value="completed">{t('completed')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div>
              <Label>{t('notes')}</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={t('order_notes')}
                rows={3}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} className="flex-1">
              {t('save_changes')}
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1">
              {t('cancel')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('confirm_delete')}</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">
            {t('confirm_delete_order')} #{order?.order_number}?
          </p>
          <div className="flex gap-2 pt-4">
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="flex-1"
            >
              {t('delete')}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1"
            >
              {t('cancel')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OrderEditDialog;