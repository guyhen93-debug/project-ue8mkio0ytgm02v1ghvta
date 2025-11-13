import React, { useState, useEffect } from 'react';
import { User } from '@/entities';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface RecipientSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const RecipientSelector: React.FC<RecipientSelectorProps> = ({ value, onChange }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isManager } = useAuth();
  const { language } = useLanguage();

  const translations = {
    he: {
      selectRecipient: 'בחר נמען',
      loading: 'טוען...',
      manager: 'מנהל',
      client: 'לקוח'
    },
    en: {
      selectRecipient: 'Select Recipient',
      loading: 'Loading...',
      manager: 'Manager',
      client: 'Client'
    }
  };

  const t = translations[language];

  useEffect(() => {
    loadUsers();
  }, [user, isManager]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const allUsers = await User.list();
      
      // Filter users based on role
      let availableUsers = allUsers.filter(u => u.email !== user?.email);
      
      // If current user is a client, only show managers
      if (!isManager) {
        availableUsers = availableUsers.filter(u => 
          u.role === 'manager' || u.role === 'administrator'
        );
      }
      
      setUsers(availableUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserLabel = (user: any) => {
    const roleLabel = user.role === 'manager' || user.role === 'administrator' 
      ? t.manager 
      : t.client;
    return `${user.full_name || user.email} (${roleLabel})`;
  };

  if (loading) {
    return <div className="text-sm text-gray-500">{t.loading}</div>;
  }

  return (
    <div className="space-y-2">
      <Label>{t.selectRecipient}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={t.selectRecipient} />
        </SelectTrigger>
        <SelectContent>
          {users.map((u) => (
            <SelectItem key={u.id} value={u.email}>
              {getUserLabel(u)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default RecipientSelector;