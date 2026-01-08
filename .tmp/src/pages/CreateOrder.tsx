import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Order, User, Notification } from '@/entities';
import type { Order as OrderType, User as UserType, Client as ClientType, Site as SiteType, Product as ProductType } from '@/types';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOrderValidation } from '@/hooks/useOrderValidation';
import { OrderClientSection } from '@/components/order/OrderClientSection';
import { OrderProductSection } from '@/components/order/OrderProductSection';
import { OrderDeliverySection } from '@/components/order/OrderDeliverySection';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { FileText, Send } from 'lucide-react';
import { findUserClient } from '@/lib/orderUtils';

const CreateOrder = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { language } = useLanguage();
    const duplicateOrder = (location.state as { duplicateOrder?: OrderType })?.duplicateOrder;
    const [duplicateApplied, setDuplicateApplied] = useState(false);
    const { user: currentUser } = useAuth();

    const translations = {
        he: {
            title: 'יצירת הזמנה',
            subtitle: 'מלא את הפרטים ליצירת הזמנה',
            clientSection: 'לקוח ואתר',
            client: 'לקוח',
            site: 'אתר',
            productSection: 'מוצר וכמות',
            supplier: 'ספק',
            product: 'מוצר',
            quantity: 'כמות',
            deliverySection: 'מועד אספקה',
            deliveryDate: 'תאריך אספקה',
            deliveryWindow: 'חלון זמן',
            deliveryMethod: 'שיטת אספקה',
            notes: 'הערות',
            notesPlaceholder: 'הערות נוספות להזמנה (אופציונלי)',
            submit: 'שלח הזמנה',
            submitting: 'שולח הזמנה...',
            createOrder: 'צור הזמנה חדשה',
        },
        en: {
            title: 'Create Order',
            subtitle: 'Fill in the details to create an order',
            clientSection: 'Client and Site',
            client: 'Client',
            site: 'Site',
            productSection: 'Product and Quantity',
            supplier: 'Supplier',
            product: 'Product',
            quantity: 'Quantity',
            deliverySection: 'Delivery Schedule',
            deliveryDate: 'Delivery Date',
            deliveryWindow: 'Time Window',
            deliveryMethod: 'Delivery Method',
            notes: 'Notes',
            notesPlaceholder: 'Additional notes for order (optional)',
            submit: 'Send Order',
            submitting: 'Sending order...',
            createOrder: 'Create New Order',
        },
    } as const;

    const t = translations[language as 'he' | 'en'] || translations.he;

    const { clients, sites, loading: dataLoading } = useData();
    const [filteredSites, setFilteredSites] = useState<SiteType[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [useCubicMeters, setUseCubicMeters] = useState(false);
    const [userClient, setUserClient] = useState<ClientType | null>(null);
    const [truckAccessSpace, setTruckAccessSpace] = useState(false);

    const [formData, setFormData] = useState({
        client_id: '',
        site_id: '',
        supplier: '',
        product_id: '',
        quantity_tons: '',
        delivery_date: '',
        delivery_window: '',
        delivery_window_type: '' as 'morning' | 'afternoon' | '',
        delivery_method: '',
        notes: ''
    });

    const { validation, getMinimumQuantity, getMultipleRequirement, CUBIC_TO_TON_RATIO } = useOrderValidation(formData, sites);

    useEffect(() => {
        if (!dataLoading && currentUser) {
            initializeForm();
        }
    }, [dataLoading, currentUser]);

    useEffect(() => {
        if (formData.client_id) {
            const clientSites = (sites as unknown as SiteType[]).filter(site => site.client_id === formData.client_id && site.is_active);
            setFilteredSites(clientSites);

            if (!clientSites.find(s => s.id === formData.site_id)) {
                setFormData(prev => ({ ...prev, site_id: '' }));
            }
        } else {
            setFilteredSites([]);
            setFormData(prev => ({ ...prev, site_id: '' }));
        }
    }, [formData.client_id, sites]);

    useEffect(() => {
        if (formData.supplier) {
            setFormData(prev => ({ ...prev, product_id: '' }));

            if (formData.supplier === 'maavar_rabin') {
                setFormData(prev => ({ ...prev, delivery_method: 'external' }));
                setTruckAccessSpace(true);
            }
        }
    }, [formData.supplier]);

    useEffect(() => {
        if (formData.supplier === 'maavar_rabin' && formData.delivery_method === 'external') {
            setTruckAccessSpace(true);
        }
    }, [formData.supplier, formData.delivery_method]);

    // Apply duplication data
    useEffect(() => {
        if (dataLoading || !currentUser || !duplicateOrder || duplicateApplied) return;

        const duplicateSite = (sites as unknown as SiteType[]).find(s => s.id === duplicateOrder.site_id);
        
        setFormData(prev => ({
            ...prev,
            client_id: duplicateOrder.client_id || duplicateSite?.client_id || prev.client_id || '',
            site_id: duplicateOrder.site_id || '',
            supplier: duplicateOrder.supplier || '',
            product_id: duplicateOrder.product_id || '',
            quantity_tons: duplicateOrder.quantity_tons ? String(duplicateOrder.quantity_tons) : '',
            delivery_date: '', // Must choose new date
            delivery_window: duplicateOrder.delivery_window || prev.delivery_window || '',
            delivery_method: duplicateOrder.delivery_method || prev.delivery_method || '',
            notes: duplicateOrder.notes || ''
        }));

        setTruckAccessSpace(!!duplicateOrder.truck_access_space);
        setUseCubicMeters(false);
        setDuplicateApplied(true);
        
        toast({
            title: 'שכפול הזמנה',
            description: `פרטי הזמנה #${duplicateOrder.order_number || duplicateOrder.id.slice(-6)} הועתקו. אנא בחר תאריך אספקה.`,
        });
    }, [dataLoading, currentUser, duplicateOrder, sites, duplicateApplied]);

    const initializeForm = () => {
        try {
            setLoading(true);

            if (currentUser?.role === 'client') {
                const activeClients = (clients as unknown as ClientType[]).filter(c => c.is_active);
                const matchingClient = findUserClient(currentUser, activeClients);

                if (matchingClient) {
                    setUserClient(matchingClient);
                    setFormData(prev => ({ ...prev, client_id: matchingClient.id }));
                } else {
                    toast({
                        title: 'שים לב',
                        description: 'לא נמצא לקוח משויך למשתמש זה. אנא פנה למנהל המערכת.',
                        variant: 'destructive',
                    });
                }
            }
        } catch (error) {
            console.error('Error initializing form:', error);
            toast({
                title: 'שגיאה',
                description: 'נכשל בטעינת הנתונים',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const getSelectedSite = () => {
        return (sites as unknown as SiteType[]).find(s => s.id === formData.site_id);
    };

    const getDisplayQuantity = () => {
        if (!formData.quantity_tons) return '';
        const tons = parseFloat(formData.quantity_tons);
        if (isNaN(tons)) return formData.quantity_tons;

        if (useCubicMeters) {
            return Math.round(tons / CUBIC_TO_TON_RATIO).toString();
        }
        return Math.round(tons).toString();
    };

    const handleDisplayQuantityChange = (value: string) => {
        if (!value) {
            setFormData({ ...formData, quantity_tons: '' });
            return;
        }

        const numValue = parseInt(value);
        if (isNaN(numValue)) return;

        if (useCubicMeters) {
            const tons = numValue * CUBIC_TO_TON_RATIO;
            setFormData({ ...formData, quantity_tons: Math.round(tons).toString() });
        } else {
            setFormData({ ...formData, quantity_tons: numValue.toString() });
        }
    };

    const shouldShowTruckAccessCheckbox = () => {
        if (formData.delivery_method !== 'external') return false;
        if (!formData.quantity_tons) return false;

        const quantity = parseInt(formData.quantity_tons);
        return quantity >= 40;
    };

    const createNotificationsForManagers = async (orderNumber: string, clientName: string) => {
        try {
            const allUsers = await User.list() as unknown as UserType[];
            const managers = allUsers.filter(u => u.role === 'manager');

            const notificationPromises = managers.map(manager =>
                Notification.create({
                    recipient_email: manager.email,
                    type: 'new_order',
                    message: `הזמנה חדשה #${orderNumber} מלקוח ${clientName}`,
                    is_read: false,
                    order_id: orderNumber
                })
            );

            await Promise.all(notificationPromises);
        } catch (error) {
            console.error('Error creating notifications:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.client_id || !formData.site_id || !formData.supplier ||
            !formData.product_id || !formData.quantity_tons || !formData.delivery_date ||
            !formData.delivery_window || !formData.delivery_method) {
            toast({
                title: 'שגיאה',
                description: 'אנא מלא את כל השדות הנדרשים',
                variant: 'destructive',
            });
            return;
        }

        if (!validation.valid) {
            toast({
                title: 'כמות לא תקינה',
                description: validation.message,
                variant: 'destructive',
            });
            return;
        }

        if (currentUser?.role === 'client' && userClient && formData.client_id !== userClient.id) {
            toast({
                title: 'שגיאה',
                description: 'אינך מורשה ליצור הזמנה עבור לקוח אחר',
                variant: 'destructive',
            });
            return;
        }

        try {
            setSubmitting(true);

            const selectedSite = getSelectedSite();
            const lastOrder = await Order.list('-order_number', 1);
            let nextOrderNumber = '2001';

            if (lastOrder.length > 0 && lastOrder[0].order_number) {
                const lastNumber = parseInt(lastOrder[0].order_number);
                nextOrderNumber = (lastNumber + 1).toString();
            }

            const orderData = {
                order_number: nextOrderNumber,
                client_id: formData.client_id || (selectedSite?.client_id || null),
                site_id: formData.site_id,
                product_id: formData.product_id,
                quantity_tons: parseInt(formData.quantity_tons),
                delivery_date: formData.delivery_date,
                delivery_window: formData.delivery_window,
                delivery_method: formData.delivery_method,
                supplier: formData.supplier,
                notes: formData.notes,
                status: 'pending',
                unlinked_site: false,
                truck_access_space: truckAccessSpace
            };

            await Order.create(orderData);

            const selectedClient = (clients as unknown as ClientType[]).find(c => c.id === formData.client_id);
            const clientName = selectedClient?.name || 'לקוח';

            await createNotificationsForManagers(nextOrderNumber, clientName);

            toast({
                title: 'הצלחה!',
                description: `הזמנה #${nextOrderNumber} נוצרה בהצלחה`,
            });

            navigate(currentUser?.role === 'manager' ? '/manager-dashboard' : '/client-dashboard');
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

    const isManager = currentUser?.role === 'manager';
    const isMaavarRabin = formData.supplier === 'maavar_rabin';
    const selectedSite = getSelectedSite();
    const multipleRequirement = getMultipleRequirement();
    const minQuantity = getMinimumQuantity();

    if (loading || dataLoading) {
        return (
            <Layout title={t.title}>
                <LoadingSpinner text="טוען..." />
            </Layout>
        );
    }

    return (
        <Layout title={t.title}>
            <div className="relative min-h-screen">
                <div className="p-4 space-y-6 pb-48">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t.title}</h1>
                        <p className="text-gray-600">{t.subtitle}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Client Section */}
                        <OrderClientSection
                            isManager={isManager}
                            userClient={userClient}
                            formData={formData}
                            clients={(clients as unknown as ClientType[]).filter(c => c.is_active)}
                            filteredSites={filteredSites}
                            selectedSite={selectedSite}
                            onClientChange={(clientId) => setFormData({ ...formData, client_id: clientId })}
                            onSiteChange={(siteId) => setFormData({ ...formData, site_id: siteId })}
                        />

                        {/* Product Section */}
                        <OrderProductSection
                            formData={formData}
                            useCubicMeters={useCubicMeters}
                            validation={validation}
                            multipleRequirement={multipleRequirement}
                            minQuantity={minQuantity}
                            CUBIC_TO_TON_RATIO={CUBIC_TO_TON_RATIO}
                            onSupplierChange={(supplier) => setFormData({ ...formData, supplier })}
                            onProductChange={(productId) => setFormData({ ...formData, product_id: productId })}
                            onQuantityChange={handleDisplayQuantityChange}
                            onUnitToggle={setUseCubicMeters}
                            getDisplayQuantity={getDisplayQuantity}
                        />

                        {/* Delivery Section */}
                        <OrderDeliverySection
                            formData={formData}
                            truckAccessSpace={truckAccessSpace}
                            isMaavarRabin={isMaavarRabin}
                            shouldShowTruckAccessCheckbox={shouldShowTruckAccessCheckbox()}
                            onDeliveryDateChange={(date) => setFormData({ ...formData, delivery_date: date })}
                            onDeliveryWindowChange={(window) => setFormData({ ...formData, delivery_window: window })}
                            onDeliveryMethodChange={(method) => setFormData({ ...formData, delivery_method: method })}
                            onTruckAccessChange={setTruckAccessSpace}
                        />

                        {/* Notes */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-gray-500" />
                                    {t.notes}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Textarea
                                    id="notes"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder={t.notesPlaceholder}
                                    className="text-right min-h-[100px]"
                                    rows={4}
                                />
                            </CardContent>
                        </Card>

                        {/* Submit Button */}
                        <div className="fixed bottom-20 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-lg z-30">
                            <div className="max-w-7xl mx-auto">
                                <Button
                                    type="submit"
                                    disabled={submitting || !validation.valid}
                                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-6"
                                >
                                    {submitting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black ml-2"></div>
                                            {t.submitting}
                                        </>
                                    ) : (
                                        <>
                                            <Send className="h-5 w-5 ml-2" />
                                            {t.submit}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
};

export default CreateOrder;
