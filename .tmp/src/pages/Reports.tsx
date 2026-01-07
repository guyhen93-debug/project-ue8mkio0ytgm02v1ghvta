import React, { useState, useEffect, useMemo } from 'react';
import Layout from '@/components/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Order } from '@/entities';
import { toast } from '@/hooks/use-toast';
import { sendEmail } from '@/integrations/core';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    PieChart as RPieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    CartesianGrid
} from 'recharts';
import { 
    BarChart3, 
    PieChart, 
    TrendingUp, 
    Clock, 
    Star, 
    Download, 
    Send,
    Loader2,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';

const translations = {
    he: {
        title: 'דוחות ואנליטיקה',
        monthly_consumption: 'צריכה חודשית',
        performance: 'ביצועים',
        charts: 'גרפים ומגמות',
        export: 'ייצוא ושיתוף',
        current_month: 'חודש נוכחי',
        by_client: 'לפי לקוח',
        by_product: 'לפי מוצר',
        by_supplier: 'לפי ספק',
        avg_approval_time: 'זמן אישור ממוצע',
        on_time_delivery: 'אספקה בזמן',
        avg_rating: 'דירוג שירות ממוצע',
        orders_by_month: 'הזמנות לפי חודש',
        supplier_distribution: 'התפלגות לפי ספק',
        rating_trend: 'מגמת דירוג שירות',
        export_csv: 'ייצוא לקובץ Excel (CSV)',
        send_email: 'שליחת דוח במייל',
        no_data: 'אין נתונים להצגה',
        loading: 'טוען נתונים...',
        error: 'שגיאה בטעינת הנתונים',
        retry: 'נסה שוב',
        tons: 'טון',
        hours: 'שעות',
        shifuli_har: 'שיפולי ההר',
        maavar_rabin: 'מעבר רבין',
        report_email_subject: 'דוח פעילות מערכת פיתרנופי',
        email_sent_success: 'הדוח נשלח בהצלחה למייל שלך',
        email_sent_error: 'שגיאה בשליחת הדוח',
        export_success: 'הקובץ מוכן להורדה',
        no_email: 'לא נמצאה כתובת מייל למשתמש',
        thisWeekTitle: '📊 השבוע',
        statNewOrders: 'הזמנות חדשות',
        statTonsDelivered: 'טונות סופקו',
        statAvgRating: 'דירוג ממוצע',
        last50Note: '* מבוסס על 50 ההזמנות האחרונות',
        noData: 'אין נתונים'
    },
    en: {
        title: 'Reports & Analytics',
        monthly_consumption: 'Monthly Consumption',
        performance: 'Performance',
        charts: 'Charts & Trends',
        export: 'Export & Share',
        current_month: 'Current Month',
        by_client: 'By Client',
        by_product: 'By Product',
        by_supplier: 'By Supplier',
        avg_approval_time: 'Avg Approval Time',
        on_time_delivery: 'On-Time Delivery',
        avg_rating: 'Avg Service Rating',
        orders_by_month: 'Orders by Month',
        supplier_distribution: 'Supplier Distribution',
        rating_trend: 'Service Rating Trend',
        export_csv: 'Export to Excel (CSV)',
        send_email: 'Send Report by Email',
        no_data: 'No data to display',
        loading: 'Loading data...',
        error: 'Error loading data',
        retry: 'Retry',
        tons: 'tons',
        hours: 'hours',
        shifuli_har: 'Shifuli Har',
        maavar_rabin: 'Maavar Rabin',
        report_email_subject: 'Piternoufi System Activity Report',
        email_sent_success: 'Report sent successfully to your email',
        email_sent_error: 'Error sending report',
        export_success: 'File is ready for download',
        no_email: 'User email not found',
        thisWeekTitle: '📊 This Week',
        statNewOrders: 'New Orders',
        statTonsDelivered: 'Tons Delivered',
        statAvgRating: 'Average Rating',
        last50Note: '* Based on the last 50 orders',
        noData: 'No data'
    }
};

const COLORS = ['#eab308', '#2563eb', '#10b981', '#ef4444', '#8b5cf6', '#f97316'];

const Reports: React.FC = () => {
    const { language, isRTL } = useLanguage();
    const { user } = useAuth();
    const { productsMap, sitesMap, clientsMap } = useData();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const t = translations[language as keyof typeof translations];

    const loadOrders = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await Order.list('-created_at', 1000);
            setOrders(data);
        } catch (err) {
            console.error('Error loading reports data:', err);
            setError(t.error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrders();
    }, []);

    // Helper functions for analytics
    const getClientName = (order: any) => {
        const clientId = order.client_id || sitesMap[order.site_id]?.client_id;
        return clientsMap[clientId]?.name || (isRTL ? 'לקוח לא ידוע' : 'Unknown Client');
    };

    const getProductName = (order: any) => {
        const product = productsMap[order.product_id];
        if (!product) return isRTL ? 'מוצר לא ידוע' : 'Unknown Product';
        return language === 'he' ? product.name_he : product.name_en;
    };

    const getSupplierLabel = (supplier: string) => {
        if (supplier === 'shifuli_har') return t.shifuli_har;
        if (supplier === 'maavar_rabin') return t.maavar_rabin;
        return supplier;
    };

    // Analytics computation
    const analytics = useMemo(() => {
        if (orders.length === 0) return null;

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const monthlyOrders = orders.filter(o => {
            const date = new Date(o.delivery_date || o.created_at);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        });

        // 1. Monthly Consumption
        const consumptionByClient = Object.entries(
            monthlyOrders.reduce((acc: any, o) => {
                const name = getClientName(o);
                acc[name] = (acc[name] || 0) + (o.quantity_tons || 0);
                return acc;
            }, {})
        ).map(([name, tons]: [string, any]) => ({ name, tons }))
         .sort((a, b) => b.tons - a.tons)
         .slice(0, 5);

        const consumptionByProduct = Object.entries(
            monthlyOrders.reduce((acc: any, o) => {
                const name = getProductName(o);
                acc[name] = (acc[name] || 0) + (o.quantity_tons || 0);
                return acc;
            }, {})
        ).map(([name, tons]: [string, any]) => ({ name, tons }))
         .sort((a, b) => b.tons - a.tons)
         .slice(0, 5);

        const consumptionBySupplier = Object.entries(
            monthlyOrders.reduce((acc: any, o) => {
                if (!o.supplier) return acc;
                const name = getSupplierLabel(o.supplier);
                acc[name] = (acc[name] || 0) + (o.quantity_tons || 0);
                return acc;
            }, {})
        ).map(([name, tons]: [string, any]) => ({ name, tons }));

        // 2. Performance KPIs
        // Average Approval Time (hours)
        const approvedOrders = orders.filter(o => 
            (['approved', 'in_transit', 'completed'].includes(o.status) || o.is_delivered || (o.delivered_quantity_tons && o.quantity_tons && o.delivered_quantity_tons >= o.quantity_tons)) && 
            o.created_at && o.updated_at
        );
        const avgApprovalTime = approvedOrders.length > 0
            ? (approvedOrders.reduce((acc, o) => {
                const diff = new Date(o.updated_at).getTime() - new Date(o.created_at).getTime();
                return acc + (diff / (1000 * 60 * 60));
              }, 0) / approvedOrders.length).toFixed(1)
            : '—';

        // On-time delivery rate
        const deliveredOrders = orders.filter(o => (o.is_delivered || o.status === 'completed' || (o.delivered_quantity_tons && o.quantity_tons && o.delivered_quantity_tons >= o.quantity_tons)) && o.delivery_date);
        const onTimeDeliveries = deliveredOrders.filter(o => {
            const planned = new Date(o.delivery_date);
            const actual = new Date(o.actual_delivery_date || o.delivered_at || o.updated_at);
            // On time if same day or earlier
            return actual.getTime() <= planned.setHours(23, 59, 59, 999);
        });
        const onTimeRate = deliveredOrders.length > 0
            ? Math.round((onTimeDeliveries.length / deliveredOrders.length) * 100)
            : '—';

        // Average Rating
        const ratedOrders = orders.filter(o => typeof o.rating === 'number');
        const avgRating = ratedOrders.length > 0
            ? (ratedOrders.reduce((acc, o) => acc + o.rating, 0) / ratedOrders.length).toFixed(1)
            : '—';

        // 3. Chart Data
        // Orders by month
        const ordersByMonthMap = orders.reduce((acc: any, o) => {
            const date = new Date(o.created_at);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!acc[monthKey]) acc[monthKey] = { orders: 0, tons: 0 };
            acc[monthKey].orders++;
            acc[monthKey].tons += (o.quantity_tons || 0);
            return acc;
        }, {});

        const ordersByMonth = Object.entries(ordersByMonthMap)
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-6)
            .map(([month, data]: [string, any]) => ({
                month,
                orders: data.orders,
                tons: Math.round(data.tons)
            }));

        // Supplier distribution (Pie)
        const supplierPieData = Object.entries(
            orders.reduce((acc: any, o) => {
                if (!o.supplier) return acc;
                const name = getSupplierLabel(o.supplier);
                acc[name] = (acc[name] || 0) + (o.quantity_tons || 0);
                return acc;
            }, {})
        ).map(([name, value]) => ({ name, value }));

        // Rating trend
        const ratingByMonthMap = orders.filter(o => typeof o.rating === 'number').reduce((acc: any, o) => {
            const date = new Date(o.rated_at || o.created_at);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!acc[monthKey]) acc[monthKey] = { total: 0, count: 0 };
            acc[monthKey].total += o.rating;
            acc[monthKey].count++;
            return acc;
        }, {});

        const ratingByMonth = Object.entries(ratingByMonthMap)
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-6)
            .map(([month, data]: [string, any]) => ({
                month,
                rating: Number((data.total / data.count).toFixed(1))
            }));

        return {
            monthlyOrders,
            consumptionByClient,
            consumptionByProduct,
            consumptionBySupplier,
            avgApprovalTime,
            onTimeRate,
            avgRating,
            ordersByMonth,
            supplierPieData,
            ratingByMonth
        };
    }, [orders, language, productsMap, sitesMap, clientsMap]);

    const weeklyStats = useMemo(() => {
        if (orders.length === 0) return {
            weeklyNewCount: 0,
            weeklyTonsDelivered: 0,
            avgRating: 0,
            weeklyRatedOrdersCount: 0
        };

        const now = new Date();
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 7);

        const isWithinLast7Days = (dateString?: string) => {
            if (!dateString) return false;
            const date = new Date(dateString);
            return date >= sevenDaysAgo;
        };

        const weeklyNewOrders = orders.filter(o => isWithinLast7Days(o.created_at));
        const weeklyNewCount = weeklyNewOrders.length;

        const weeklyDeliveredOrders = orders.filter(o =>
            (o.is_delivered || o.status === 'completed' || (o.delivered_quantity_tons && o.quantity_tons && o.delivered_quantity_tons >= o.quantity_tons)) &&
            (isWithinLast7Days(o.actual_delivery_date) || isWithinLast7Days(o.delivered_at) || isWithinLast7Days(o.updated_at))
        );

        const weeklyTonsDelivered = weeklyDeliveredOrders.reduce((sum, o) =>
            sum + (o.delivered_quantity_tons || o.quantity_tons || 0),
            0
        );

        const weeklyRatedOrders = orders.filter(o => typeof o.rating === 'number' && isWithinLast7Days(o.updated_at || o.created_at));
        const avgRating = weeklyRatedOrders.length
            ? (weeklyRatedOrders.reduce((sum, o) => sum + o.rating, 0) / weeklyRatedOrders.length)
            : 0;

        return {
            weeklyNewCount,
            weeklyTonsDelivered,
            avgRating,
            weeklyRatedOrdersCount: weeklyRatedOrders.length
        };
    }, [orders]);

    const handleExportCSV = () => {
        try {
            const headers = [
                isRTL ? 'מספר הזמנה' : 'Order Number',
                isRTL ? 'לקוח' : 'Client',
                isRTL ? 'אתר' : 'Site',
                isRTL ? 'מוצר' : 'Product',
                isRTL ? 'ספק' : 'Supplier',
                isRTL ? 'כמות (טון)' : 'Quantity (Tons)',
                isRTL ? 'תאריך אספקה' : 'Delivery Date',
                isRTL ? 'סטטוס' : 'Status',
                isRTL ? 'דירוג' : 'Rating'
            ];

            const rows = orders.map(o => [
                o.order_number || '',
                getClientName(o),
                sitesMap[o.site_id]?.name || '',
                getProductName(o),
                getSupplierLabel(o.supplier),
                o.quantity_tons || '',
                o.delivery_date ? new Date(o.delivery_date).toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US') : '',
                o.status,
                o.rating || ''
            ]);

            const csvContent = [
                '\uFEFF' + headers.join(','), // Add BOM for Excel Hebrew support
                ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const date = new Date().toISOString().split('T')[0];
            link.setAttribute('href', url);
            link.setAttribute('download', `piternoufi-report-${date}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            toast({
                title: t.export_success,
                description: isRTL ? 'הקובץ נוצר בהצלחה' : 'File generated successfully',
            });
        } catch (err) {
            console.error('Export failed:', err);
            toast({
                title: isRTL ? 'הייצוא נכשל' : 'Export failed',
                variant: 'destructive'
            });
        }
    };

    const handleSendEmail = async () => {
        if (!user?.email) {
            toast({ title: t.no_email, variant: 'destructive' });
            return;
        }

        if (!analytics) return;

        try {
            const summaryText = `
                ${t.title} - ${new Date().toLocaleDateString()}
                
                ${t.monthly_consumption}:
                - ${t.by_supplier}: ${analytics.consumptionBySupplier.map(s => `${s.name}: ${s.tons} ${t.tons}`).join(', ')}
                
                ${t.performance}:
                - ${t.avg_approval_time}: ${analytics.avgApprovalTime} ${t.hours}
                - ${t.on_time_delivery}: ${analytics.onTimeRate}%
                - ${t.avg_rating}: ${analytics.avgRating} / 5
                
                * הופק אוטומטית ממערכת פיתרנופי *
            `;

            await sendEmail({
                to: user.email,
                subject: t.report_email_subject,
                body: summaryText
            });

            toast({
                title: t.email_sent_success,
                description: user.email
            });
        } catch (err) {
            console.error('Email send failed:', err);
            toast({
                title: t.email_sent_error,
                variant: 'destructive'
            });
        }
    };

    if (loading) {
        return (
            <Layout title={t.title}>
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-yellow-600" />
                    <p className="text-gray-500">{t.loading}</p>
                </div>
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout title={t.title}>
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-4 text-center">
                    <AlertCircle className="h-12 w-12 text-red-500" />
                    <h2 className="text-xl font-bold">{t.error}</h2>
                    <Button onClick={loadOrders} className="piter-yellow">
                        {t.retry}
                    </Button>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title={t.title}>
            <div className="p-3 sm:p-4 md:p-6 pb-24 space-y-4 sm:space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
                
                {/* Weekly Stats Widget */}
                <div className="mb-2">
                    <h2 className="text-lg font-bold flex items-center gap-2 mb-1">
                        {t.thisWeekTitle}
                    </h2>
                    <p className="text-xs text-gray-500 mb-3">
                        {t.last50Note}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Card className="industrial-card p-4 flex flex-col gap-1 border-gray-100 hover:border-yellow-200 transition-colors">
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                <BarChart3 className="w-3.5 h-3.5" />
                                📦 {t.statNewOrders}
                            </span>
                            <span className="text-2xl font-bold text-gray-900">
                                {weeklyStats.weeklyNewCount.toLocaleString()}
                            </span>
                        </Card>

                        <Card className="industrial-card p-4 flex flex-col gap-1 border-gray-100 hover:border-yellow-200 transition-colors">
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                <TrendingUp className="w-3.5 h-3.5" />
                                ⚖️ {t.statTonsDelivered}
                            </span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-bold text-gray-900">
                                    {weeklyStats.weeklyTonsDelivered > 0 ? weeklyStats.weeklyTonsDelivered.toFixed(1) : '0.0'}
                                </span>
                                <span className="text-sm text-gray-500 font-medium">{t.tons}</span>
                            </div>
                        </Card>

                        <Card className="industrial-card p-4 flex flex-col gap-1 border-gray-100 hover:border-yellow-200 transition-colors">
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                <Star className="w-3.5 h-3.5" />
                                ⭐ {t.statAvgRating}
                            </span>
                            {weeklyStats.avgRating > 0 ? (
                                <div>
                                    <div className="text-2xl font-bold text-gray-900">
                                        {weeklyStats.avgRating.toFixed(1)}
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-yellow-500 mt-1">
                                        {"★".repeat(Math.round(weeklyStats.avgRating))}
                                        {"☆".repeat(5 - Math.round(weeklyStats.avgRating))}
                                        <span className="text-gray-400 ml-1">({weeklyStats.weeklyRatedOrdersCount})</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col">
                                    <span className="text-gray-400 text-sm font-medium">{t.noData}</span>
                                    <div className="flex text-gray-200 text-xs mt-1">
                                        {"☆☆☆☆☆"}
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>
                </div>

                {/* Monthly Consumption Section */}
                <Card className="overflow-hidden border-none shadow-sm">
                    <CardHeader className="bg-yellow-50/50 pb-4">
                        <div className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-yellow-600" />
                            <CardTitle className="text-lg">{t.monthly_consumption}</CardTitle>
                        </div>
                        <p className="text-xs text-muted-foreground">{t.current_month}: {new Date().toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', { month: 'long', year: 'numeric' })}</p>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {!analytics || analytics.monthlyOrders.length === 0 ? (
                            <p className="text-center text-muted-foreground py-4 italic">{t.no_data}</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <h4 className="font-bold text-sm mb-3 border-b pb-1 flex items-center justify-between">
                                        {t.by_client}
                                        <Badge variant="outline" className="text-[10px] py-0">{t.tons}</Badge>
                                    </h4>
                                    <div className="space-y-2">
                                        {analytics.consumptionByClient.map((item, idx) => (
                                            <div key={idx} className="flex justify-between text-sm items-center">
                                                <span className="truncate max-w-[150px]">{item.name}</span>
                                                <span className="font-medium text-blue-600">{item.tons.toFixed(1)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm mb-3 border-b pb-1 flex items-center justify-between">
                                        {t.by_product}
                                        <Badge variant="outline" className="text-[10px] py-0">{t.tons}</Badge>
                                    </h4>
                                    <div className="space-y-2">
                                        {analytics.consumptionByProduct.map((item, idx) => (
                                            <div key={idx} className="flex justify-between text-sm items-center">
                                                <span className="truncate max-w-[150px]">{item.name}</span>
                                                <span className="font-medium text-green-600">{item.tons.toFixed(1)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm mb-3 border-b pb-1 flex items-center justify-between">
                                        {t.by_supplier}
                                        <Badge variant="outline" className="text-[10px] py-0">{t.tons}</Badge>
                                    </h4>
                                    <div className="space-y-2">
                                        {analytics.consumptionBySupplier.map((item, idx) => (
                                            <div key={idx} className="flex justify-between text-sm items-center">
                                                <span>{item.name}</span>
                                                <span className="font-medium text-yellow-600">{item.tons.toFixed(1)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Performance KPIs Section */}
                <Card className="border-none shadow-sm">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-blue-600" />
                            <CardTitle className="text-lg">{t.performance}</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {!analytics ? (
                             <p className="text-center text-muted-foreground py-4 italic">{t.no_data}</p>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="bg-blue-50/50 p-4 rounded-lg flex items-center gap-4">
                                    <div className="bg-blue-100 p-2 rounded-full">
                                        <Clock className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">{t.avg_approval_time}</p>
                                        <p className="text-xl font-bold text-blue-700">{analytics.avgApprovalTime} {t.hours}</p>
                                    </div>
                                </div>
                                <div className="bg-green-50/50 p-4 rounded-lg flex items-center gap-4">
                                    <div className="bg-green-100 p-2 rounded-full">
                                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">{t.on_time_delivery}</p>
                                        <p className="text-xl font-bold text-green-700">{analytics.onTimeRate}%</p>
                                    </div>
                                </div>
                                <div className="bg-yellow-50/50 p-4 rounded-lg flex items-center gap-4">
                                    <div className="bg-yellow-100 p-2 rounded-full">
                                        <Star className="h-6 w-6 text-yellow-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">{t.avg_rating}</p>
                                        <p className="text-xl font-bold text-yellow-700">{analytics.avgRating} / 5</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Charts Section */}
                <Card className="border-none shadow-sm">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-2">
                            <PieChart className="h-5 w-5 text-indigo-600" />
                            <CardTitle className="text-lg">{t.charts}</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {!analytics ? (
                             <p className="text-center text-muted-foreground py-8 italic">{t.no_data}</p>
                        ) : (
                            <div className="space-y-8">
                                {/* Monthly Orders Bar Chart */}
                                <div>
                                    <h4 className="text-sm font-semibold mb-4 text-center">{t.orders_by_month}</h4>
                                    <div className="h-[250px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={analytics.ordersByMonth}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                <XAxis dataKey="month" fontSize={12} />
                                                <YAxis fontSize={12} />
                                                <Tooltip 
                                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                    formatter={(value, name) => [value, name === 'orders' ? (isRTL ? 'הזמנות' : 'Orders') : (isRTL ? 'טון' : 'Tons')]}
                                                />
                                                <Legend />
                                                <Bar dataKey="orders" name={isRTL ? 'הזמנות' : 'Orders'} fill="#eab308" radius={[4, 4, 0, 0]} />
                                                <Bar dataKey="tons" name={isRTL ? 'טון' : 'Tons'} fill="#2563eb" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                                    {/* Supplier Distribution Pie Chart */}
                                    <div>
                                        <h4 className="text-sm font-semibold mb-4 text-center">{t.supplier_distribution}</h4>
                                        <div className="h-[200px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RPieChart>
                                                    <Pie
                                                        data={analytics.supplierPieData}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={60}
                                                        outerRadius={80}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                    >
                                                        {analytics.supplierPieData.map((_, index) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
                                                    <Legend />
                                                </RPieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Rating Trend Line Chart */}
                                    <div>
                                        <h4 className="text-sm font-semibold mb-4 text-center">{t.rating_trend}</h4>
                                        <div className="h-[200px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={analytics.ratingByMonth}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                    <XAxis dataKey="month" fontSize={10} />
                                                    <YAxis domain={[0, 5]} fontSize={10} />
                                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
                                                    <Line type="monotone" dataKey="rating" name={isRTL ? 'דירוג' : 'Rating'} stroke="#eab308" strokeWidth={3} dot={{ r: 4, fill: '#eab308' }} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Export & Actions Section */}
                <Card className="border-none shadow-sm bg-gray-900 text-white">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-2 text-white">
                            <Download className="h-5 w-5" />
                            <CardTitle className="text-lg">{t.export}</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button 
                                onClick={handleExportCSV}
                                variant="outline" 
                                className="flex-1 bg-white/10 hover:bg-white/20 border-white/20 text-white gap-2 h-12"
                            >
                                <Download className="h-4 w-4" />
                                {t.export_csv}
                            </Button>
                            <Button 
                                onClick={handleSendEmail}
                                className="flex-1 piter-yellow gap-2 h-12"
                            >
                                <Send className="h-4 w-4" />
                                {t.send_email}
                            </Button>
                        </div>
                        {user?.email && (
                            <p className="text-[10px] text-white/50 text-center mt-3">
                                {isRTL ? 'הדוח יישלח לכתובת:' : 'Report will be sent to:'} {user.email}
                            </p>
                        )}
                    </CardContent>
                </Card>

            </div>
        </Layout>
    );
};

export default Reports;
