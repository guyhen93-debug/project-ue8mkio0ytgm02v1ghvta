import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { superdevClient } from '@/lib/superdev/client';
import { User, Mail, Phone, Building, Globe, LogOut, Save } from 'lucide-react';

const Profile = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fieldMode, setFieldMode] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    company: '',
    language: 'he'
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
        language: currentUser.language || 'he'
      });
    } catch (error) {
      console.error('Error loading user:', error);
      toast({
        title: 'שגיאה',
        description: 'נכשל בטעינת פרטי המשתמש',
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
        title: 'הצלחה',
        description: 'הפרטים עודכנו בהצלחה',
      });
      
      await loadUser();
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'שגיאה',
        description: 'נכשל בשמירת הפרטים',
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
        title: 'התנתקת בהצלחה',
        description: 'להתראות!',
      });
      
      // Reload the page to trigger login
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: 'שגיאה',
        description: 'נכשל בהתנתקות',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <Layout title="פרופיל">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto mb-4"></div>
            <p className="text-gray-600">טוען...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout title="פרופיל">
        <div className="p-4">
          <p className="text-center text-gray-600">אנא התחבר למערכת</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="פרופיל">
      <div className="p-4 space-y-6 pb-24">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">הפרופיל שלי</h1>
          <p className="text-gray-600">ניהול פרטים אישיים והגדרות</p>
        </div>

        {/* User Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              פרטים אישיים
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-right block">
                שם מלא
              </Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="הזן שם מלא"
                className="text-right"
              />
            </div>

            {/* Email (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-right block">
                אימייל
              </Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="email"
                  value={user.email}
                  disabled
                  className="text-right pr-10 bg-gray-50"
                />
              </div>
              <p className="text-xs text-gray-500 text-right">לא ניתן לשנות את כתובת האימייל</p>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-right block">
                טלפון
              </Label>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="הזן מספר טלפון"
                  className="text-right pr-10"
                />
              </div>
            </div>

            {/* Company */}
            <div className="space-y-2">
              <Label htmlFor="company" className="text-right block">
                חברה
              </Label>
              <div className="relative">
                <Building className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="הזן שם חברה"
                  className="text-right pr-10"
                />
              </div>
            </div>

            {/* Language */}
            <div className="space-y-2">
              <Label htmlFor="language" className="text-right block">
                שפה
              </Label>
              <Select
                value={formData.language}
                onValueChange={(value) => setFormData({ ...formData, language: value })}
              >
                <SelectTrigger className="text-right">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="he">עברית</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Field Mode Toggle */}
            <div className="flex items-center justify-between gap-3 py-4 border-t border-gray-100 mt-4 flex-wrap">
              <div className="flex-1 min-w-[180px] text-right">
                <span className="font-medium block">{t('field_mode')}</span>
                <span className="text-xs text-gray-500 block mt-0.5">{t('field_mode_description')}</span>
              </div>
              <div className="flex items-center justify-end flex-shrink-0 pr-1">
                <Switch
                  checked={fieldMode}
                  onCheckedChange={(value) => setFieldMode(!!value)}
                />
              </div>
            </div>

            {/* Role (Read-only) */}
            <div className="space-y-2">
              <Label className="text-right block">תפקיד</Label>
              <div className="px-3 py-2 bg-gray-50 rounded-md text-right">
                <span className="text-gray-700">
                  {user.role === 'manager' ? 'מנהל' : user.role === 'administrator' ? 'מנהל מערכת' : 'לקוח'}
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
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black ml-2"></div>
                  שומר...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 ml-2" />
                  שמור שינויים
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
              התנתקות
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4 text-right">
              התנתק מהמערכת ונדרש להתחבר מחדש בפעם הבאה
            </p>
            <Button
              onClick={handleLogout}
              variant="destructive"
              className="w-full"
            >
              <LogOut className="h-4 w-4 ml-2" />
              התנתק
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Profile;
