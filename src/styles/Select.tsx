import React, { forwardRef } from 'react';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'error' | 'success';
  options: SelectOption[];
  placeholder?: string;
  fullWidth?: boolean;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  error,
  hint,
  size = 'md',
  variant = 'default',
  options,
  placeholder,
  fullWidth = true,
  className = '',
  id,
  ...props
}, ref) => {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
  
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-2 text-xs';
      case 'lg':
        return 'px-5 py-3.5 text-base';
      default:
        return 'px-4 py-2.5 text-sm';
    }
  };

  const getVariantClasses = () => {
    if (error || variant === 'error') {
      return 'border-danger-300 focus:ring-danger-400/50 focus:border-danger-400 bg-danger-50/30';
    }
    if (variant === 'success') {
      return 'border-success-300 focus:ring-success-400/50 focus:border-success-400 bg-success-50/30';
    }
    return 'border-neutral-200 focus:ring-primary-400/50 focus:border-primary-400 hover:border-neutral-300';
  };

  const baseClasses = 'block rounded-xl bg-white/80 backdrop-blur-sm text-neutral-900 focus:outline-none focus:ring-2 transition-all duration-200 disabled:bg-neutral-100 disabled:text-neutral-400 disabled:cursor-not-allowed appearance-none bg-no-repeat cursor-pointer';
  const sizeClasses = getSizeClasses();
  const variantClasses = getVariantClasses();
  const widthClasses = fullWidth ? 'w-full' : '';

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label htmlFor={selectId} className="block text-sm font-semibold text-neutral-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={`${baseClasses} ${sizeClasses} ${variantClasses} ${widthClasses} border pr-12 ${className}`}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
            backgroundPosition: 'right 1rem center',
            backgroundSize: '1.25em 1.25em'
          }}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      {error && (
        <p className="mt-2 text-sm text-danger-600 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="mt-2 text-sm text-neutral-500">{hint}</p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;
