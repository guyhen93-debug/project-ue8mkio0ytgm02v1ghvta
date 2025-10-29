import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, login, isLoading } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  // Immediate redirect if already logged in
  useEffect(() => {
    if (user && !isLoading) {
      const redirectPath = user.role === 'client' ? '/client' : '/manager';
      navigate(redirectPath, { replace: true });
    }
  }, [user, isLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setIsSubmitting(true);

    try {
      const success = await login(email, password);
      if (success) {
        toast({
          title: t('welcome_back'),
          description: t('login_success'),
        });
        
        // Immediate redirect after successful login
        const redirectPath = user?.role === 'client' ? '/client' : '/manager';
        navigate(redirectPath, { replace: true });
      } else {
        toast({
          title: t('login_failed'),
          description: t('invalid_credentials'),
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: t('error'),
        description: t('login_error'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Demo credentials info
  const demoCredentials = [
    { email: 'john@construction.com', password: 'client123', role: t('client') },
    { email: 'ahmed@buildco.com', password: 'client123', role: t('client') },
    { email: 'david@piternoufi.com', password: 'manager123', role: t('manager') }
  ];

  if (isLoading) {
    return (
      <Layout showBottomNav={false}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 bg-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <img 
                src="/favicon.ico" 
                alt="Piter Noufi" 
                className="w-12 h-12"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling.style.display = 'block';
                }}
              />
              <span className="text-black font-bold text-2xl hidden">PN</span>
            </div>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto mb-4"></div>
            <p className="text-gray-600">{t('loading')}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showBottomNav={false}>
      <div className="px-4 py-8 min-h-screen bg-gray-50">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <img 
              src="/favicon.ico" 
              alt="Piter Noufi" 
              className="w-12 h-12"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling.style.display = 'block';
              }}
            />
            <span className="text-black font-bold text-2xl hidden">PN</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('welcome_back')}
          </h1>
          <p className="text-gray-600 text-lg">
            {t('login_to_continue')}
          </p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">{t('login')}</CardTitle>
            <CardDescription className="text-base">
              {t('enter_credentials')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-base font-semibold">
                  {t('email_or_phone')}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('enter_email')}
                  className="h-12 text-base"
                  required
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-base font-semibold">
                  {t('password')}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('enter_password')}
                  className="h-12 text-base"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-lg shadow-lg"
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                {t('login')}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full text-gray-600 text-base"
                disabled={isSubmitting}
              >
                {t('forgot_password')}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Demo Credentials */}
        <Card className="mt-6 shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-lg">{t('demo_credentials')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {demoCredentials.map((cred, index) => (
              <div key={index} className="text-sm bg-gray-50 p-3 rounded-lg">
                <div className="font-semibold text-gray-900">{cred.role}: {cred.email}</div>
                <div className="text-gray-600">{t('password')}: {cred.password}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Login;