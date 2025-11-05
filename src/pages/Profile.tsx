import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { User, Mail, Phone, Building, Globe, LogOut, Settings } from 'lucide-react';

const Profile: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const { user, logout } = useAuth();
  const [profileData, setProfileData] = useState({
    name: user?.full_name || '',
    email: user?.email || '',
    phone: '',
    company: 'Piter Noufi Ltd.'
  });

  const handleSave = async () => {
    try {
      // Mock save implementation
      toast({
        title: t('profile_updated'),
        description: t('profile_updated')
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: t('error'),
        description: t('update_failed'),
        variant: 'destructive'
      });
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <Layout title={t('profile')}>
      <div className="p-4 max-w-2xl mx-auto space-y-6">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              {t('profile_information')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('name')}</Label>
              <Input
                id="name"
                value={profileData.name}
                onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {t('email')}
              </Label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                disabled
                className="bg-gray-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                {t('phone')}
              </Label>
              <Input
                id="phone"
                value={profileData.phone}
                onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder={t('phone')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company" className="flex items-center gap-2">
                <Building className="w-4 h-4" />
                {t('company')}
              </Label>
              <Input
                id="company"
                value={profileData.company}
                onChange={(e) => setProfileData(prev => ({ ...prev, company: e.target.value }))}
                disabled
                className="bg-gray-50"
              />
            </div>

            <div className="space-y-2">
              <Label>{t('role')}</Label>
              <Input
                value={t(user?.role || 'user')}
                disabled
                className="bg-gray-50"
              />
            </div>

            <Button 
              onClick={handleSave}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-medium"
            >
              {t('save')}
            </Button>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              {t('settings')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                {t('language')}
              </Label>
              <Select value={language} onValueChange={(value: 'en' | 'he') => setLanguage(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="he">עברית</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle>{t('about_company')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700 leading-relaxed">
              {t('company_description')}
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <Label className="text-sm font-medium text-gray-600">{t('website')}</Label>
                <p className="text-gray-900">www.piternoufi.co.il</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">{t('industry')}</Label>
                <p className="text-gray-900">{t('construction_materials')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logout */}
        <Card>
          <CardContent className="pt-6">
            <Button 
              onClick={handleLogout}
              variant="destructive"
              className="w-full"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {t('logout')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Profile;