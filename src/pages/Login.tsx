import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@/entities';

const Login = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  // If user is already authenticated, redirect to home
  React.useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      await User.login();
      // After successful login, the page will redirect automatically
      // But we can also check for the user again
      const currentUser = await User.me();
      setUser(currentUser);
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
      setError('שגיאה בהתחברות. אנא נסה שוב.');
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return null; // Will redirect to home
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #fef3c7 0%, #ffffff 50%, #fef3c7 100%)'
    }}>
      <div style={{ textAlign: 'center', padding: '2rem', maxWidth: '400px', width: '100%' }}>
        <div style={{
          width: '5rem',
          height: '5rem',
          backgroundColor: '#eab308',
          borderRadius: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem auto'
        }}>
          <span style={{ color: 'black', fontWeight: 'bold', fontSize: '1.5rem' }}>PN</span>
        </div>
        
        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>
          פיטרנופי
        </h1>
        
        <p style={{ color: '#6b7280', marginBottom: '2rem', fontSize: '1.125rem' }}>
          מערכת ניהול הזמנות למחצבה
        </p>

        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '0.5rem',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
            התחברות למערכת
          </h2>
          
          <p style={{ color: '#6b7280', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            לחץ על הכפתור להתחברות עם Google
          </p>

          {error && (
            <div style={{
              backgroundColor: '#fef2f2',
              color: '#dc2626',
              padding: '0.75rem',
              borderRadius: '0.375rem',
              marginBottom: '1rem',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: '100%',
              backgroundColor: loading ? '#9ca3af' : '#eab308',
              color: loading ? 'white' : 'black',
              fontWeight: '500',
              padding: '0.75rem 1rem',
              borderRadius: '0.375rem',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: '1rem',
                  height: '1rem',
                  border: '2px solid transparent',
                  borderTop: '2px solid currentColor',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                מתחבר...
              </>
            ) : (
              'התחבר עם Google'
            )}
          </button>
        </div>

        <p style={{ color: '#6b7280', marginTop: '1.5rem', fontSize: '0.75rem' }}>
          מערכת ניהול הזמנות פיטרנופי - גרסה 1.0
        </p>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Login;