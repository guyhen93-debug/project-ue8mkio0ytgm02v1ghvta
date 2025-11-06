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

// Ultra-minimal App component without any external libraries
const App = () => {
  console.log('App rendering, React available:', !!React);
  console.log('React.useEffect available:', !!React.useEffect);
  console.log('React.useState available:', !!React.useState);
  
  const [currentPage, setCurrentPage] = React.useState('home');
  
  const renderPage = () => {
    switch (currentPage) {
      case 'login':
        return (
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
                Login
              </h1>
              <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                Please login to continue
              </p>
              <div style={{
                backgroundColor: 'white',
                padding: '1.5rem',
                borderRadius: '0.5rem',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                maxWidth: '24rem',
                margin: '0 auto'
              }}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '1rem'
                    }}
                    placeholder="Enter your email"
                  />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
                    Password
                  </label>
                  <input
                    type="password"
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '1rem'
                    }}
                    placeholder="Enter your password"
                  />
                </div>
                <button
                  style={{
                    width: '100%',
                    backgroundColor: '#eab308',
                    color: 'black',
                    fontWeight: '500',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.375rem',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Login
                </button>
              </div>
              <button
                onClick={() => setCurrentPage('home')}
                style={{
                  marginTop: '1rem',
                  color: '#6b7280',
                  textDecoration: 'underline',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Back to Home
              </button>
            </div>
          </div>
        );
      default:
        return (
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
                onClick={() => setCurrentPage('login')}
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
        );
    }
  };
  
  return (
    <ErrorBoundary>
      {renderPage()}
    </ErrorBoundary>
  );
};

export default App;