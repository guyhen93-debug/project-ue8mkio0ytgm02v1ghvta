import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { mockDataService } from '@/services/mockDataService';

interface SiteSelectorProps {
  value: string;
  onChange: (value: string) => void;
  selectedClientId?: string;
  onSiteSelect?: (site: any) => void;
}

const SiteSelector: React.FC<SiteSelectorProps> = ({ 
  value, 
  onChange, 
  selectedClientId,
  onSiteSelect 
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [sites, setSites] = useState<any[]>([]);
  const [selectedSite, setSelectedSite] = useState<any>(null);

  useEffect(() => {
    loadSites();
  }, [selectedClientId, user]);

  useEffect(() => {
    if (value) {
      loadSelectedSite();
    } else {
      setSelectedSite(null);
    }
  }, [value]);

  const loadSites = async () => {
    try {
      let filter: any = { is_active: true };
      
      // For managers, show sites based on selected client
      if (user?.role === 'manager' && selectedClientId) {
        filter.client_id = selectedClientId;
      }
      // For regular users, show only their company's sites
      else if (user?.role === 'client') {
        filter.client_id = user.id;
      }
      
      const siteList = await mockDataService.getSites(filter);
      setSites(siteList);
    } catch (error) {
      console.error('Error loading sites:', error);
    }
  };

  const loadSelectedSite = async () => {
    try {
      const site = await mockDataService.getSiteById(value);
      setSelectedSite(site);
      if (onSiteSelect && site) {
        onSiteSelect(site);
      }
    } catch (error) {
      console.error('Error loading selected site:', error);
    }
  };

  const handleSiteChange = (siteId: string) => {
    onChange(siteId);
    const site = sites.find(s => s.id === siteId);
    if (onSiteSelect && site) {
      onSiteSelect(site);
    }
  };

  return (
    <div className="space-y-3">
      <Label htmlFor="site" className="text-base font-bold">
        {t('select_site')} *
      </Label>
      <Select value={value} onValueChange={handleSiteChange}>
        <SelectTrigger className="h-12">
          <SelectValue placeholder={t('select_site')} />
        </SelectTrigger>
        <SelectContent>
          {sites.map((site) => (
            <SelectItem key={site.id} value={site.id}>
              {site.site_name} ({t(site.region_type)})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {/* Display contact information when site is selected */}
      {selectedSite && (selectedSite.contact_name || selectedSite.contact_phone) && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700 mb-1">
            {t('site_contact')}:
          </p>
          {selectedSite.contact_name && (
            <p className="text-sm text-gray-600">
              {t('contact_name')}: {selectedSite.contact_name}
            </p>
          )}
          {selectedSite.contact_phone && (
            <p className="text-sm text-gray-600">
              {t('contact_phone')}: {selectedSite.contact_phone}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default SiteSelector;