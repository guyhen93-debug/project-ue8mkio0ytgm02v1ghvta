import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Home, ArrowLeft } from 'lucide-react';

const NotFound: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <Layout title="404" showBottomNav={false}>
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="text-6xl font-bold text-yellow-500 mb-4">404</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Page Not Found
            </h1>
            <p className="text-gray-600 mb-6">
              The page you're looking for doesn't exist or has been moved.
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => navigate(-1)}
                variant="outline"
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
              <Button 
                onClick={() => navigate('/')}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-medium"
              >
                <Home className="w-4 h-4 mr-2" />
                {t('home')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default NotFound;