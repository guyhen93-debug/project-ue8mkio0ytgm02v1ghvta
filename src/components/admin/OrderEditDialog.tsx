import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from '@/hooks/use-toast';
import { Order, Site, Client, Product } from '@/entities';
import { useLanguage } from '@/contexts/LanguageContext';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface OrderEditDialogProps {
  order?: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const OrderEditDialog: React.FC<OrderEditDialogProps> = ({ order, isOpen, onClose, onSave }) => {
  const { language } = useLanguage();
  const [clients, setClients] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [filteredSites, setFilteredSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    client_id: '',
    site_id: '',
    product_id: '',
    quantity_tons: 0,
    delivery_date: new Date(),
    delivery_window: 'morning',
    delivery_method: 'self',
    supplier: 'shifuli_har',
    notes: '',
    status: 'pending'
  });

  const translations = {
    he: {
      editOrder: 'ערוך הזמנה',
      createOrder: 'צור הזמנה',
      client: 'לקוח',
      site: 'אתר',
      product: 'מוצר',
      quantity: 'כמות (טון)',
      deliveryDate: 'תאריך אספקה',
      timeWindow: 'חלון זמן',
      morning: 'בוקר',
      afternoon: 'אחר הצהריים',
      deliveryMethod: 'שיטת אספקה',
      self: 'עצמי',
      external: 'חיצוני',
      supplier: 'ספק',
      shifuliHar: 'שיפולי הר',
      maavarRabin: 'מעבר רבין',
      notes: 'הערות',
      status: 'סטטוס',
      pending: 'ממתין',
      approved: 'מאושר',
      rejected: 'נדחה',
      completed: 'הושלם',
      save: 'שמור',
      cancel: 'ביטול',
      selectClient: 'בחר לקוח',
      selectSite: 'בחר אתר',
      selectProduct: 'בחר מוצר',
      requiredFields: 'יש למלא את כל השדות החובה',
      orderUpdated: 'הזמנה עודכנה בהצלחה',
      orderCreated: 'הזמנה נוצרה בהצלחה',
      error: 'שגיאה',
      loading: 'טוען...'
    },
    en: {
      editOrder: 'Edit Order',
      createOrder: 'Create Order',
      client: 'Client',
      site: 'Site',
      product: 'Product',
      quantity: 'Quantity (tons)',
      deliveryDate: 'Delivery Date',
      timeWindow: 'Time Window',
      morning: 'Morning',
      afternoon: 'Afternoon',
      deliveryMethod: 'Delivery Method',
      self: 'Self',
      external: 'External',
      supplier: 'Supplier',
      shifuliHar: 'Shifuli Har',
      maavarRabin: 'Maavar Rabin',
      notes: 'Notes',
      status: 'Status',
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      completed: 'Completed',
      save: 'Save',
      cancel: 'Cancel',
      selectClient: 'Select client',
      selectSite: 'Select site',
      selectProduct: 'Select product',
      requiredFields: 'Please fill all required fields',
      orderUpdated: 'Order updated successfully',
      orderCreated: 'Order created successfully',
      error: 'Error',
      loading: 'Loading...'
    }
  };

  const t = translations[language];
  const isRTL = language === 'he';

  useEffect(() => {
    if (isOpen) {
      loadDataAndPopulateForm();
    }
  }, [isOpen, order]);

  useEffect(() => {
    if (formData.client_id && sites.length > 0) {
      const clientSites = sites.filter(s => s.client_id === formData.client_id);
      setFilteredSites(clientSites);
    } else {
      setFilteredSites([]);
    }
  }, [formData.client_id, sites]);

  const loadDataAndPopulateForm = async () => {
    try {
      setLoading(true);
      
      // Load all data first
      const [clientsData, sitesData, productsData] = await Promise.all([
        Client.list('-created_at', 1000),
        Site.list('-created_at', 1000),
        Product.list('-created_at', 1000)
      ]);
      
      console.log('Loaded clients:', clientsData.length);
      console.log('Loaded sites:', sitesData.length);
      console.log('Loaded products:', productsData.length);
      
      setClients(clientsData);
      setSites(sitesData);
      setProducts(productsData);

      // Now populate form if editing
      if (order) {
        console.log('Populating form with order:', order);
        const site = sitesData.find(s => s.id === order.site_id);
        console.log('Found site for order:', site);
        
        const newFormData = {
          client_id: site?.client_id || '',
          site_id: order.site_id || '',
          product_id: order.product_id || '',
          quantity_tons: order.quantity_tons || 0,
          delivery_date: order.delivery_date ? new Date(order.delivery_date) : new Date(),
          delivery_window: order.delivery_window || 'morning',
          delivery_method: order.delivery_method || 'self',
          supplier: order.supplier || 'shifuli_har',
          notes: order.notes || '',
          status: order.status || 'pending'
        };
        
        console.log('Setting form data:', newFormData);
        setFormData(newFormData);
      } else {
        // Reset form for new order
        setFormData({
          client_id: '',
          site_id: '',
          product_id: '',
          quantity_tons: 0,
          delivery_date: new Date(),
          delivery_window: 'morning',
          delivery_method: 'self',
          supplier: 'shifuli_har',
          notes: '',
          status: 'pending'
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: t.error,
        description: 'Failed to load data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.site_id || !formData.product_id || formData.quantity_tons <= 0) {
      toast({
        title: t.error,
        description: t.requiredFields,
        variant: 'destructive'
      });
      return;
    }

    try {
      const orderData = {
        site_id: formData.site_id,
        product_id: formData.product_id,
        quantity_tons: formData.quantity_tons,
        delivery_date: formData.delivery_date.toISOString(),
        delivery_window: formData.delivery_window,
        delivery_method: formData.delivery_method,
        supplier: formData.supplier,
        notes: formData.notes,
        status: formData.status
      };

      if (order) {
        await Order.update(order.id, orderData);
        toast({ title: t.orderUpdated });
      } else {
        await Order.create(orderData);
        toast({ title: t.orderCreated });
      }

      onSave();
    } catch (error) {
      console.error('Error saving order:', error);
      toast({
        title: t.error,
        description: 'Failed to save order',
        variant: 'destructive'
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle>{order ? t.editOrder : t.createOrder}</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
            <span className="mr-3 text-gray-600">{t.loading}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client_id">{t.client}</Label>
              <Select
                value={formData.client_id}
                onValueChange={(value) => {
                  setFormData({ ...formData, client_id: value, site_id: '' });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t.selectClient} />
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
              <Label htmlFor="site_id">{t.site}</Label>
              <Select
                value={formData.site_id}
                onValueChange={(value) => setFormData({ ...formData, site_id: value })}
                disabled={!formData.client_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t.selectSite} />
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

            <div className="space-y-2">
              <Label htmlFor="product_id">{t.product}</Label>
              <Select
                value={formData.product_id}
                onValueChange={(value) => setFormData({ ...formData, product_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t.selectProduct} />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.product_id}>
                      {language === 'he' ? product.name_he : product.name_en}
                      {product.size && ` (${product.size})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity_tons">{t.quantity}</Label>
              <Input
                id="quantity_tons"
                type="number"
                min="0"
                step="0.1"
                value={formData.quantity_tons}
                onChange={(e) => setFormData({ ...formData, quantity_tons: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label>{t.deliveryDate}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
                    {format(formData.delivery_date, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 pointer-events-auto">
                  <Calendar
                    mode="single"
                    selected={formData.delivery_date}
                    onSelect={(date) => date && setFormData({ ...formData, delivery_date: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery_window">{t.timeWindow}</Label>
              <Select
                value={formData.delivery_window}
                onValueChange={(value) => setFormData({ ...formData, delivery_window: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">{t.morning}</SelectItem>
                  <SelectItem value="afternoon">{t.afternoon}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery_method">{t.deliveryMethod}</Label>
              <Select
                value={formData.delivery_method}
                onValueChange={(value) => setFormData({ ...formData, delivery_method: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="self">{t.self}</SelectItem>
                  <SelectItem value="external">{t.external}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier">{t.supplier}</Label>
              <Select
                value={formData.supplier}
                onValueChange={(value) => setFormData({ ...formData, supplier: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shifuli_har">{t.shifuliHar}</SelectItem>
                  <SelectItem value="maavar_rabin">{t.maavarRabin}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">{t.status}</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">{t.pending}</SelectItem>
                  <SelectItem value="approved">{t.approved}</SelectItem>
                  <SelectItem value="rejected">{t.rejected}</SelectItem>
                  <SelectItem value="completed">{t.completed}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">{t.notes}</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="piter-yellow flex-1">
                {t.save}
              </Button>
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                {t.cancel}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default OrderEditDialog;