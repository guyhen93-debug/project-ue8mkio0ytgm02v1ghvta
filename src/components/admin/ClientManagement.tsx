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
import { Plus, Edit, Trash2, Building } from 'lucide-react';

const ClientManagement: React.FC = () => {
  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'client' as 'manager' | 'client',
    is_active: true
  });
  const { t } = useLanguage();

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const clientList = await mockDataService.getClients({}, 'name');
      setClients(clientList);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editingClient) {
        await mockDataService.updateClient(editingClient.id, formData);
        toast({
          title: t('client_updated'),
          description: t('client_updated_successfully'),
        });
      } else {
        await mockDataService.createClient(formData);
        toast({
          title: t('client_created'),
          description: t('client_created_successfully'),
        });
      }
      
      setShowDialog(false);
      setEditingClient(null);
      resetForm();
      await loadClients();
    } catch (error) {
      console.error('Error saving client:', error);
      toast({
        title: t('error'),
        description: t('save_failed'),
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!clientToDelete) return;
    
    try {
      await mockDataService.deleteClient(clientToDelete.id);
      toast({
        title: t('client_deleted'),
        description: t('client_deleted_successfully'),
      });
      
      setShowDeleteConfirm(false);
      setClientToDelete(null);
      await loadClients();
    } catch (error) {
      console.error('Error deleting client:', error);
      toast({
        title: t('error'),
        description: t('delete_failed'),
        variant: 'destructive',
      });
    }
  };

  const openEdit = (client: any) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      category: client.category,
      is_active: client.is_active
    });
    setShowDialog(true);
  };

  const openDelete = (client: any) => {
    setClientToDelete(client);
    setShowDeleteConfirm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'client',
      is_active: true
    });
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
              <Building className="h-5 w-5" />
              {t('clients_management')}
            </CardTitle>
            <Button
              onClick={() => setShowDialog(true)}
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
              <div key={client.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
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
                    onClick={() => openEdit(client)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDelete(client)}
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
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
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
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('client_name')}
              />
            </div>
            <div>
              <Label htmlFor="client_category">{t('client_category')}</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value as 'manager' | 'client' })}
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
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
              <Label htmlFor="client_active">{t('is_active')}</Label>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} className="flex-1">
                {editingClient ? t('update') : t('create')}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDialog(false);
                  setEditingClient(null);
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
            {t('confirm_delete_client')} "{clientToDelete?.name}"?
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

export default ClientManagement;