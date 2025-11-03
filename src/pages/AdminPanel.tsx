import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { mockDataService } from '@/services/mockDataService';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Building, MapPin } from 'lucide-react';

const AdminPanel: React.FC = () => {
  const [clients, setClients] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showClientDialog, setShowClientDialog] = useState(false);
  const [showSiteDialog, setShowSiteDialog] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [editingSite, setEditingSite] = useState<any>(null);
  const [clientForm, setClientForm] = useState({ name: '', category: 'client', is_active: true });
  const [siteForm, setSiteForm] = useState({
    client_id: '',
    site_name: '',
    region_type: 'eilat',
    contact_name: '',
    contact_phone: '',
    is_active: true
  });
  const { user } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    if (user?.role === 'manager') {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [clientList, siteList] = await Promise.all([
        mockDataService.getClients({}, 'name'),
        mockDataService.getSites({}, 'site_name')
      ]);
      setClients(clientList);
      setSites(siteList);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveClient = async () => {
    try {
      if (editingClient) {
        await mockDataService.updateClient(editingClient.id, clientForm);
        toast({
          title: t('client_updated'),
          description: t('client_updated_successfully'),
        });
      } else {
        await mockDataService.createClient(clientForm);
        toast({
          title: t('client_created'),
          description: t('client_created_successfully'),
        });
      }
      
      setShowClientDialog(false);
      setEditingClient(null);
      setClientForm({ name: '', category: 'client', is_active: true });
      await loadData();
    } catch (error) {
      console.error('Error saving client:', error);
      toast({
        title: t('error'),
        description: t('unknown_error'),
        variant: 'destructive',
      });
    }
  };

  const handleSaveSite = async () => {
    try {
      if (editingSite) {
        await mockDataService.updateSite(editingSite.id, siteForm);
        toast({
          title: t('site_updated'),
          description: t('site_updated_successfully'),
        });
      } else {
        await mockDataService.createSite(siteForm);
        toast({
          title: t('site_created'),
          description: t('site_created_successfully'),
        });
      }
      
      setShowSiteDialog(false);
      setEditingSite(null);
      setSiteForm({
        client_id: '',
        site_name: '',
        region_type: 'eilat',
        contact_name: '',
        contact_phone: '',
        is_active: true
      });
      await loadData();
    } catch (error) {
      console.error('Error saving site:', error);
      toast({
        title: t('error'),
        description: t('unknown_error'),
        variant: 'destructive',
      });
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (confirm(t('confirm_delete_client'))) {
      try {
        await mockDataService.deleteClient(clientId);
        toast({
          title: t('client_deleted'),
          description: t('client_deleted_successfully'),
        });
        await loadData();
      } catch (error) {
        console.error('Error deleting client:', error);
        toast({
          title: t('error'),
          description: t('unknown_error'),
          variant: 'destructive',
        });
      }
    }
  };

  const handleDeleteSite = async (siteId: string) => {
    if (confirm(t('confirm_delete_site'))) {
      try {
        await mockDataService.deleteSite(siteId);
        toast({
          title: t('site_deleted'),
          description: t('site_deleted_successfully'),
        });
        await loadData();
      } catch (error) {
        console.error('Error deleting site:', error);
        toast({
          title: t('error'),
          description: t('unknown_error'),
          variant: 'destructive',
        });
      }
    }
  };

  const openEditClient = (client: any) => {
    setEditingClient(client);
    setClientForm({
      name: client.name,
      category: client.category,
      is_active: client.is_active
    });
    setShowClientDialog(true);
  };

  const openEditSite = (site: any) => {
    setEditingSite(site);
    setSiteForm({
      client_id: site.client_id,
      site_name: site.site_name,
      region_type: site.region_type,
      contact_name: site.contact_name,
      contact_phone: site.contact_phone,
      is_active: site.is_active
    });
    setShowSiteDialog(true);
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : clientId;
  };

  if (user?.role !== 'manager') {
    return (
      <Layout title={t('admin_panel')}>
        <div className="px-4 py-8 text-center">
          <h2 className="text-xl font-bold text-red-600">{t('access_denied')}</h2>
          <p className="text-gray-600 mt-2">{t('manager_only_access')}</p>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout title={t('admin_panel')}>
        <div className="px-4 py-8">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={t('admin_panel')}>
      <div className="px-4 py-6">
        {/* Clients Section */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                {t('clients_management')}
              </CardTitle>
              <Button
                onClick={() => setShowClientDialog(true)}
                className="bg-yellow-500 hover:bg-yellow-600 text-black"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('add_client')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {clients.map((client) => (
                <div key={client.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium">{client.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={client.category === 'manager' ? 'default' : 'secondary'}>
                        {t(client.category)}
                      </Badge>
                      <Badge variant={client.is_active ? 'default' : 'destructive'}>
                        {client.is_active ? t('active') : t('inactive')}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditClient(client)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClient(client.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sites Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {t('sites_management')}
              </CardTitle>
              <Button
                onClick={() => setShowSiteDialog(true)}
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
                      onClick={() => openEditSite(site)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteSite(site.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Client Dialog */}
        <Dialog open={showClientDialog} onOpenChange={setShowClientDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingClient ? t('edit_client') : t('add_client')}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="client_name">{t('name')}</Label>
                <Input
                  id="client_name"
                  value={clientForm.name}
                  onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                  placeholder={t('client_name')}
                />
              </div>
              <div>
                <Label htmlFor="client_category">{t('client_category')}</Label>
                <Select
                  value={clientForm.category}
                  onValueChange={(value) => setClientForm({ ...clientForm, category: value as 'manager' | 'client' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">{t('client')}</SelectItem>
                    <SelectItem value="manager">{t('manager')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="client_active"
                  checked={clientForm.is_active}
                  onChange={(e) => setClientForm({ ...clientForm, is_active: e.target.checked })}
                />
                <Label htmlFor="client_active">{t('is_active')}</Label>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveClient} className="flex-1">
                  {editingClient ? t('update') : t('create')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowClientDialog(false)}
                  className="flex-1"
                >
                  {t('cancel')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Site Dialog */}
        <Dialog open={showSiteDialog} onOpenChange={setShowSiteDialog}>
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
                  value={siteForm.client_id}
                  onValueChange={(value) => setSiteForm({ ...siteForm, client_id: value })}
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
                  value={siteForm.site_name}
                  onChange={(e) => setSiteForm({ ...siteForm, site_name: e.target.value })}
                  placeholder={t('site_name')}
                />
              </div>
              <div>
                <Label htmlFor="region_type">{t('region_type')}</Label>
                <Select
                  value={siteForm.region_type}
                  onValueChange={(value) => setSiteForm({ ...siteForm, region_type: value as 'eilat' | 'outside_eilat' })}
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
                  value={siteForm.contact_name}
                  onChange={(e) => setSiteForm({ ...siteForm, contact_name: e.target.value })}
                  placeholder={t('contact_name')}
                />
              </div>
              <div>
                <Label htmlFor="contact_phone">{t('contact_phone')}</Label>
                <Input
                  id="contact_phone"
                  value={siteForm.contact_phone}
                  onChange={(e) => setSiteForm({ ...siteForm, contact_phone: e.target.value })}
                  placeholder={t('contact_phone')}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="site_active"
                  checked={siteForm.is_active}
                  onChange={(e) => setSiteForm({ ...siteForm, is_active: e.target.checked })}
                />
                <Label htmlFor="site_active">{t('is_active')}</Label>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveSite} className="flex-1">
                  {editingSite ? t('update') : t('create')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowSiteDialog(false)}
                  className="flex-1"
                >
                  {t('cancel')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default AdminPanel;