import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  showCount?: boolean;
  maxLength?: number;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  hint,
  required,
  showCount,
  maxLength,
  id,
  value,
  className = '',
  ...props
}) => {
  const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  const errorId = `${textareaId}-error`;
  const hintId = `${textareaId}-hint`;
  const currentLength = typeof value === 'string' ? value.length : 0;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={textareaId} className="form-label">
          {label}
          {required && <span className="ml-1 text-red-500" aria-hidden="true">*</span>}
        </label>
      )}

      <textarea
        id={textareaId}
        className={`form-textarea ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : ''} ${className}`}
        aria-describedby={`${error ? errorId : ''} ${hint ? hintId : ''}`.trim() || undefined}
        aria-invalid={error ? 'true' : undefined}
        required={required}
        maxLength={maxLength}
        value={value}
        {...props}
      />

      <div className="flex items-start justify-between mt-1.5">
        <div>
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
        {showCount && maxLength && (
          <span className={`text-xs ml-auto ${currentLength >= maxLength ? 'text-red-500' : 'text-gray-400'}`}>
            {currentLength}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
};
