import { useState, useEffect } from 'react';

interface ValidationResult {
    valid: boolean;
    message: string;
}

export const useOrderValidation = (formData: any, sites: any[]) => {
    const [validation, setValidation] = useState<ValidationResult>({ valid: true, message: '' });

    const CUBIC_TO_TON_RATIO = 1.6;

    const getSelectedSite = () => {
        return sites.find(s => s.id === formData.site_id);
    };

    const getMinimumQuantity = () => {
        if (formData.delivery_method !== 'external') {
            return 0;
        }

        if (formData.supplier === 'maavar_rabin') {
            return 40;
        }

        const site = getSelectedSite();
        if (!site) return 20;

        if (site.region_type === 'outside_eilat') {
            return 40;
        }

        return 20;
    };

    const getMultipleRequirement = () => {
        if (formData.delivery_method !== 'external') {
            return 0;
        }

        if (formData.supplier === 'shifuli_har') {
            return 20;
        }

        if (formData.supplier === 'maavar_rabin') {
            return 40;
        }

        return 0;
    };

    useEffect(() => {
        validateQuantity();
    }, [formData.quantity_tons, formData.delivery_method, formData.supplier, formData.site_id]);

    const validateQuantity = () => {
        if (!formData.quantity_tons) {
            setValidation({ valid: true, message: '' });
            return;
        }

        const quantity = parseInt(formData.quantity_tons);
        const minQuantity = getMinimumQuantity();
        const multipleRequirement = getMultipleRequirement();

        // Check multiples requirement (only for external delivery)
        if (formData.delivery_method === 'external' && multipleRequirement > 0 && quantity % multipleRequirement !== 0) {
            const supplierName = formData.supplier === 'shifuli_har' ? 'שיפולי הר' : 'מעבר רבין';
            setValidation({
                valid: false,
                message: `הובלה חיצונית מ${supplierName} חייבת להיות בכפולות של ${multipleRequirement} טון (${multipleRequirement}, ${multipleRequirement * 2}, ${multipleRequirement * 3}...)`
            });
            return;
        }

        // Special validation for Maavar Rabin minimum (only for external delivery)
        if (formData.supplier === 'maavar_rabin' && formData.delivery_method === 'external' && quantity < 40) {
            setValidation({
                valid: false,
                message: 'מינימום הזמנה להובלה חיצונית ממעבר רבין: 40 טון'
            });
            return;
        }

        // Validation for Shifuli Har external delivery
        if (formData.supplier === 'shifuli_har' && formData.delivery_method === 'external' && quantity < minQuantity) {
            const site = getSelectedSite();
            const regionText = site?.region_type === 'outside_eilat' ? 'לאתר מחוץ לאילת' : '';
            setValidation({
                valid: false,
                message: `מינימום הזמנה להובלה חיצונית ${regionText}: ${minQuantity} טון`
            });
            return;
        }

        setValidation({ valid: true, message: '' });
    };

    return {
        validation,
        getMinimumQuantity,
        getMultipleRequirement,
        CUBIC_TO_TON_RATIO
    };
};