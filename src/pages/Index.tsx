import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@/entities';

const Index = ({ user, setUser }) => {
  const navigate = useNavigate();

  // If user is not authenticated, redirect to login
  React.useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleLogout = async () => {
    try {
      await User.logout();
      setUser(null);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #fef3c7 0%, #ffffff 50%, #fef3c7 100%)'
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'white',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        padding: '1rem 2rem'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '2.5rem',
              height: '2.5rem',
              backgroundColor: '#eab308',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ color: 'black', fontWeight: 'bold', fontSize: '1rem' }}>PN</span>
            </div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>
              פיטרנופי - ניהול הזמנות
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ color: '#6b7280' }}>שלום, {user.full_name}</span>
            <button
              onClick={handleLogout}
              style={{
                backgroundColor: '#ef4444',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              התנתק
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          padding: '2rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '4rem',
            height: '4rem',
            backgroundColor: '#eab308',
            borderRadius: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem auto'
          }}>
            <span style={{ color: 'black', fontWeight: 'bold', fontSize: '1.5rem' }}>PN</span>
          </div>
          
          <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827', marginBottom: '1rem' }}>
            ברוכים הבאים למערכת פיטרנופי
          </h2>
          
          <p style={{ color: '#6b7280', marginBottom: '2rem', fontSize: '1.125rem' }}>
            מערכת ניהול הזמנות למחצבה
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
            marginTop: '2rem'
          }}>
            {/* Orders Card */}
            <div style={{
              backgroundColor: '#f8fafc',
              padding: '1.5rem',
              borderRadius: '0.5rem',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>
                הזמנות
              </h3>
              <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
                צפה וניהל הזמנות קיימות
              </p>
              <button style={{
                backgroundColor: '#eab308',
                color: 'black',
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '500'
              }}>
                צפה בהזמנות
              </button>
            </div>

            {/* Clients Card */}
            <div style={{
              backgroundColor: '#f8fafc',
              padding: '1.5rem',
              borderRadius: '0.5rem',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>
                לקוחות
              </h3>
              <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
                ניהול פרטי לקוחות
              </p>
              <button style={{
                backgroundColor: '#eab308',
                color: 'black',
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '500'
              }}>
                ניהול לקוחות
              </button>
            </div>

            {/* Sites Card */}
            <div style={{
              backgroundColor: '#f8fafc',
              padding: '1.5rem',
              borderRadius: '0.5rem',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>
                אתרים
              </h3>
              <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
                ניהול אתרי עבודה
              </p>
              <button style={{
                backgroundColor: '#eab308',
                color: 'black',
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '500'
              }}>
                ניהול אתרים
              </button>
            </div>
          </div>

          {user.role === 'administrator' && (
            <div style={{
              marginTop: '2rem',
              padding: '1.5rem',
              backgroundColor: '#fef3c7',
              borderRadius: '0.5rem',
              border: '1px solid #fbbf24'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#92400e', marginBottom: '0.5rem' }}>
                פאנל מנהל
              </h3>
              <p style={{ color: '#92400e', marginBottom: '1rem' }}>
                גישה לכלי ניהול מתקדמים
              </p>
              <button style={{
                backgroundColor: '#f59e0b',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '500'
              }}>
                פאנל מנהל
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;