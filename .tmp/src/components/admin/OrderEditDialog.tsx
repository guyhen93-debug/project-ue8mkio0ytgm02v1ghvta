import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Order, Site, Client, Product, User, Notification } from '@/entities';
import { useLanguage } from '@/contexts/LanguageContext';
import { Calendar as CalendarIcon, Loader2, CheckCircle, Clock, Star } from 'lucide-react';
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
        status: 'pending',
        is_delivered: false,
        delivery_note_number: '',
        driver_name: '',
        actual_delivery_date: new Date().toISOString().slice(0, 16),
        delivered_quantity_tons: 0,
        delivery_notes: ''
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
            inTransit: 'בדרך',
            save: 'שמור',
            cancel: 'ביטול',
            selectClient: 'בחר לקוח',
            selectSite: 'בחר אתר',
            selectProduct: 'בחר מוצר',
            requiredFields: 'יש למלא את כל השדות החובה',
            orderUpdated: 'הזמנה עודכנה בהצלחה',
            orderCreated: 'הזמנה נוצרה בהצלחה',
            error: 'שגיאה',
            loading: 'טוען...',
            markAsDelivered: 'סמן כסופק',
            deliveryStatus: 'סטטוס אספקה',
            notDelivered: 'לא סופק',
            delivered: 'סופק',
            clientConfirmation: 'אישור לקוח',
            waitingConfirmation: 'ממתין לאישור לקוח',
            confirmedByClient: 'אושר ע"י לקוח',
            notConfirmed: 'טרם אושר',
            clientRating: 'דירוג לקוח',
            notRated: 'טרם דורג',
            ratedOn: 'דורג ב',
            deliveryNoteNumber: 'מספר תעודת משלוח',
            driverName: 'שם נהג',
            actualDeliveryDate: 'תאריך ושעת אספקה בפועל',
            deliveredQuantity: 'כמות שסופקה (טון)',
            deliveryNotes: 'הערות אספקה',
            deliveryNotePlaceholder: 'לדוגמה: TN-2024-001',
            driverNamePlaceholder: 'לדוגמה: יוסי כהן',
            deliveryNotesPlaceholder: 'לדוגמה: איחור בגלל תנועה, נהג אדיב וכו\'',
            deliveryNoteRequired: 'חובה להזין מספר תעודת משלוח'
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
            inTransit: 'In Transit',
            save: 'Save',
            cancel: 'Cancel',
            selectClient: 'Select client',
            selectSite: 'Select site',
            selectProduct: 'Select product',
            requiredFields: 'Please fill all required fields',
            orderUpdated: 'Order updated successfully',
            orderCreated: 'Order created successfully',
            error: 'Error',
            loading: 'Loading...',
            markAsDelivered: 'Mark as delivered',
            deliveryStatus: 'Delivery Status',
            notDelivered: 'Not delivered',
            delivered: 'Delivered',
            clientConfirmation: 'Client Confirmation',
            waitingConfirmation: 'Waiting for client confirmation',
            confirmedByClient: 'Confirmed by client',
            notConfirmed: 'Not confirmed',
            clientRating: 'Client Rating',
            notRated: 'Not rated yet',
            ratedOn: 'Rated on',
            deliveryNoteNumber: 'Delivery Note Number',
            driverName: 'Driver Name',
            actualDeliveryDate: 'Actual Delivery Date & Time',
            deliveredQuantity: 'Delivered Quantity (tons)',
            deliveryNotes: 'Delivery Notes',
            deliveryNotePlaceholder: 'e.g., TN-2024-001',
            driverNamePlaceholder: 'e.g., John Doe',
            deliveryNotesPlaceholder: 'e.g., delay due to traffic, polite driver, etc.',
            deliveryNoteRequired: 'Delivery note number is required'
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

            const [clientsData, sitesData, productsData] = await Promise.all([
                Client.list('-created_at', 1000),
                Site.list('-created_at', 1000),
                Product.list('-created_at', 1000)
            ]);

            setClients(clientsData);
            setSites(sitesData);
            setProducts(productsData);

            if (order) {
                const site = sitesData.find(s => s.id === order.site_id);

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
                    status: order.status || 'pending',
                    is_delivered: order.is_delivered || false,
                    delivery_note_number: order.delivery_note_number || '',
                    driver_name: order.driver_name || '',
                    actual_delivery_date: (order.actual_delivery_date || order.delivered_at || new Date().toISOString()).slice(0, 16),
                    delivered_quantity_tons: order.delivered_quantity_tons ?? order.quantity_tons ?? 0,
                    delivery_notes: order.delivery_notes || ''
                };

                setFormData(newFormData);
            } else {
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
                    status: 'pending',
                    is_delivered: false,
                    delivery_note_number: '',
                    driver_name: '',
                    actual_delivery_date: new Date().toISOString().slice(0, 16),
                    delivered_quantity_tons: 0,
                    delivery_notes: ''
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

    const getOrderClientName = () => {
        if (!formData.client_id) return '';
        const client = clients.find(c => c.id === formData.client_id);
        return client?.name || '';
    };

    const createStatusChangeNotifications = async (orderNumber: string, newStatus: string, orderCreatedBy: string) => {
        try {
            const clientName = getOrderClientName();
            const suffix = clientName ? ` - ${clientName}` : '';

            const statusMessages = {
                approved: `הזמנה #${orderNumber} אושרה${suffix}`,
                rejected: `הזמנה #${orderNumber} נדחתה${suffix}`,
                completed: `הזמנה #${orderNumber} הושלמה${suffix}`,
                pending: `הזמנה #${orderNumber} הוחזרה לסטטוס ממתין${suffix}`,
                in_transit: `הזמנה #${orderNumber} בדרך אליך${suffix}`
            };

            const message = statusMessages[newStatus] || `הזמנה #${orderNumber} עודכנה${suffix}`;

            const allUsers = await User.list('-created_at', 1000);
            const managers = allUsers.filter(u => u.role === 'manager');
            const orderCreator = allUsers.find(u => u.email === orderCreatedBy);

            const notifications = managers.map(manager =>
                Notification.create({
                    recipient_email: manager.email,
                    type: 'order_status_change',
                    message: message,
                    is_read: false,
                    order_id: orderNumber
                })
            );

            if (orderCreator && orderCreator.role === 'client') {
                notifications.push(
                    Notification.create({
                        recipient_email: orderCreator.email,
                        type: 'order_status_change',
                        message: message,
                        is_read: false,
                        order_id: orderNumber
                    })
                );
            }

            await Promise.all(notifications);
        } catch (error) {
            console.error('Error creating status change notifications:', error);
        }
    };

    const createDeliveryNotifications = async (orderNumber: string, orderCreatedBy: string) => {
        try {
            const clientName = getOrderClientName();
            const suffix = clientName ? ` - ${clientName}` : '';
            const message = `הזמנה #${orderNumber} סומנה כסופקה - ממתין לאישור לקוח${suffix}`;

            const allUsers = await User.list('-created_at', 1000);
            const orderCreator = allUsers.find(u => u.email === orderCreatedBy);

            if (orderCreator && orderCreator.role === 'client') {
                await Notification.create({
                    recipient_email: orderCreator.email,
                    type: 'order_delivered',
                    message: message,
                    is_read: false,
                    order_id: orderNumber
                });
            }
        } catch (error) {
            console.error('Error creating delivery notification:', error);
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

        const autoDelivered = formData.quantity_tons > 0 && formData.delivered_quantity_tons >= formData.quantity_tons;
        const isDeliveredFlag = formData.is_delivered || autoDelivered;

        if (isDeliveredFlag) {
            if (!formData.delivery_note_number || !formData.delivery_note_number.trim()) {
                toast({
                    title: t.error,
                    description: t.deliveryNoteRequired,
                    variant: 'destructive'
                });
                return;
            }
            if (formData.delivered_quantity_tons <= 0) {
                toast({
                    title: t.error,
                    description: t.requiredFields,
                    variant: 'destructive'
                });
                return;
            }
        }

        try {
            const effectiveStatus = autoDelivered ? 'completed' : formData.status;

            const orderData: any = {
                site_id: formData.site_id,
                product_id: formData.product_id,
                quantity_tons: formData.quantity_tons,
                delivery_date: formData.delivery_date.toISOString(),
                delivery_window: formData.delivery_window,
                delivery_method: formData.delivery_method,
                supplier: formData.supplier,
                notes: formData.notes,
                status: effectiveStatus,
                is_delivered: isDeliveredFlag,
                delivery_note_number: formData.delivery_note_number || '',
                driver_name: formData.driver_name || '',
                delivery_notes: formData.delivery_notes || ''
            };

            if (isDeliveredFlag && formData.actual_delivery_date) {
                const isoDate = new Date(formData.actual_delivery_date).toISOString();
                orderData.actual_delivery_date = isoDate;
                orderData.delivered_at = isoDate;
                orderData.delivered_quantity_tons = autoDelivered
                    ? formData.quantity_tons
                    : formData.delivered_quantity_tons;
            }

            if (order) {
                const statusChanged = order.status !== formData.status;
                const deliveryChanged = !order.is_delivered && formData.is_delivered;

                await Order.update(order.id, orderData);

                if (statusChanged) {
                    await createStatusChangeNotifications(order.order_number, formData.status, order.created_by);
                }

                if (deliveryChanged) {
                    await createDeliveryNotifications(order.order_number, order.created_by);
                }

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

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" dir={isRTL ? 'rtl' : 'ltr'}>
                <DialogHeader>
                    <DialogTitle>
                        {order 
                            ? (language === 'he' 
                                ? `עדכון אספקה - הזמנה #${order.order_number || order.id.slice(-6)}` 
                                : `Update Delivery - Order #${order.order_number || order.id.slice(-6)}`)
                            : t.createOrder
                        }
                    </DialogTitle>
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
                                    <SelectItem value="in_transit">{t.inTransit}</SelectItem>
                                    <SelectItem value="rejected">{t.rejected}</SelectItem>
                                    <SelectItem value="completed">{t.completed}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Delivery Status Section */}
                        <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <Label className="text-base font-bold text-gray-900 block border-b pb-2 mb-2">
                                {t.deliveryStatus}
                            </Label>

                            {/* New Delivery Fields */}
                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="delivery_note_number" className="flex items-center gap-1">
                                        {t.deliveryNoteNumber} <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="delivery_note_number"
                                        placeholder={t.deliveryNotePlaceholder}
                                        value={formData.delivery_note_number}
                                        onChange={(e) => setFormData({ ...formData, delivery_note_number: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="driver_name">{t.driverName}</Label>
                                    <Input
                                        id="driver_name"
                                        placeholder={t.driverNamePlaceholder}
                                        value={formData.driver_name}
                                        onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="actual_delivery_date">{t.actualDeliveryDate}</Label>
                                    <Input
                                        id="actual_delivery_date"
                                        type="datetime-local"
                                        value={formData.actual_delivery_date}
                                        onChange={(e) => setFormData({ ...formData, actual_delivery_date: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="delivered_quantity_tons">{t.deliveredQuantity}</Label>
                                    <Input
                                        id="delivered_quantity_tons"
                                        type="number"
                                        min="0"
                                        step="0.1"
                                        value={formData.delivered_quantity_tons}
                                        onChange={(e) => setFormData({ ...formData, delivered_quantity_tons: parseFloat(e.target.value) || 0 })}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        {formData.delivered_quantity_tons || 0} / {formData.quantity_tons} {t.tons}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="delivery_notes">{t.deliveryNotes}</Label>
                                    <Textarea
                                        id="delivery_notes"
                                        placeholder={t.deliveryNotesPlaceholder}
                                        value={formData.delivery_notes}
                                        onChange={(e) => setFormData({ ...formData, delivery_notes: e.target.value })}
                                        rows={2}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center space-x-2 space-x-reverse pt-2 border-t border-gray-100">
                                <Checkbox
                                    id="is_delivered"
                                    checked={formData.is_delivered}
                                    onCheckedChange={(checked) =>
                                        setFormData({ ...formData, is_delivered: checked as boolean })
                                    }
                                />
                                <label
                                    htmlFor="is_delivered"
                                    className="text-sm font-bold leading-none cursor-pointer"
                                >
                                    {t.markAsDelivered}
                                </label>
                            </div>

                            {/* Show client confirmation status if order exists */}
                            {order && (
                                <div className="pt-2 border-t border-gray-200">
                                    <Label className="text-sm text-gray-600 mb-2 block">{t.clientConfirmation}</Label>
                                    {order.is_client_confirmed ? (
                                        <Badge className="bg-green-100 text-green-800">
                                            <CheckCircle className="w-3 h-3 ml-1" />
                                            {t.confirmedByClient}
                                        </Badge>
                                    ) : order.is_delivered ? (
                                        <Badge className="bg-orange-100 text-orange-800">
                                            <Clock className="w-3 h-3 ml-1" />
                                            {t.waitingConfirmation}
                                        </Badge>
                                    ) : (
                                        <Badge className="bg-gray-100 text-gray-800">
                                            {t.notConfirmed}
                                        </Badge>
                                    )}
                                </div>
                            )}

                            {/* Show client rating if order exists and is rated */}
                            {order && (
                                <div className="pt-2 border-t border-gray-200">
                                    <Label className="text-sm text-gray-600 mb-2 block">{t.clientRating}</Label>
                                    {order.rating ? (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <Star
                                                        key={star}
                                                        className={`w-5 h-5 ${
                                                            star <= order.rating
                                                                ? 'fill-yellow-400 text-yellow-400'
                                                                : 'text-gray-300'
                                                        }`}
                                                    />
                                                ))}
                                                <span className="text-sm font-medium text-purple-900">
                                                    ({order.rating}/5)
                                                </span>
                                            </div>
                                            {order.rating_comment && (
                                                <p className="text-sm text-gray-700 bg-white p-2 rounded border border-gray-200">
                                                    "{order.rating_comment}"
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-500">
                                                {t.ratedOn} {formatDate(order.rated_at)}
                                            </p>
                                        </div>
                                    ) : (
                                        <Badge className="bg-gray-100 text-gray-800">
                                            {t.notRated}
                                        </Badge>
                                    )}
                                </div>
                            )}
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
                            <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white">
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