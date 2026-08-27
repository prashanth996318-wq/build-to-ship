import React, { useState } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuthContext } from '../hooks/useAuth';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';

export const Login: React.FC = () => {
  const { user, login } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to={from} replace />;

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!email.trim()) newErrors.email = 'Email address is required.';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Please enter a valid email address.';
    if (!password) newErrors.password = 'Password is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setServerError(null);

    const { error } = await login(email.trim(), password);

    setLoading(false);

    if (error) {
      setServerError(
        error.includes('Invalid login credentials')
          ? 'Invalid email or password. Please try again.'
          : error
      );
    } else {
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="card-md p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
            <p className="text-sm text-gray-500 mt-1">Sign in to your CropSage account</p>
          </div>

          {serverError && (
            <Alert
              variant="error"
              message={serverError}
              onDismiss={() => setServerError(null)}
              className="mb-6"
            />
          )}

          <form onSubmit={handleSubmit} noValidate aria-label="Login form">
            <div className="space-y-5">
              <Input
                id="login-email"
                label="Email address"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
                }}
                error={errors.email}
                required
                autoComplete="email"
                autoFocus
              />

              <Input
                id="login-password"
                label="Password"
                type="password"
                placeholder="Your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
                }}
                error={errors.password}
                required
                autoComplete="current-password"
              />

              <Button
                type="submit"
                className="w-full"
                loading={loading}
                loadingText="Signing in…"
              >
                Sign In
              </Button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-green-600 hover:text-green-700 focus-ring rounded">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
