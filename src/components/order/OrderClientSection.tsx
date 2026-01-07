import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Building2, User as UserIcon, Phone } from 'lucide-react';

interface OrderClientSectionProps {
    isManager: boolean;
    userClient: any;
    formData: any;
    clients: any[];
    filteredSites: any[];
    selectedSite: any;
    onClientChange: (clientId: string) => void;
    onSiteChange: (siteId: string) => void;
}

export const OrderClientSection: React.FC<OrderClientSectionProps> = ({
    isManager,
    userClient,
    formData,
    clients,
    filteredSites,
    selectedSite,
    onClientChange,
    onSiteChange
}) => {
    const getRegionName = () => {
        if (!selectedSite) return '';
        return selectedSite.region_type === 'eilat' ? 'אילת' : 'מחוץ לאילת';
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-gray-500" />
                    {isManager ? 'לקוח ואתר' : 'אתר'}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Client Selection/Display */}
                {isManager ? (
                    <div className="space-y-2">
                        <Label htmlFor="client_id" className="text-right block">
                            לקוח <span className="text-red-500">*</span>
                        </Label>
                        <Select value={formData.client_id} onValueChange={onClientChange}>
                            <SelectTrigger className="text-right">
                                <SelectValue placeholder="בחר לקוח" />
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
                ) : userClient ? (
                    <div className="space-y-1">
                        <Label className="text-xs text-gray-500 block">לקוח</Label>
                        <div className="p-3 bg-gray-50 rounded border font-bold text-gray-900">
                            {userClient.name}
                        </div>
                    </div>
                ) : (
                    /* Fallback if no userClient but is a client role */
                    <div className="space-y-2">
                        <Label htmlFor="client_id" className="text-right block">
                            לקוח <span className="text-red-500">*</span>
                        </Label>
                        <Select value={formData.client_id} onValueChange={onClientChange}>
                            <SelectTrigger className="text-right">
                                <SelectValue placeholder="בחר לקוח" />
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
                )}

                {!isManager && !userClient && (
                    <div className="p-4 bg-red-50 rounded-lg border-2 border-red-200">
                        <div className="flex items-center gap-3">
                            <Building2 className="h-5 w-5 text-red-600" />
                            <p className="text-sm text-red-700">לא נמצא לקוח משויך. אנא פנה למנהל המערכת.</p>
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    <Label htmlFor="site_id" className="text-right block">
                        אתר <span className="text-red-500">*</span>
                    </Label>
                    <Select
                        value={formData.site_id}
                        onValueChange={onSiteChange}
                        disabled={!formData.client_id}
                    >
                        <SelectTrigger className="text-right">
                            <SelectValue placeholder={formData.client_id ? "בחר אתר" : "בחר לקוח תחילה"} />
                        </SelectTrigger>
                        <SelectContent>
                            {filteredSites.length > 0 ? (
                                filteredSites.map((site) => (
                                    <SelectItem key={site.id} value={site.id}>
                                        {site.site_name}
                                    </SelectItem>
                                ))
                            ) : (
                                <SelectItem value="no-sites" disabled>
                                    אין אתרים זמינים
                                </SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                </div>

                {formData.site_id && selectedSite && (
                    <div className="space-y-3">
                        {/* Region Info */}
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-blue-600" />
                                <span className="text-sm text-blue-900 font-medium">אזור:</span>
                                <span className="text-sm text-blue-700 font-bold">{getRegionName()}</span>
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200 shadow-sm">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 pb-2 border-b border-green-200">
                                    <UserIcon className="h-5 w-5 text-green-600" />
                                    <span className="text-sm font-bold text-green-900">איש קשר באתר</span>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <UserIcon className="h-4 w-4 text-green-600" />
                                        <span className="text-sm text-green-700 font-medium">שם:</span>
                                        <span className="text-sm text-gray-900 font-bold">
                                            {selectedSite.contact_name || 'לא צוין'}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-green-600" />
                                        <span className="text-sm text-green-700 font-medium">טלפון:</span>
                                        {selectedSite.contact_phone ? (
                                            <a
                                                href={`tel:${selectedSite.contact_phone}`}
                                                className="text-sm text-blue-600 hover:text-blue-800 font-bold hover:underline"
                                            >
                                                {selectedSite.contact_phone}
                                            </a>
                                        ) : (
                                            <span className="text-sm text-gray-500">לא צוין</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
