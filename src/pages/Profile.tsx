import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Building, Phone, Mail, LogOut, Shield, Globe } from 'lucide-react';

const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'he' : 'en');
  };

  if (!user) return null;

  return (
    <Layout title={t('profile')}>
      <div className="px-4 py-6">
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="p-6 text-center">
            <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="h-10 w-10 text-black" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              {user.name}
            </h2>
            <p className="text-gray-600 mb-3">{user.company}</p>
            <Badge className={
              user.role === 'manager' 
                ? 'bg-purple-100 text-purple-800' 
                : 'bg-blue-100 text-blue-800'
            }>
              {user.role === 'manager' ? 'Manager' : 'Client'}
            </Badge>
          </CardContent>
        </Card>

        {/* Profile Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Mail className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Email</p>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Phone className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">{t('phone')}</p>
                <p className="text-sm text-gray-600">{user.phone}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Building className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">{t('company')}</p>
                <p className="text-sm text-gray-600">{user.company}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Shield className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Role</p>
                <p className="text-sm text-gray-600 capitalize">{user.role}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Language</p>
                  <p className="text-sm text-gray-600">
                    {language === 'en' ? 'English' : 'עברית'}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleLanguage}
              >
                Switch to {language === 'en' ? 'עברית' : 'English'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Company Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>About Piter Noufi Ltd.</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Leading quarry company providing high-quality construction materials 
              for projects across the region. Specializing in sand, gravel, and 
              stone products with reliable delivery services.
            </p>
            <div className="text-xs text-gray-500">
              <p>Website: piternoufi.com</p>
              <p>Industry: Construction Materials</p>
            </div>
          </CardContent>
        </Card>

        {/* Logout Button */}
        <Button
          onClick={handleLogout}
          variant="destructive"
          className="w-full"
          size="lg"
        >
          <LogOut className="mr-2 h-5 w-5" />
          {t('logout')}
        </Button>
      </div>
    </Layout>
  );
};

export default Profile;