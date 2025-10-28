import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Index: React.FC = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        // Redirect to appropriate dashboard based on user role
        navigate(user.role === 'client' ? '/client' : '/manager', { replace: true });
      } else {
        // Redirect to login if not authenticated
        navigate('/login', { replace: true });
      }
    }
  }, [user, isLoading, navigate]);

  // Show loading while determining where to redirect
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-20 h-20 bg-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-black font-bold text-2xl">PN</span>
        </div>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading Piter Noufi...</p>
      </div>
    </div>
  );
};

export default Index;