import React from 'react';
import { Link } from 'react-router-dom';

export const NotFound: React.FC = () => (
  <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center px-4 py-16">
    <div className="text-center max-w-md">
      <div className="text-8xl font-black text-gray-100 select-none" aria-hidden="true">404</div>
      <div className="text-5xl mb-5" aria-hidden="true">🌾</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-3">Page Not Found</h1>
      <p className="text-gray-600 mb-8 text-sm leading-relaxed">
        The page you're looking for doesn't exist or has been moved.
        Let's get you back to your farm dashboard.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link to="/dashboard" className="btn btn-primary">
          Go to Dashboard
        </Link>
        <Link to="/" className="btn btn-secondary">
          Back to Home
        </Link>
      </div>
    </div>
  </div>
);
