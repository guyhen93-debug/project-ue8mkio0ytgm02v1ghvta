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
    sites: Record<string, any>,
    clients: Record<string, any>
): string => {
    // 1. Try from order.client_id directly
    if (order.client_id && clients[order.client_id]) {
        return clients[order.client_id].name;
    }

    // 2. Fallback to site's client_id
    if (order.site_id && sites[order.site_id]) {
        const site = sites[order.site_id];
        if (site.client_id && clients[site.client_id]) {
            return clients[site.client_id].name;
        }
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
    const configs = {
        pending: {
            label: { he: 'ממתין', en: 'Pending' },
            className: 'bg-[#FEF3C7] text-[#F59E0B] border border-[#FBBF24] px-2.5 py-1 text-[11px] font-semibold rounded-full'
        },
        approved: {
            label: { he: 'מאושר', en: 'Approved' },
            className: 'bg-[#D1FAE5] text-[#10B981] border border-[#34D399] px-2.5 py-1 text-[11px] font-semibold rounded-full'
        },
        in_transit: {
            label: { he: 'בדרך', en: 'In Transit' },
            className: 'bg-[#CFFAFE] text-[#06B6D4] border border-[#22D3EE] px-2.5 py-1 text-[11px] font-semibold rounded-full'
        },
        completed: {
            label: { he: 'הושלם', en: 'Completed' },
            className: 'bg-[#DCFCE7] text-[#059669] border border-[#16A34A] px-2.5 py-1 text-[11px] font-semibold rounded-full'
        },
        rejected: {
            label: { he: 'נדחה', en: 'Rejected' },
            className: 'bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5] px-2.5 py-1 text-[11px] font-semibold rounded-full'
        }
    };
    
    const config = configs[status as keyof typeof configs] || configs.pending;
    return {
        label: config.label[language as keyof typeof config.label],
        className: config.className
    };
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
