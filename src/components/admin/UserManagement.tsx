import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { User } from '@/entities';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Search, RefreshCw, Edit, Mail, Building2, Globe, User as UserIcon } from 'lucide-react';

export const UserManagement: React.FC = () => {
  const { language } = useLanguage();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    company: '',
    language: 'he'
  });

  const translations = {
    he: {
      title: 'ניהול משתמשים',
      search: 'חיפוש משתמש...',
      refresh: 'רענן',
      filterAll: 'הכל',
      filterManager: 'מנהלים',
      filterClient: 'לקוחות',
      name: 'שם',
      email: 'אימייל',
      phone: 'טלפון',
      company: 'חברה',
      language: 'שפה',
      role: 'תפקיד',
      manager: 'מנהל',
      client: 'לקוח',
      administrator: 'מנהל מערכת',
      actions: 'פעולות',
      edit: 'ערוך',
      noUsers: 'אין משתמשים במערכת',
      userUpdated: 'משתמש עודכן בהצלחה',
      error: 'שגיאה',
      editUser: 'ערוך משתמש',
      save: 'שמור',
      cancel: 'ביטול',
      hebrew: 'עברית',
      english: 'אנגלית',
      createdAt: 'נוצר ב',
      cannotEditEmail: 'לא ניתן לערוך אימייל או תפקיד',
      note: 'הערה: ניתן לערוך רק את הפרטים האישיים שלך. לעריכת משתמשים אחרים, השתמש בטאב "Manage" של Superdev.',
      cannotEditOthers: 'לא ניתן לערוך משתמשים אחרים דרך האפליקציה. ניתן לערוך רק את הפרטים האישיים שלך.',
      editYourself: 'ערוך את הפרופיל שלי',
      manageNote: 'להוספת, עריכת תפקיד או מחיקת משתמשים - השתמש בטאב "Manage" של Superdev'
    },
    en: {
      title: 'User Management',
      search: 'Search user...',
      refresh: 'Refresh',
      filterAll: 'All',
      filterManager: 'Managers',
      filterClient: 'Clients',
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
      company: 'Company',
      language: 'Language',
      role: 'Role',
      manager: 'Manager',
      client: 'Client',
      administrator: 'Administrator',
      actions: 'Actions',
      edit: 'Edit',
      noUsers: 'No users in the system',
      userUpdated: 'User updated successfully',
      error: 'Error',
      editUser: 'Edit User',
      save: 'Save',
      cancel: 'Cancel',
      hebrew: 'Hebrew',
      english: 'English',
      createdAt: 'Created at',
      cannotEditEmail: 'Cannot edit email or role',
      note: 'Note: You can only edit your own personal details. To edit other users, use the Superdev "Manage" tab.',
      cannotEditOthers: 'Cannot edit other users through the app. You can only edit your own profile.',
      editYourself: 'Edit My Profile',
      manageNote: 'To add, change roles, or delete users - use the Superdev "Manage" tab'
    }
  };

  const t = translations[language];
  const isRTL = language === 'he';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const usersData = await User.list('-created_at', 1000);
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: t.error,
        description: 'Failed to load users',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const canEditUser = (userToEdit: any) => {
    if (!currentUser) return false;
    // Only allow editing yourself
    return currentUser.id === userToEdit.id;
  };

  const handleEdit = (user: any) => {
    // Check if user can edit this user
    if (!canEditUser(user)) {
      toast({
        title: t.error,
        description: t.cannotEditOthers,
        variant: 'destructive'
      });
      return;
    }

    setEditingUser(user);
    setFormData({
      full_name: user.name || user.full_name || '',
      phone: user.phone || '',
      company: user.company || '',
      language: user.language || 'he'
    });
    setIsEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingUser || !currentUser) return;

    // Double check that user is editing themselves
    if (editingUser.id !== currentUser.id) {
      toast({
        title: t.error,
        description: t.cannotEditOthers,
        variant: 'destructive'
      });
      return;
    }

    try {
      console.log('Updating profile with data:', formData);
      
      // Use User.updateProfile() which is the correct method for updating user data
      await User.updateProfile(formData);
      
      toast({ title: t.userUpdated });
      setIsEditDialogOpen(false);
      setEditingUser(null);
      
      // Reload users list and refresh current user
      await loadData();
      
      // If language was changed, reload the page to apply it
      if (formData.language !== currentUser.language) {
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: t.error,
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    if (role === 'manager' || role === 'administrator') {
      return 'bg-blue-100 text-blue-800';
    }
    return 'bg-green-100 text-green-800';
  };

  const getRoleLabel = (role: string) => {
    if (role === 'administrator') return t.administrator;
    if (role === 'manager') return t.manager;
    return t.client;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.company?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Info Banner */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          ℹ️ {t.manageNote}
        </p>
      </div>

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
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.filterAll}</SelectItem>
              <SelectItem value="manager">{t.filterManager}</SelectItem>
              <SelectItem value="client">{t.filterClient}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadData} size="icon" className="flex-shrink-0">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Users List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto"></div>
        </div>
      ) : filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <UserIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">{t.noUsers}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((user) => (
            <Card key={user.id}>
              <CardContent className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-bold text-sm sm:text-base">
                        {user.name || user.full_name || user.email}
                      </h3>
                      <Badge className={`${getRoleBadgeColor(user.role)} text-xs`}>
                        {getRoleLabel(user.role)}
                      </Badge>
                      {currentUser && currentUser.id === user.id && (
                        <Badge className="bg-purple-100 text-purple-800 text-xs">
                          {language === 'he' ? 'אתה' : 'You'}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <Mail className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <span className="text-gray-500">{t.email}:</span>
                    <span className="font-medium text-gray-900">{user.email}</span>
                  </div>
                  
                  {user.phone && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <UserIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <span className="text-gray-500">{t.phone}:</span>
                      <span className="font-medium text-gray-900">{user.phone}</span>
                    </div>
                  )}
                  
                  {user.company && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <Building2 className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <span className="text-gray-500">{t.company}:</span>
                      <span className="font-medium text-gray-900">{user.company}</span>
                    </div>
                  )}
                  
                  {user.language && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <Globe className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <span className="text-gray-500">{t.language}:</span>
                      <span className="font-medium text-gray-900">
                        {user.language === 'he' ? t.hebrew : t.english}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {canEditUser(user) && (
                  <div className="pt-3 border-t border-gray-100">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(user)}
                      className="w-full"
                    >
                      <Edit className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                      {t.editYourself}
                    </Button>
                  </div>
                )}

                {/* Created Date */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-400">
                    {t.createdAt} {formatDate(user.created_at)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>{t.editUser}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-900">{t.note}</p>
            </div>

            <div className="space-y-2">
              <Label>{t.email}</Label>
              <Input value={editingUser?.email || ''} disabled className="bg-gray-100" />
            </div>

            <div className="space-y-2">
              <Label>{t.role}</Label>
              <Input value={getRoleLabel(editingUser?.role || '')} disabled className="bg-gray-100" />
            </div>

            <div className="space-y-2">
              <Label>{t.name}</Label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>{t.phone}</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>{t.company}</Label>
              <Input
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>{t.language}</Label>
              <Select
                value={formData.language}
                onValueChange={(value) => setFormData({ ...formData, language: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="he">{t.hebrew}</SelectItem>
                  <SelectItem value="en">{t.english}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave} className="piter-yellow flex-1">
                {t.save}
              </Button>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="flex-1">
                {t.cancel}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};