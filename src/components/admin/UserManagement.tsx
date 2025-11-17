import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { User } from '@/entities';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Search, RefreshCw, UserPlus, Edit, Mail, Building2, Globe, Shield, User as UserIcon, Trash2, AlertTriangle } from 'lucide-react';

export const UserManagement: React.FC = () => {
  const { language } = useLanguage();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
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
      delete: 'מחק',
      noUsers: 'אין משתמשים במערכת',
      userUpdated: 'משתמש עודכן בהצלחה',
      userDeleted: 'משתמש נמחק בהצלחה',
      error: 'שגיאה',
      editUser: 'ערוך משתמש',
      deleteUser: 'מחק משתמש',
      save: 'שמור',
      cancel: 'ביטול',
      confirmDelete: 'אישור מחיקה',
      hebrew: 'עברית',
      english: 'אנגלית',
      createdAt: 'נוצר ב',
      cannotEditEmail: 'לא ניתן לערוך אימייל או תפקיד',
      note: 'הערה: ניתן לערוך רק פרטים אישיים. לשינוי אימייל או תפקיד, יש ליצור משתמש חדש.',
      deleteWarning: 'האם אתה בטוח שברצונך למחוק את המשתמש?',
      deleteWarningDetails: 'פעולה זו תמחק את המשתמש לצמיתות ולא ניתן לשחזר אותו.',
      cannotDeleteManager: 'אין לך הרשאה למחוק מנהלים אחרים',
      cannotDeleteOthers: 'אין לך הרשאה למחוק משתמשים אחרים'
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
      delete: 'Delete',
      noUsers: 'No users in the system',
      userUpdated: 'User updated successfully',
      userDeleted: 'User deleted successfully',
      error: 'Error',
      editUser: 'Edit User',
      deleteUser: 'Delete User',
      save: 'Save',
      cancel: 'Cancel',
      confirmDelete: 'Confirm Delete',
      hebrew: 'Hebrew',
      english: 'English',
      createdAt: 'Created at',
      cannotEditEmail: 'Cannot edit email or role',
      note: 'Note: You can only edit personal details. To change email or role, create a new user.',
      deleteWarning: 'Are you sure you want to delete this user?',
      deleteWarningDetails: 'This action will permanently delete the user and cannot be undone.',
      cannotDeleteManager: 'You do not have permission to delete other managers',
      cannotDeleteOthers: 'You do not have permission to delete other users'
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

  const canDeleteUser = (userToDelete: any) => {
    if (!currentUser) return false;
    
    // Everyone can delete themselves
    if (currentUser.id === userToDelete.id) {
      return true;
    }
    
    // Clients cannot delete anyone else
    if (currentUser.role === 'client') {
      return false;
    }
    
    // Managers can delete clients but not other managers
    if (currentUser.role === 'manager' || currentUser.role === 'administrator') {
      if (userToDelete.role === 'manager' || userToDelete.role === 'administrator') {
        return false;
      }
      return true;
    }
    
    return false;
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setFormData({
      name: user.name || '',
      phone: user.phone || '',
      company: user.company || '',
      language: user.language || 'he'
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (user: any) => {
    if (!canDeleteUser(user)) {
      const isManager = user.role === 'manager' || user.role === 'administrator';
      toast({
        title: t.error,
        description: isManager ? t.cannotDeleteManager : t.cannotDeleteOthers,
        variant: 'destructive'
      });
      return;
    }
    
    setDeletingUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingUser) return;

    try {
      console.log('Deleting user:', deletingUser.id);
      await User.delete(deletingUser.id);
      
      toast({ title: t.userDeleted });
      setIsDeleteDialogOpen(false);
      setDeletingUser(null);
      
      // If user deleted themselves, logout
      if (currentUser && currentUser.id === deletingUser.id) {
        console.log('User deleted themselves, logging out...');
        await User.logout();
        window.location.href = '/';
      } else {
        loadData();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: t.error,
        description: 'Failed to delete user',
        variant: 'destructive'
      });
    }
  };

  const handleSave = async () => {
    if (!editingUser) return;

    try {
      await User.update(editingUser.id, formData);
      
      toast({ title: t.userUpdated });
      setIsEditDialogOpen(false);
      setEditingUser(null);
      loadData();
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: t.error,
        description: 'Failed to update user. Please try editing through the user profile page.',
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
                <div className="pt-3 border-t border-gray-100">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(user)}
                      className="flex-1"
                    >
                      <Edit className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                      {t.edit}
                    </Button>
                    {canDeleteUser(user) && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteClick(user)}
                        className="flex-1"
                      >
                        <Trash2 className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                        {t.delete}
                      </Button>
                    )}
                  </div>
                </div>

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
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              {t.deleteUser}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <Alert className="bg-red-50 border-red-200">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-sm text-red-900">
                <p className="font-bold mb-2">{t.deleteWarning}</p>
                <p>{t.deleteWarningDetails}</p>
              </AlertDescription>
            </Alert>

            {deletingUser && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-gray-500" />
                    <span className="font-bold">{deletingUser.name || deletingUser.full_name || deletingUser.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">{deletingUser.email}</span>
                  </div>
                  <Badge className={`${getRoleBadgeColor(deletingUser.role)} text-xs w-fit`}>
                    {getRoleLabel(deletingUser.role)}
                  </Badge>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button 
                variant="destructive" 
                onClick={handleDeleteConfirm} 
                className="flex-1"
              >
                <Trash2 className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                {t.confirmDelete}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setDeletingUser(null);
                }} 
                className="flex-1"
              >
                {t.cancel}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};