import { format } from 'date-fns';
import { he } from 'date-fns/locale';

/**
 * Get product name by ID
 */
export const getProductName = (
    productId: string,
    products: Record<string, any>,
    language: string = 'he'
): string => {
    const product = products[productId];
    if (!product) return 'מוצר לא ידוע';
    return product.name_he || product.name_en || product.product_id || 'מוצר לא ידוע';
};

/**
 * Get site name by ID
 */
export const getSiteName = (siteId: string, sites: Record<string, any>): string => {
    const site = sites[siteId];
    return site?.site_name || 'אתר לא ידוע';
};

/**
 * Get client name by site ID or client ID
 */
export const getClientName = (
    order: any,
    sites: Record<string, any> | any[] | null | undefined,
    clients: Record<string, any> | any[] | null | undefined
): string => {
    try {
        if (!order) return 'לקוח לא ידוע';

        // 1. Try direct client_id on order
        if (order.client_id && clients && typeof clients === 'object') {
            const clientFromOrder = (clients as any)[order.client_id];
            if (clientFromOrder && typeof clientFromOrder.name === 'string') {
                return clientFromOrder.name;
            }
        }

        // 2. Fallback: go through site -> client_id
        if (order.site_id && sites && typeof sites === 'object') {
            const siteFromMap = (sites as any)[order.site_id];
            const site = siteFromMap || null;

            if (site && site.client_id && clients && typeof clients === 'object') {
                const clientFromSite = (clients as any)[site.client_id];
                if (clientFromSite && typeof clientFromSite.name === 'string') {
                    return clientFromSite.name;
                }
            }
        }
    } catch (err) {
        console.error('Error in getClientName helper', err, { order, sites, clients });
    }

    return 'לקוח לא ידוע';
};

/**
 * Get supplier name
 */
export const getSupplierName = (supplier: string, language: string = 'he'): string => {
    const names = {
        shifuli_har: { he: 'שיפולי הר', en: 'Shifuli Har' },
        maavar_rabin: { he: 'מעבר רבין', en: 'Maavar Rabin' }
    };
    return names[supplier]?.[language] || supplier;
};

/**
 * Format date
 */
export const formatOrderDate = (dateString: string, language: string = 'he'): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

/**
 * Format date with time
 */
export const formatOrderDateTime = (dateString: string, language: string = 'he'): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

/**
 * Get status badge configuration
 */
export const getStatusConfig = (status: string, language: string = 'he') => {
    const configs: Record<string, { label: string; className: string }> = {
        pending: {
            label: language === 'he' ? 'ממתין לאישור' : 'Pending',
            className: 'bg-orange-100 text-orange-700 border border-orange-200 px-2.5 py-1 text-[11px] font-semibold rounded-full',
        },
        approved: {
            label: language === 'he' ? 'מאושר' : 'Approved',
            className: 'bg-green-100 text-green-700 border border-green-200 px-2.5 py-1 text-[11px] font-semibold rounded-full',
        },
        completed: {
            label: language === 'he' ? 'הושלם' : 'Completed',
            className: 'bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-1 text-[11px] font-semibold rounded-full',
        },
        in_transit: {
            label: language === 'he' ? 'בדרך' : 'In Transit',
            className: 'bg-blue-100 text-blue-700 border border-blue-200 px-2.5 py-1 text-[11px] font-semibold rounded-full',
        },
        rejected: {
            label: language === 'he' ? 'נדחה' : 'Rejected',
            className: 'bg-red-100 text-red-700 border border-red-200 px-2.5 py-1 text-[11px] font-semibold rounded-full',
        },
    };

    const config = configs[status] || configs.pending;
    return config;
};

/**
 * Get client ID from site
 */
export const getClientIdFromSite = (siteId: string, sites: any[]): string | null => {
    const site = sites.find(s => s.id === siteId);
    return site?.client_id || null;
};

/**
 * Find user's client
 */
export const findUserClient = (user: any, clients: any[]): any | null => {
    if (!user) return null;

    // Try to find by created_by
    let matchingClient = clients.find(
        c => c.created_by === user.email || (user.company && c.name === user.company)
    );

    // Fallback: try to match by email pattern
    if (!matchingClient && user.email) {
        matchingClient = clients.find(
            c =>
                user.email.toLowerCase().includes(c.name.toLowerCase()) ||
                c.name.toLowerCase().includes(user.email.split('@')[0].toLowerCase())
        );
    }

    return matchingClient || null;
}
