import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../hooks/useAuth';
import { Spinner } from './ui/Spinner';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * Wraps protected routes.
 * Redirects unauthenticated users to /login with the original destination preserved.
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { user, loading } = useAuthContext();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" aria-live="polite" aria-busy="true">
        <div className="text-center">
          <Spinner size="lg" className="text-green-600 mx-auto" />
          <p className="mt-3 text-sm text-gray-500">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
