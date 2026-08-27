import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftAddon?: string;
  rightAddon?: string;
  required?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  leftAddon,
  rightAddon,
  required,
  id,
  className = '',
  ...props
}) => {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label}
          {required && <span className="ml-1 text-red-500" aria-hidden="true">*</span>}
        </label>
      )}

      <div className="relative flex">
        {leftAddon && (
          <span className="inline-flex items-center rounded-l-xl border border-r-0 border-gray-300 bg-gray-50 px-3 text-sm text-gray-500 select-none">
            {leftAddon}
          </span>
        )}

        <input
          id={inputId}
          className={`form-input ${leftAddon ? 'rounded-l-none' : ''} ${rightAddon ? 'rounded-r-none' : ''} ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : ''} ${className}`}
          aria-describedby={`${error ? errorId : ''} ${hint ? hintId : ''}`.trim() || undefined}
          aria-invalid={error ? 'true' : undefined}
          required={required}
          {...props}
        />

        {rightAddon && (
          <span className="inline-flex items-center rounded-r-xl border border-l-0 border-gray-300 bg-gray-50 px-3 text-sm text-gray-500 select-none">
            {rightAddon}
          </span>
        )}
      </div>

      {error && (
        <p id={errorId} className="form-error" role="alert">
          <svg className="h-3.5 w-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}

      {hint && !error && (
        <p id={hintId} className="form-hint">
          {hint}
        </p>
      )}
    </div>
  );
};
