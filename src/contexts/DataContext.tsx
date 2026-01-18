import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, Site, Client } from '@/entities';

interface DataContextType {
    products: any[];
    sites: any[];
    clients: any[];
    productsMap: Record<string, any>;
    sitesMap: Record<string, any>;
    clientsMap: Record<string, any>;
    loading: boolean;
    error: string | null;
    refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [products, setProducts] = useState<any[]>([]);
    const [sites, setSites] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [productsMap, setProductsMap] = useState<Record<string, any>>({});
    const [sitesMap, setSitesMap] = useState<Record<string, any>>({});
    const [clientsMap, setClientsMap] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            const errors: string[] = [];

            // Load all data with proper error tracking
            const [productsResult, sitesResult, clientsResult] = await Promise.all([
                Product.list('-created_at', 1000).catch((err) => {
                    console.error('Error loading products:', err);
                    errors.push('products');
                    return [];
                }),
                Site.list('-created_at', 1000).catch((err) => {
                    console.error('Error loading sites:', err);
                    errors.push('sites');
                    return [];
                }),
                Client.list('-created_at', 1000).catch((err) => {
                    console.error('Error loading clients:', err);
                    errors.push('clients');
                    return [];
                })
            ]);

            // Report partial failures to user
            if (errors.length > 0) {
                const failedResources = errors.join(', ');
                console.warn(`⚠️ Failed to load: ${failedResources}. Some features may be unavailable.`);
                setError(`Failed to load: ${failedResources}. Please refresh to try again.`);
            }

            // Create maps for quick lookup
            const pMap: Record<string, any> = {};
            productsResult.forEach(p => { pMap[p.id] = p; });

            const sMap: Record<string, any> = {};
            sitesResult.forEach(s => { sMap[s.id] = s; });

            const cMap: Record<string, any> = {};
            clientsResult.forEach(c => { cMap[c.id] = c; });

            setProducts(productsResult);
            setSites(sitesResult);
            setClients(clientsResult);
            setProductsMap(pMap);
            setSitesMap(sMap);
            setClientsMap(cMap);
        } catch (err) {
            console.error('Error loading data:', err);
            setError('Failed to load application data. Please refresh the page.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const refreshData = async () => {
        await loadData();
    };

    return (
        <DataContext.Provider
            value={{
                products,
                sites,
                clients,
                productsMap,
                sitesMap,
                clientsMap,
                loading,
                error,
                refreshData
            }}
        >
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};