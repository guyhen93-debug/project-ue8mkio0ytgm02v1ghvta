import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ManagerDashboard from './pages/ManagerDashboard';
import ClientDashboard from './pages/ClientDashboard';
import AdminPanel from './pages/AdminPanel';
import Inbox from './pages/Inbox';
import CreateOrder from './pages/CreateOrder';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';

const queryClient = new QueryClient();

// Simple error fallback
const ErrorFallback = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb'
  }}>
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '1rem' }}>
        שגיאה במערכת
      </h1>
      <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
        אירעה שגיאה בטעינת האפליקציה. אנא רענן את הדף.
      </p>
      <button
        onClick={() => window.location.reload()}
        style={{
          backgroundColor: '#2563eb',
          color: 'white',
          padding: '0.5rem 1.5rem',
          borderRadius: '0.5rem',
          border: 'none',
          cursor: 'pointer'
        }}
      >
        רענן דף
      </button>
    </div>
  </div>
);

// Error boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    console.error('ErrorBoundary caught error:', error);
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary componentDidCatch:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}

// Home redirect component that checks user role
const HomeRedirect = () => {
  const { user, loading, isManager } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '2rem',
            height: '2rem',
            border: '2px solid #eab308',
            borderTop: '2px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p>טוען...</p>
        </div>
      </div>
    );
  }

  // Redirect based on user role
  if (user) {
    return <Navigate to={isManager ? '/manager-dashboard' : '/client-dashboard'} replace />;
  }

  // Default to manager dashboard if no user
  return <Navigate to="/manager-dashboard" replace />;
};

const App = () => {
  console.log('App rendering, React available:', !!React);
  
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <Router>
              <div className="page-transition">
                <Routes>
                  <Route path="/manager-dashboard" element={<ManagerDashboard />} />
                  <Route path="/client-dashboard" element={<ClientDashboard />} />
                  <Route path="/admin" element={<AdminPanel />} />
                  <Route path="/create-order" element={<CreateOrder />} />
                  <Route path="/inbox" element={<Inbox />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/" element={<HomeRedirect />} />
                  <Route path="*" element={<HomeRedirect />} />
                </Routes>
              </div>
            </Router>
          </QueryClientProvider>
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
};

export default App;