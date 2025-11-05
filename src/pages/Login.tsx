import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { Eye, EyeOff, Mail, Lock, User, Settings } from 'lucide-react';

const Login: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast({
        title: t('validation_error'),
        description: t('enter_credentials'),
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);
      const user = await login(formData.email, formData.password);
      
      if (user) {
        toast({
          title: t('welcome_back'),
          description: t('login_to_continue')
        });
        
        // Redirect based on user role
        const redirectPath = user.role === 'manager' ? '/manager' : '/client';
        navigate(redirectPath, { replace: true });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: t('login_failed'),
        description: t('invalid_credentials'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = (role: 'client' | 'manager') => {
    if (role === 'client') {
      setFormData({
        email: 'client@demo.com',
        password: 'demo123'
      });
    } else {
      setFormData({
        email: 'manager@demo.com',
        password: 'demo123'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-yellow-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Language Toggle */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLanguage(language === 'en' ? 'he' : 'en')}
            className="mb-4"
          >
            {t('switch_to')} {language === 'en' ? 'עברית' : 'English'}
          </Button>
        </div>

        {/* Logo */}
        <div className="text-center">
          <div className="w-20 h-20 bg-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-black font-bold text-2xl">PN</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{t('welcome_back')}</h1>
          <p className="text-gray-600 mt-2">{t('login_to_continue')}</p>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">{t('login')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {t('email_or_phone')}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder={t('enter_email')}
                  required
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  {t('password')}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder={t('enter_password')}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-medium"
                disabled={loading}
              >
                {loading ? t('loading') : t('login')}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Demo Credentials */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-sm">{t('demo_credentials')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Alert>
              <User className="h-4 w-4" />
              <AlertDescription className="space-y-2">
                <div className="font-medium">{t('client')}:</div>
                <div className="text-sm text-gray-600">
                  client@demo.com / demo123
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fillDemoCredentials('client')}
                  className="w-full mt-2"
                >
                  {t('client')}
                </Button>
              </AlertDescription>
            </Alert>

            <Alert>
              <Settings className="h-4 w-4" />
              <AlertDescription className="space-y-2">
                <div className="font-medium">{t('manager')}:</div>
                <div className="text-sm text-gray-600">
                  manager@demo.com / demo123
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fillDemoCredentials('manager')}
                  className="w-full mt-2"
                >
                  {t('manager')}
                </Button>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;