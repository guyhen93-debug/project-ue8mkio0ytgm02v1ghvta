import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { superdevClient } from '@/lib/superdev/client';
import { User, Mail, Phone, Building, Globe, LogOut, Save } from 'lucide-react';

const translations = {
  he: {
    profile: 'פרופיל',
    profileSubtitle: 'ניהול פרטים אישיים והגדרות',
    personalDetails: 'פרטים אישיים',
    fullName: 'שם מלא',
    fullNamePlaceholder: 'הזן שם מלא',
    email: 'אימייל',
    emailNote: 'לא ניתן לשנות את כתובת האימייל',
    phone: 'טלפון',
    phonePlaceholder: 'הזן מספר טלפון',
    company: 'חברה',
    companyPlaceholder: 'הזן שם חברה',
    language: 'שפה',
    role: 'תפקיד',
    manager: 'מנהל',
    administrator: 'מנהל מערכת',
    client: 'לקוח',
    fieldMode: 'מצב שטח',
    fieldModeDescription: 'פונטים גדולים לשימוש בשטח',
    fieldModeLabel: 'מצב שטח (פונטים גדולים לשימוש בשטח)',
    remindersTitle: 'תזכורות',
    remindersDescription: 'קבל תזכורות אוטומטיות על הזמנות שדורשות טיפול',
    remindersEnabledLabel: 'מופעל',
    remindersIntervalLabel: 'מרווח תזכורת',
    reminders24: 'כל 24 שעות',
    reminders48: 'כל 48 שעות',
    roleManager: 'מנהל',
    roleAdmin: 'מנהל מערכת',
    roleClient: 'לקוח',
    saveChanges: 'שמור שינויים',
    saving: 'שומר...',
    logoutTitle: 'התנתקות',
    logoutDescription: 'התנתק מהמערכת כדי להתחבר עם משתמש אחר בפעם הבאה',
    logoutButton: 'התנתק',
    loading: 'טוען...',
    loginRequired: 'אנא התחבר למערכת',
    // Toast titles & messages
    error: 'שגיאה',
    success: 'הצלחה',
    loadUserError: 'נכשל בטעינת פרטי המשתמש',
    saveProfileSuccess: 'הפרטים עודכנו בהצלחה',
    saveProfileError: 'נכשל בשמירת הפרטים',
    logoutSuccessTitle: 'התנתקת בהצלחה',
    logoutSuccessDescription: 'להתראות!',
    logoutError: 'נכשל בהתנתקות',
    // Extra requested keys
    shareUpdates: 'שתף שיוויים',
    disconnect: 'התנתק',
  },
  en: {
    profile: 'Profile',
    profileSubtitle: 'Manage your personal details and settings',
    personalDetails: 'Personal Details',
    fullName: 'Full Name',
    fullNamePlaceholder: 'Enter full name',
    email: 'Email',
    emailNote: 'Email address cannot be changed',
    phone: 'Phone',
    phonePlaceholder: 'Enter phone number',
    company: 'Company',
    companyPlaceholder: 'Enter company name',
    language: 'Language',
    role: 'Role',
    manager: 'Manager',
    administrator: 'Administrator',
    client: 'Client',
    fieldMode: 'Field Mode',
    fieldModeDescription: 'Large fonts for field use',
    fieldModeLabel: 'Field Mode (Large fonts for field use)',
    remindersTitle: 'Reminders',
    remindersDescription: 'Receive automatic reminders about orders that need attention',
    remindersEnabledLabel: 'Enabled',
    remindersIntervalLabel: 'Reminder interval',
    reminders24: 'Every 24 hours',
    reminders48: 'Every 48 hours',
    roleManager: 'Manager',
    roleAdmin: 'Administrator',
    roleClient: 'Client',
    saveChanges: 'Save Changes',
    saving: 'Saving...',
    logoutTitle: 'Disconnect',
    logoutDescription: 'Disconnect from the system to connect with another user next time',
    logoutButton: 'Disconnect',
    loading: 'Loading...',
    loginRequired: 'Please log in to the system',
    // Toast titles & messages
    error: 'Error',
    success: 'Success',
    loadUserError: 'Failed to load user details',
    saveProfileSuccess: 'Profile updated successfully',
    saveProfileError: 'Failed to save profile details',
    logoutSuccessTitle: 'Disconnected successfully',
    logoutSuccessDescription: 'See you next time!',
    logoutError: 'Failed to disconnect',
    // Extra requested keys
    shareUpdates: 'Share Updates',
    disconnect: 'Disconnect',
  },
} as const;

