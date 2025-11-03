import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { mockDataService } from '@/services/mockDataService';

interface ClientSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const ClientSelector: React.FC<ClientSelectorProps> = ({ value, onChange }) => {
  const { t } = useLanguage();
  const [clients, setClients] = useState<any[]>([]);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const clientList = await mockDataService.getClients({ is_active: true, category: 'client' });
      setClients(clientList);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  return (
    <div className="space-y-3">
      <Label htmlFor="client" className="text-base font-bold">
        {t('select_client')} *
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-12">
          <SelectValue placeholder={t('select_client')} />
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
  );
};

export default ClientSelector;