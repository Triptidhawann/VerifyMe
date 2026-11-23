import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import VerifyMeLoader from '../components/auth/VerifyMeLoader';

const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div 
        className="min-h-screen w-full flex flex-col items-center justify-center bg-[#FAFCFA] text-[#202923]"
        style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <VerifyMeLoader size="lg" variant="mint" label="Authenticating session..." />
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#202923', margin: 0 }}>
              Authenticating Session
            </h3>
            <p style={{ fontSize: '0.8125rem', color: '#737D76', margin: '0.25rem 0 0 0' }}>
              Verifying session security credentials...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
