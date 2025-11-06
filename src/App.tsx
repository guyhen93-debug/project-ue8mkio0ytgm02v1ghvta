import React from 'react';

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
        Something went wrong
      </h1>
      <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
        There was an error loading the application. Please try refreshing the page.
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
        Refresh Page
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

// Absolutely minimal App component without any React hooks
const App = () => {
  console.log('App rendering, React available:', !!React);
  console.log('React type:', typeof React);
  console.log('React keys:', React ? Object.keys(React) : 'React is null');
  
  // Simple static page without any state management
  return (
    <ErrorBoundary>
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #fef3c7 0%, #ffffff 50%, #fef3c7 100%)'
      }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{
            width: '5rem',
            height: '5rem',
            backgroundColor: '#eab308',
            borderRadius: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem auto'
          }}>
            <span style={{ color: 'black', fontWeight: 'bold', fontSize: '1.5rem' }}>PN</span>
          </div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827', marginBottom: '1rem' }}>
            Piternoufi Orders
          </h1>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
            Quarry Management System
          </p>
          <button 
            onClick={() => {
              console.log('Login button clicked');
              alert('Login functionality will be added soon');
            }}
            style={{
              backgroundColor: '#eab308',
              color: 'black',
              fontWeight: '500',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Login
          </button>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default App;