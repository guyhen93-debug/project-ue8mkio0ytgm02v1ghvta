import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Site, Client } from '@/entities';
import { useLanguage } from '@/contexts/LanguageContext';
import { Plus, Edit, Trash2, Search, RefreshCw, MapPin } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

export const SiteManagement: React.FC = () => {
  const { language } = useLanguage();
  const [sites, setSites] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<any>(null);
  const [formData, setFormData] = useState({
    client_id: '',
    site_name: '',
    region_type: 'eilat',
    contact_name: '',
    contact_phone: '',
    is_active: true
  });

  const translations = {
    he: {
      title: 'ניהול אתרים',
      addSite: 'הוסף אתר',
      editSite: 'ערוך אתר',
      search: 'חיפוש אתר...',
      refresh: 'רענן',
      siteName: 'שם האתר',
      client: 'לקוח',
      region: 'אזור',
      eilat: 'אילת',
      outsideEilat: 'מחוץ לאילת',
      contactName: 'שם איש קשר',
      contactPhone: 'טלפון איש קשר',
      status: 'סטטוס',
      active: 'פעיל',
      inactive: 'לא פעיל',
      actions: 'פעולות',
      edit: 'ערוך',
      delete: 'מחק',
      save: 'שמור',
      cancel: 'ביטול',
      noSites: 'אין אתרים במערכת',
      addFirstSite: 'הוסף את האתר הראשון',
      deleteConfirm: 'האם אתה בטוח שברצונך למחוק אתר זה?',
      siteAdded: 'אתר נוסף בהצלחה',
      siteUpdated: 'אתר עודכן בהצלחה',
      siteDeleted: 'אתר נמחק בהצלחה',
      error: 'שגיאה',
      requiredFields: 'יש למלא את כל השדות החובה',
      selectClient: 'בחר לקוח'
    },
    en: {
      title: 'Site Management',
      addSite: 'Add Site',
      editSite: 'Edit Site',
      search: 'Search site...',
      refresh: 'Refresh',
      siteName: 'Site Name',
      client: 'Client',
      region: 'Region',
      eilat: 'Eilat',
      outsideEilat: 'Outside Eilat',
      contactName: 'Contact Name',
      contactPhone: 'Contact Phone',
      status: 'Status',
      active: 'Active',
      inactive: 'Inactive',
      actions: 'Actions',
      edit: 'Edit',
      delete: 'Delete',
      save: 'Save',
      cancel: 'Cancel',
      noSites: 'No sites in the system',
      addFirstSite: 'Add your first site',
      deleteConfirm: 'Are you sure you want to delete this site?',
      siteAdded: 'Site added successfully',
      siteUpdated: 'Site updated successfully',
      siteDeleted: 'Site deleted successfully',
      error: 'Error',
      requiredFields: 'Please fill all required fields',
      selectClient: 'Select client'
    }
  };

  const t = translations[language];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sitesData, clientsData] = await Promise.all([
        Site.list('-created_at', 1000),
        Client.list('-created_at', 1000)
      ]);
      setSites(sitesData);
      setClients(clientsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: t.error,
        description: 'Failed to load data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.client_id || !formData.site_name.trim()) {
      toast({
        title: t.error,
        description: t.requiredFields,
        variant: 'destructive'
      });
      return;
    }

    try {
      if (editingSite) {
        await Site.update(editingSite.id, formData);
        toast({ title: t.siteUpdated });
      } else {
        await Site.create(formData);
        toast({ title: t.siteAdded });
      }
      
      setIsDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving site:', error);
      toast({
        title: t.error,
        description: 'Failed to save site',
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (site: any) => {
    setEditingSite(site);
    setFormData({
      client_id: site.client_id,
      site_name: site.site_name,
      region_type: site.region_type || 'eilat',
      contact_name: site.contact_name || '',
      contact_phone: site.contact_phone || '',
      is_active: site.is_active ?? true
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t.deleteConfirm)) return;

    try {
      await Site.delete(id);
      toast({ title: t.siteDeleted });
      loadData();
    } catch (error) {
      console.error('Error deleting site:', error);
      toast({
        title: t.error,
        description: 'Failed to delete site',
        variant: 'destructive'
      });
    }
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
    setEditingSite(null);
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || clientId;
  };

  const filteredSites = sites.filter(site =>
    site.site_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getClientName(site.client_id).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder={t.search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="piter-yellow flex-1 sm:flex-none">
                <Plus className="w-4 h-4 mr-2" />
                {t.addSite}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingSite ? t.editSite : t.addSite}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="client_id">{t.client}</Label>
                  <Select
                    value={formData.client_id}
                    onValueChange={(value) => setFormData({ ...formData, client_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t.selectClient} />
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
                <div className="space-y-2">
                  <Label htmlFor="site_name">{t.siteName}</Label>
                  <Input
                    id="site_name"
                    value={formData.site_name}
                    onChange={(e) => setFormData({ ...formData, site_name: e.target.value })}
                    placeholder={t.siteName}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="region_type">{t.region}</Label>
                  <Select
                    value={formData.region_type}
                    onValueChange={(value) => setFormData({ ...formData, region_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="eilat">{t.eilat}</SelectItem>
                      <SelectItem value="outside_eilat">{t.outsideEilat}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_name">{t.contactName}</Label>
                  <Input
                    id="contact_name"
                    value={formData.contact_name}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                    placeholder={t.contactName}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_phone">{t.contactPhone}</Label>
                  <Input
                    id="contact_phone"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    placeholder={t.contactPhone}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="is_active">{t.status}</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      {formData.is_active ? t.active : t.inactive}
                    </span>
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="piter-yellow flex-1">
                    {t.save}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="flex-1"
                  >
                    {t.cancel}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={loadData} size="icon" className="flex-shrink-0">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Sites List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto"></div>
        </div>
      ) : filteredSites.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 mb-2">{t.noSites}</p>
            <p className="text-sm text-gray-500">{t.addFirstSite}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* Mobile Cards */}
          <div className="grid grid-cols-1 gap-3">
            {filteredSites.map((site) => (
              <Card key={site.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{site.site_name}</h3>
                      <p className="text-sm text-gray-600 mb-1">{getClientName(site.client_id)}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {site.region_type === 'eilat' ? t.eilat : t.outsideEilat}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          site.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {site.is_active ? t.active : t.inactive}
                        </span>
                      </div>
                      {site.contact_name && (
                        <p className="text-xs text-gray-500 mt-2">
                          {site.contact_name} {site.contact_phone && `• ${site.contact_phone}`}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(site)}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      {t.edit}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(site.id)}
                      className="flex-1"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      {t.delete}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};