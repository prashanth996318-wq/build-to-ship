import React from 'react';

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  message: string;
  onDismiss?: () => void;
  className?: string;
}

const variantConfig: Record<AlertVariant, { bg: string; border: string; icon: React.ReactNode; titleColor: string; msgColor: string }> = {
  info: {
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    titleColor: 'text-sky-800',
    msgColor: 'text-sky-700',
    icon: (
      <svg className="h-5 w-5 text-sky-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    ),
  },
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    titleColor: 'text-green-800',
    msgColor: 'text-green-700',
    icon: (
      <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    titleColor: 'text-amber-800',
    msgColor: 'text-amber-700',
    icon: (
      <svg className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    titleColor: 'text-red-800',
    msgColor: 'text-red-700',
    icon: (
      <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
  },
};

export const Alert: React.FC<AlertProps> = ({ variant = 'info', title, message, onDismiss, className = '' }) => {
  const config = variantConfig[variant];

  return (
    <div
      role="alert"
      className={`rounded-xl border p-4 flex gap-3 ${config.bg} ${config.border} ${className}`}
    >
      <div className="flex-shrink-0 mt-0.5">{config.icon}</div>
      <div className="flex-1 min-w-0">
        {title && <p className={`text-sm font-semibold ${config.titleColor}`}>{title}</p>}
        <p className={`text-sm ${config.msgColor} ${title ? 'mt-0.5' : ''}`}>{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className={`flex-shrink-0 ml-auto ${config.msgColor} hover:opacity-70 transition-opacity`}
          aria-label="Dismiss alert"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </div>
  );
};