const Profile = () => {
  const navigate = useNavigate();
  const { language, isRTL } = useLanguage();
  const t = translations[(language === 'en' ? 'en' : 'he')];
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fieldMode, setFieldMode] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    company: '',
    language: 'he',
    reminders_enabled: true,
    reminders_delay_hours: 24
  });

  useEffect(() => {
    loadUser();
    
    // Load field mode preference
    try {
      const saved = localStorage.getItem('fieldMode');
      const enabled = saved === 'on';
      setFieldMode(enabled);
      if (enabled) {
        document.body.classList.add('field-mode');
      }
    } catch (err) {
      console.error('Error loading field mode preference', err);
    }
  }, []);

  useEffect(() => {
    try {
      if (fieldMode) {
        document.body.classList.add('field-mode');
        localStorage.setItem('fieldMode', 'on');
      } else {
        document.body.classList.remove('field-mode');
        localStorage.setItem('fieldMode', 'off');
      }
    } catch (err) {
      console.error('Error saving field mode preference', err);
    }
  }, [fieldMode]);

  const loadUser = async () => {
    try {
      setLoading(true);
      const currentUser = await superdevClient.auth.me();
      console.log('Loaded user:', currentUser);
      setUser(currentUser);
      
      setFormData({
        full_name: currentUser.full_name || currentUser.name || '',
        phone: currentUser.phone || '',
        company: currentUser.company || '',
        language: currentUser.language || 'he',
        reminders_enabled: currentUser.reminders_enabled ?? true,
        reminders_delay_hours: currentUser.reminders_delay_hours ?? 24
      });
    } catch (error) {
      console.error('Error loading user:', error);
      toast({
        title: t.error,
        description: t.loadUserError,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await superdevClient.auth.updateProfile(formData);
      
      toast({
        title: t.success,
        description: t.saveProfileSuccess,
      });
      
      await loadUser();
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: t.error,
        description: t.saveProfileError,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      console.log('Logging out...');
      await superdevClient.auth.logout();
      console.log('Logout successful');
      
      toast({
        title: t.logoutSuccessTitle,
        description: t.logoutSuccessDescription,
      });
      
      // Reload the page to trigger login
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: t.error,
        description: t.logoutError,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <Layout title={t.profile}>
        <div className="flex items-center justify-center min-h-[400px]" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto mb-4"></div>
            <p className="text-gray-600">{t.loading}</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout title={t.profile}>
        <div className="p-4" dir={isRTL ? 'rtl' : 'ltr'}>
          <p className="text-center text-gray-600">{t.loginRequired}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={t.profile}>
      <div className="p-4 space-y-6 pb-24" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t.profile}</h1>
          <p className="text-gray-600">{t.profileSubtitle}</p>
        </div>

        {/* User Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {t.personalDetails}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="full_name" className="rtl:text-right block">
                {t.fullName}
              </Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder={t.fullNamePlaceholder}
                className="rtl:text-right"
              />
            </div>

            {/* Email (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email" className="rtl:text-right block">
                {t.email}
              </Label>
              <div className="relative">
                <Mail className="absolute rtl:right-3 ltr:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="email"
                  value={user.email}
                  disabled
                  className="rtl:text-right rtl:pr-10 ltr:pl-10 bg-gray-50"
                />
              </div>
              <p className="text-xs text-gray-500 rtl:text-right">{t.emailNote}</p>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="rtl:text-right block">
                {t.phone}
              </Label>
              <div className="relative">
                <Phone className="absolute rtl:right-3 ltr:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder={t.phonePlaceholder}
                  className="rtl:text-right rtl:pr-10 ltr:pl-10"
                />
              </div>
            </div>

            {/* Company */}
            <div className="space-y-2">
              <Label htmlFor="company" className="rtl:text-right block">
                {t.company}
              </Label>
              <div className="relative">
                <Building className="absolute rtl:right-3 ltr:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder={t.companyPlaceholder}
                  className="rtl:text-right rtl:pr-10 ltr:pl-10"
                />
              </div>
            </div>

            {/* Language */}
            <div className="space-y-2">
              <Label htmlFor="language" className="rtl:text-right block">
                {t.language}
              </Label>
              <Select
                value={formData.language}
                onValueChange={(value) => setFormData({ ...formData, language: value })}
              >
                <SelectTrigger className="rtl:text-right">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="he">עברית</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Field Mode Checkbox */}
            <div className="py-4 border-b border-gray-200">
              <label className="flex items-center gap-2 rtl:text-right">
                <input
                  id="fieldMode"
                  type="checkbox"
                  checked={fieldMode}
                  onChange={(e) => setFieldMode(e.target.checked)}
                  className="w-5 h-5 cursor-pointer"
                />
                <span className="text-sm text-gray-800">
                  {t.fieldModeLabel}
                </span>
              </label>
            </div>

            {/* Reminders Settings */}
            <div className="space-y-3 pt-4 border-b border-gray-200 pb-4">
              <div className="flex items-center justify-between gap-3">
                <div className="rtl:text-right flex-1">
                  <p className="font-medium text-gray-900">{t.remindersTitle}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {t.remindersDescription}
                  </p>
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="w-5 h-5 cursor-pointer"
                    checked={formData.reminders_enabled}
                    onChange={(e) => setFormData({
                      ...formData,
                      reminders_enabled: e.target.checked,
                    })}
                  />
                  <span className="text-sm text-gray-800">{t.remindersEnabledLabel}</span>
                </label>
              </div>

              {formData.reminders_enabled && (
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="reminders_delay_hours" className="rtl:text-right flex-1">
                    {t.remindersIntervalLabel}
                  </Label>
                  <Select
                    value={String(formData.reminders_delay_hours)}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        reminders_delay_hours: Number(value),
                      })
                    }
                  >
                    <SelectTrigger className="w-32 rtl:text-right">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24">{t.reminders24}</SelectItem>
                      <SelectItem value="48">{t.reminders48}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Role (Read-only) */}
            <div className="space-y-2">
              <Label className="rtl:text-right block">{t.role}</Label>
              <div className="px-3 py-2 bg-gray-50 rounded-md rtl:text-right">
                <span className="text-gray-700">
                  {user.role === 'manager' 
                    ? t.roleManager 
                    : user.role === 'administrator' 
                      ? t.roleAdmin 
                      : t.roleClient}
                </span>
              </div>
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black rtl:ml-2 ltr:mr-2"></div>
                  {t.saving}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 rtl:ml-2 ltr:mr-2" />
                  {t.saveChanges}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Logout Card */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <LogOut className="h-5 w-5" />
              {t.logoutTitle}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4 rtl:text-right">
              {t.logoutDescription}
            </p>
            <Button
              onClick={handleLogout}
              variant="destructive"
              className="w-full"
            >
              <LogOut className="h-4 w-4 rtl:ml-2 ltr:mr-2" />
              {t.logoutButton}
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Profile;
