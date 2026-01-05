import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Client } from '@/entities';
import { useLanguage } from '@/contexts/LanguageContext';
import { Plus, Edit, Trash2, Search, RefreshCw } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

export const ClientManagement: React.FC = () => {
  const { language } = useLanguage();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [formData, setFormData] = useState({
    name: '',
    is_active: true
  });

  const translations = {
    he: {
      title: 'ניהול לקוחות',
      addClient: 'הוסף לקוח',
      editClient: 'ערוך לקוח',
      search: 'חיפוש לקוח...',
      refresh: 'רענן',
      name: 'שם הלקוח',
      status: 'סטטוס',
      active: 'פעיל',
      inactive: 'לא פעיל',
      actions: 'פעולות',
      edit: 'ערוך',
      delete: 'מחק',
      save: 'שמור',
      cancel: 'ביטול',
      noClients: 'אין לקוחות במערכת',
      addFirstClient: 'הוסף את הלקוח הראשון',
      deleteConfirm: 'האם אתה בטוח שברצונך למחוק לקוח זה?',
      clientAdded: 'לקוח נוסף בהצלחה',
      clientUpdated: 'לקוח עודכן בהצלחה',
      clientDeleted: 'לקוח נמחק בהצלחה',
      error: 'שגיאה',
      nameRequired: 'שם הלקוח הוא שדה חובה',
      filterAll: 'הכל',
      filterActive: 'פעילים',
      filterInactive: 'לא פעילים',
      clientsCount: 'לקוחות'
    },
    en: {
      title: 'Client Management',
      addClient: 'Add Client',
      editClient: 'Edit Client',
      search: 'Search client...',
      refresh: 'Refresh',
      name: 'Client Name',
      status: 'Status',
      active: 'Active',
      inactive: 'Inactive',
      actions: 'Actions',
      edit: 'Edit',
      delete: 'Delete',
      save: 'Save',
      cancel: 'Cancel',
      noClients: 'No clients in the system',
      addFirstClient: 'Add your first client',
      deleteConfirm: 'Are you sure you want to delete this client?',
      clientAdded: 'Client added successfully',
      clientUpdated: 'Client updated successfully',
      clientDeleted: 'Client deleted successfully',
      error: 'Error',
      nameRequired: 'Client name is required',
      filterAll: 'All',
      filterActive: 'Active',
      filterInactive: 'Inactive',
      clientsCount: 'clients'
    }
  };

  const t = translations[language];
  const isRTL = language === 'he';

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const data = await Client.list('-created_at', 1000);
      setClients(data);
    } catch (error) {
      console.error('Error loading clients:', error);
      toast({
        title: t.error,
        description: 'Failed to load clients',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: t.error,
        description: t.nameRequired,
        variant: 'destructive'
      });
      return;
    }

    try {
      if (editingClient) {
        await Client.update(editingClient.id, formData);
        toast({ title: t.clientUpdated });
      } else {
        await Client.create(formData);
        toast({ title: t.clientAdded });
      }
      
      setIsDialogOpen(false);
      resetForm();
      loadClients();
    } catch (error) {
      console.error('Error saving client:', error);
      toast({
        title: t.error,
        description: 'Failed to save client',
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (client: any) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      is_active: client.is_active ?? true
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t.deleteConfirm)) return;

    try {
      await Client.delete(id);
      toast({ title: t.clientDeleted });
      loadClients();
    } catch (error) {
      console.error('Error deleting client:', error);
      toast({
        title: t.error,
        description: 'Failed to delete client',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({ name: '', is_active: true });
    setEditingClient(null);
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && client.is_active) || 
                         (statusFilter === 'inactive' && !client.is_active);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1">
          <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4`} />
          <Input
            placeholder={t.search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={isRTL ? 'pr-10' : 'pl-10'}
          />
        </div>
        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="piter-yellow flex-1 sm:flex-none">
                <Plus className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t.addClient}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]" dir={isRTL ? 'rtl' : 'ltr'}>
              <DialogHeader>
                <DialogTitle>{editingClient ? t.editClient : t.addClient}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t.name}</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={t.name}
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
          <Button variant="outline" onClick={loadClients} size="icon" className="flex-shrink-0">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Filters and Count */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 py-2">
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('all')}
            className="rounded-full px-4 h-8"
          >
            {t.filterAll}
          </Button>
          <Button
            size="sm"
            variant={statusFilter === 'active' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('active')}
            className="rounded-full px-4 h-8"
          >
            {t.filterActive}
          </Button>
          <Button
            size="sm"
            variant={statusFilter === 'inactive' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('inactive')}
            className="rounded-full px-4 h-8"
          >
            {t.filterInactive}
          </Button>
        </div>
        <p className="text-xs sm:text-sm text-gray-500 font-medium text-right">
          {filteredClients.length} {t.clientsCount}
        </p>
      </div>

      {/* Clients List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto"></div>
        </div>
      ) : filteredClients.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600 mb-2">{t.noClients}</p>
            <p className="text-sm text-gray-500">{t.addFirstClient}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className={`${isRTL ? 'text-right' : 'text-left'} p-3 text-sm font-semibold text-gray-700`}>{t.name}</th>
                  <th className={`${isRTL ? 'text-right' : 'text-left'} p-3 text-sm font-semibold text-gray-700`}>{t.status}</th>
                  <th className={`${isRTL ? 'text-right' : 'text-left'} p-3 text-sm font-semibold text-gray-700`}>{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => (
                  <tr key={client.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 text-sm">{client.name}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        client.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {client.is_active ? t.active : t.inactive}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(client)}
                        >
                          <Edit className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                          {t.edit}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(client.id)}
                        >
                          <Trash2 className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                          {t.delete}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filteredClients.map((client) => (
              <Card key={client.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{client.name}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
                        client.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {client.is_active ? t.active : t.inactive}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(client)}
                      className="flex-1"
                    >
                      <Edit className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                      {t.edit}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(client.id)}
                      className="flex-1"
                    >
                      <Trash2 className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
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
