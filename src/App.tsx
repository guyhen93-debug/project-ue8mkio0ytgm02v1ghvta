import React from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Simple error fallback
const ErrorFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">
        Something went wrong
      </h1>
      <p className="text-gray-600 mb-6">
        There was an error loading the application. Please try refreshing the page.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
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

// Simple Index component without context dependencies
const SimpleIndex = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 via-white to-yellow-50">
    <div className="text-center p-8">
      <div className="w-20 h-20 bg-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <span className="text-black font-bold text-2xl">PN</span>
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        Piternoufi Orders
      </h1>
      <p className="text-gray-600 mb-6">
        Quarry Management System
      </p>
      <div className="space-y-4">
        <button 
          onClick={() => window.location.href = '/login'}
          className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium px-6 py-2 rounded-lg transition-colors"
        >
          Login
        </button>
      </div>
    </div>
  </div>
);

// Simple Login component without context dependencies
const SimpleLogin = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 via-white to-yellow-50">
    <div className="text-center p-8">
      <div className="w-20 h-20 bg-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <span className="text-black font-bold text-2xl">PN</span>
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        Login
      </h1>
      <p className="text-gray-600 mb-6">
        Please login to continue
      </p>
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto">
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              placeholder="Enter your password"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-medium py-2 px-4 rounded-md transition-colors"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  </div>
);

// Minimal App component without any Radix UI components
const App = () => {
  console.log('App rendering, React available:', !!React);
  console.log('React.useEffect available:', !!React.useEffect);
  
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SimpleIndex />} />
          <Route path="/login" element={<SimpleLogin />} />
          <Route path="*" element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">Page Not Found</h1>
                <p className="text-gray-600">The page you're looking for doesn't exist.</p>
              </div>
            </div>
          } />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;