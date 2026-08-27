import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuthContext } from '../hooks/useAuth';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';

export const Register: React.FC = () => {
  const { user, register } = useAuthContext();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!email.trim()) newErrors.email = 'Email address is required.';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Please enter a valid email address.';

    if (!password) newErrors.password = 'Password is required.';
    else if (password.length < 8) newErrors.password = 'Password must be at least 8 characters.';

    if (!confirmPassword) newErrors.confirmPassword = 'Please confirm your password.';
    else if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setServerError(null);
    setSuccessMessage(null);

    const { error } = await register(email.trim(), password);

    setLoading(false);

    if (error) {
      setServerError(error);
    } else {
      // Supabase may require email confirmation depending on project settings.
      // If auto-confirm is on, redirect to dashboard.
      setSuccessMessage(
        'Account created! If email confirmation is enabled, please check your inbox. Otherwise, you will be redirected shortly.'
      );
      setTimeout(() => navigate('/dashboard'), 2000);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="card-md p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
            <p className="text-sm text-gray-500 mt-1">Start getting personalized crop advisories</p>
          </div>

          {serverError && (
            <Alert variant="error" message={serverError} onDismiss={() => setServerError(null)} className="mb-6" />
          )}
          {successMessage && (
            <Alert variant="success" message={successMessage} className="mb-6" />
          )}

          <form onSubmit={handleSubmit} noValidate aria-label="Registration form">
            <div className="space-y-5">
              <Input
                id="register-email"
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
                id="register-password"
                label="Password"
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
                }}
                error={errors.password}
                required
                autoComplete="new-password"
                hint="Minimum 8 characters."
              />

              <Input
                id="register-confirm-password"
                label="Confirm password"
                type="password"
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) setErrors((p) => ({ ...p, confirmPassword: undefined }));
                }}
                error={errors.confirmPassword}
                required
                autoComplete="new-password"
              />

              <Button
                type="submit"
                className="w-full"
                loading={loading}
                loadingText="Creating account…"
              >
                Create Account
              </Button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-green-600 hover:text-green-700 focus-ring rounded">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
