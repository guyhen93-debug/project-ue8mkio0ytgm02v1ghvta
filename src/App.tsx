import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageProvider } from './contexts/LanguageContext';
import Index from './pages/Index';
import Login from './pages/Login';
import ManagerDashboard from './pages/ManagerDashboard';
import ClientDashboard from './pages/ClientDashboard';

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

// Auth wrapper component
const AuthWrapper = ({ children }) => {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

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

  return React.cloneElement(children, { user, setUser });
};

const App = () => {
  console.log('App rendering, React available:', !!React);
  console.log('React type:', typeof React);
  console.log('React keys:', React ? Object.keys(React) : 'React is null');
  
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <QueryClientProvider client={queryClient}>
          <Router>
            <Routes>
              <Route 
                path="/login" 
                element={
                  <AuthWrapper>
                    <Login />
                  </AuthWrapper>
                } 
              />
              <Route 
                path="/" 
                element={
                  <AuthWrapper>
                    <Index />
                  </AuthWrapper>
                } 
              />
              <Route 
                path="/manager-dashboard" 
                element={
                  <AuthWrapper>
                    <ManagerDashboard />
                  </AuthWrapper>
                } 
              />
              <Route 
                path="/client-dashboard" 
                element={
                  <AuthWrapper>
                    <ClientDashboard />
                  </AuthWrapper>
                } 
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </QueryClientProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
};

export default App;