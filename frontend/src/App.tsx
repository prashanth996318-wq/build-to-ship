import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext, useAuth } from './hooks/useAuth';
import { AppLayout } from './layouts/AppLayout';
import { AuthGuard } from './components/AuthGuard';

// Pages
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { NewAdvisory } from './pages/NewAdvisory';
import { AdvisoryDetail } from './pages/AdvisoryDetail';
import { AdvisoryHistory } from './pages/AdvisoryHistory';
import { NotFound } from './pages/NotFound';

/**
 * Root component — provides auth context and defines all routes.
 */
const App: React.FC = () => {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      <BrowserRouter>
        <Routes>
          {/* Public layout */}
          <Route element={<AppLayout />}>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <AuthGuard>
                  <Dashboard />
                </AuthGuard>
              }
            />
            <Route
              path="/advisory/new"
              element={
                <AuthGuard>
                  <NewAdvisory />
                </AuthGuard>
              }
            />
            <Route
              path="/advisory/:id"
              element={
                <AuthGuard>
                  <AdvisoryDetail />
                </AuthGuard>
              }
            />
            <Route
              path="/advisories"
              element={
                <AuthGuard>
                  <AdvisoryHistory />
                </AuthGuard>
              }
            />

            {/* Legacy / alias redirects */}
            <Route path="/home" element={<Navigate to="/" replace />} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
};

export default App;
