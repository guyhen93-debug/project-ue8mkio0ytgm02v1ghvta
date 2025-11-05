import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { mockDataService } from '@/services/mockDataService';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, MapPin } from 'lucide-react';

const SiteManagement: React.FC = () => {
  const [sites, setSites] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingSite, setEditingSite] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [siteToDelete, setSiteToDelete] = useState<any>(null);
  const [formData, setFormData] = useState({
    client_id: '',
    site_name: '',
    region_type: 'eilat' as 'eilat' | 'outside_eilat',
    contact_name: '',
    contact_phone: '',
    is_active: true
  });
  const { t } = useLanguage();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [siteList, clientList] = await Promise.all([
        mockDataService.getSites({}, 'site_name'),
        mockDataService.getClients({ is_active: true }, 'name')
      ]);
      setSites(siteList);
      setClients(clientList);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editingSite) {
        await mockDataService.updateSite(editingSite.id, formData);
        toast({
          title: t('site_updated'),
          description: t('site_updated_successfully'),
        });
      } else {
        await mockDataService.createSite(formData);
        toast({
          title: t('site_created'),
          description: t('site_created_successfully'),
        });
      }
      
      setShowDialog(false);
      setEditingSite(null);
      resetForm();
      await loadData();
    } catch (error) {
      console.error('Error saving site:', error);
      toast({
        title: t('error'),
        description: t('save_failed'),
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!siteToDelete) return;
    
    try {
      await mockDataService.deleteSite(siteToDelete.id);
      toast({
        title: t('site_deleted'),
        description: t('site_deleted_successfully'),
      });
      
      setShowDeleteConfirm(false);
      setSiteToDelete(null);
      await loadData();
    } catch (error) {
      console.error('Error deleting site:', error);
      toast({
        title: t('error'),
        description: t('delete_failed'),
        variant: 'destructive',
      });
    }
  };

  const openEdit = (site: any) => {
    setEditingSite(site);
    setFormData({
      client_id: site.client_id,
      site_name: site.site_name,
      region_type: site.region_type,
      contact_name: site.contact_name,
      contact_phone: site.contact_phone,
      is_active: site.is_active
    });
    setShowDialog(true);
  };

  const openDelete = (site: any) => {
    setSiteToDelete(site);
    setShowDeleteConfirm(true);
  };

  const resetForm = () => {
    setFormData({
      client_id: '',
      site_name: '',
      region_type: 'eilat',
      contact_name: '',
      contact_phone: '',
      is_active: true
    });
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : clientId;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {t('sites_management')}
            </CardTitle>
            <Button
              onClick={() => setShowDialog(true)}
              className="bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('add_site')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sites.map((site) => (
              <div key={site.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium">{site.site_name}</h4>
                  <p className="text-sm text-gray-600">{getClientName(site.client_id)}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={site.region_type === 'eilat' ? 'default' : 'secondary'}>
                      {t(site.region_type)}
                    </Badge>
                    <Badge variant={site.is_active ? 'default' : 'destructive'}>
                      {site.is_active ? t('active') : t('inactive')}
                    </Badge>
                  </div>
                  {(site.contact_name || site.contact_phone) && (
                    <p className="text-xs text-gray-500 mt-1">
                      {site.contact_name} {site.contact_phone}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEdit(site)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDelete(site)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Site Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSite ? t('edit_site') : t('add_site')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="site_client">{t('select_client')}</Label>
              <Select
                value={formData.client_id}
                onValueChange={(value) => setFormData({ ...formData, client_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('select_client')} />
                </SelectTrigger>
                <SelectContent>
                  {clients.filter(c => c.category === 'client').map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="site_name">{t('site_name')}</Label>
              <Input
                id="site_name"
                value={formData.site_name}
                onChange={(e) => setFormData({ ...formData, site_name: e.target.value })}
                placeholder={t('site_name')}
              />
            </div>
            <div>
              <Label htmlFor="region_type">{t('region_type')}</Label>
              <Select
                value={formData.region_type}
                onValueChange={(value) => setFormData({ ...formData, region_type: value as 'eilat' | 'outside_eilat' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="eilat">{t('eilat')}</SelectItem>
                  <SelectItem value="outside_eilat">{t('outside_eilat')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="contact_name">{t('contact_name')}</Label>
              <Input
                id="contact_name"
                value={formData.contact_name}
                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                placeholder={t('contact_name')}
              />
            </div>
            <div>
              <Label htmlFor="contact_phone">{t('contact_phone')}</Label>
              <Input
                id="contact_phone"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                placeholder={t('contact_phone')}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="site_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
              <Label htmlFor="site_active">{t('is_active')}</Label>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} className="flex-1">
                {editingSite ? t('update') : t('create')}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDialog(false);
                  setEditingSite(null);
                  resetForm();
                }}
                className="flex-1"
              >
                {t('cancel')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('confirm_delete')}</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">
            {t('confirm_delete_site')} "{siteToDelete?.site_name}"?
          </p>
          <div className="flex gap-2 pt-4">
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="flex-1"
            >
              {t('delete')}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1"
            >
              {t('cancel')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SiteManagement;