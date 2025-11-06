import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const ClientDashboard = ({ user, setUser }) => {
  const { t } = useLanguage();

  if (!user) {
    return null;
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #fef3c7 0%, #ffffff 50%, #fef3c7 100%)',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        padding: '2rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', marginBottom: '1rem' }}>
          {t('dashboard')} - {t('client')}
        </h1>
        
        <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
          ברוכים הבאים {user.full_name || user.name}
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem'
        }}>
          <div style={{
            backgroundColor: '#f8fafc',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            border: '1px solid #e2e8f0'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>
              {t('my_orders')}
            </h3>
            <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
              צפה בהזמנות שלך וצור הזמנות חדשות
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
              {t('view')} {t('orders')}
            </button>
          </div>

          <div style={{
            backgroundColor: '#f8fafc',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            border: '1px solid #e2e8f0'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>
              {t('create_new_order')}
            </h3>
            <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
              צור הזמנה חדשה למוצרי מחצבה
            </p>
            <button style={{
              backgroundColor: '#10b981',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '500'
            }}>
              {t('create_order')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;