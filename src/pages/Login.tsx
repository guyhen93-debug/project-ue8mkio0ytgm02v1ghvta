import React, { useState } from 'react';
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
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        // Navigation will be handled by the auth context and protected routes
        toast({
          title: t('welcome_back'),
          description: t('login_to_continue'),
        });
      } else {
        toast({
          title: 'Login Failed',
          description: 'Invalid email or password. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred during login. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Demo credentials info
  const demoCredentials = [
    { email: 'john@construction.com', password: 'client123', role: 'Client' },
    { email: 'ahmed@buildco.com', password: 'client123', role: 'Client' },
    { email: 'david@piternoufi.com', password: 'manager123', role: 'Manager' }
  ];

  return (
    <Layout showBottomNav={false}>
      <div className="px-4 py-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-black font-bold text-2xl">PN</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {t('welcome_back')}
          </h1>
          <p className="text-gray-600">
            {t('login_to_continue')}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('login')}</CardTitle>
            <CardDescription>
              Enter your credentials to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('email_or_phone')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">{t('password')}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-black"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('login')}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full text-gray-600"
              >
                {t('forgot_password')}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Demo Credentials */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm">Demo Credentials</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {demoCredentials.map((cred, index) => (
              <div key={index} className="text-xs bg-gray-50 p-2 rounded">
                <div className="font-medium">{cred.role}: {cred.email}</div>
                <div className="text-gray-600">Password: {cred.password}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Login;