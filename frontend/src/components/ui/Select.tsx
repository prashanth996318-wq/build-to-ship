import React from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  hint,
  options,
  placeholder,
  required,
  id,
  className = '',
  ...props
}) => {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  const errorId = `${selectId}-error`;
  const hintId = `${selectId}-hint`;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="form-label">
          {label}
          {required && <span className="ml-1 text-red-500" aria-hidden="true">*</span>}
        </label>
      )}

      <div className="relative">
        <select
          id={selectId}
          className={`form-select ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : ''} ${className}`}
          aria-describedby={`${error ? errorId : ''} ${hint ? hintId : ''}`.trim() || undefined}
          aria-invalid={error ? 'true' : undefined}
          required={required}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {/* Custom dropdown arrow */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3" aria-hidden="true">
          <svg className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
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
