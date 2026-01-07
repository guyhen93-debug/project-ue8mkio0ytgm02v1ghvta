import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Client } from '@/entities';

interface AuthContextType {
    user: any;
    loading: boolean;
    isManager: boolean;
    error: string | null;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    retry: () => void;
    viewAsClient: boolean;
    setViewAsClient: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);
    const [viewAsClient, setViewAsClient] = useState(false);

    const loadUser = async () => {
        // Prevent multiple simultaneous loads
        if (hasAttemptedLoad && loading) {
            console.log('User load already in progress, skipping...');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            
            console.log('Loading user...');
            const currentUser = await User.me();
            console.log('User loaded successfully:', currentUser);
            
            let enhancedUser = currentUser;

            try {
                if (currentUser?.email === 'demo-client@piternofi.com' && currentUser.role === 'client') {
                    const allClients = await Client.list('-created_at', 1000).catch(() => [] as any[]);

                    // Prefer a specific known client name, fallback to the first one
                    const preferredName = "זמיר בן משה נכסים בע\"מ";
                    let chosenClient = allClients.find((c: any) => c.name === preferredName) || allClients[0];

                    if (chosenClient) {
                        const desiredCompany = chosenClient.name;
                        if (currentUser.company !== desiredCompany) {
                            // Persist the company on the user profile so other pages (like CreateOrder) can match it
                            try {
                                await User.updateProfile({ company: desiredCompany });
                            } catch (e) {
                                console.error('Error updating demo client profile company:', e);
                            }
                            enhancedUser = { ...currentUser, company: desiredCompany };
                        }
                    }
                }
            } catch (e) {
                console.error('Error linking demo client to existing Client:', e);
            }

            setUser(enhancedUser);
            setError(null);
            setHasAttemptedLoad(true);
        } catch (error: any) {
            console.error('Error loading user:', error);
            
            // Treat all common auth errors as "not logged in" - this is normal behavior
            const isAuthError = 
                error?.message?.includes('401') || 
                error?.message?.includes('Unauthorized') ||
                error?.message?.includes('Failed to fetch') ||
                error?.message?.includes('403') ||
                error?.message?.includes('Not authenticated');
            
            if (isAuthError) {
                console.log('User not authenticated, this is normal');
                setUser(null);
                setError(null); // Don't show error for not being logged in
            } else {
                // For truly unexpected errors, just set error state without retrying
                console.error('Unexpected error loading user:', error);
                setError(error?.message || 'Failed to load user');
                setUser(null);
            }
            
            setHasAttemptedLoad(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!hasAttemptedLoad) {
            loadUser();
        }
    }, []);

    const logout = async () => {
        try {
            console.log('Logging out...');
            await User.logout();
            setUser(null);
            setError(null);
            setViewAsClient(false);
            console.log('Logged out successfully');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    const refreshUser = async () => {
        console.log('Refreshing user...');
        setHasAttemptedLoad(false);
        await loadUser();
    };

    const retry = () => {
        console.log('Manual retry triggered');
        setHasAttemptedLoad(false);
        loadUser();
    };

    const effectiveRole = viewAsClient && user
        ? 'client'
        : user?.role;

    const isManager = effectiveRole === 'manager' || effectiveRole === 'administrator';

    return (
        <AuthContext.Provider value={{ 
            user, 
            loading, 
            isManager, 
            error, 
            logout, 
            refreshUser, 
            retry,
            viewAsClient,
            setViewAsClient
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};