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
      selectRecipient: 'נמען (אל מי ההודעה?)',
      loading: 'טוען רשימת משתמשים...',
      manager: 'מנהל',
      client: 'לקוח'
    },
    en: {
      selectRecipient: 'Recipient (Who is this for?)',
      loading: 'Loading users...',
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
      
      // If current user is a client, only show managers/admins
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

  const getUserLabel = (u: any) => {
    const roleLabel = u.role === 'manager' || u.role === 'administrator' 
      ? t.manager 
      : t.client;
    return `${u.full_name || u.email} (${roleLabel})`;
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-semibold">{t.selectRecipient}</Label>
        <div className="h-10 bg-gray-100 animate-pulse rounded-md" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold">{t.selectRecipient}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="bg-white">
          <SelectValue placeholder={t.selectRecipient} />
        </SelectTrigger>
        <SelectContent>
          {users.length === 0 ? (
            <div className="p-2 text-sm text-gray-500 text-center">
              {language === 'he' ? 'לא נמצאו נמענים זמינים' : 'No recipients available'}
            </div>
          ) : (
            users.map((u) => (
              <SelectItem key={u.id} value={u.email}>
                {getUserLabel(u)}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default RecipientSelector;