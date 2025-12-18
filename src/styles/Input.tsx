import React, { forwardRef } from 'react';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'error' | 'success';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  hint,
  size = 'md',
  variant = 'default',
  leftIcon,
  rightIcon,
  fullWidth = true,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2.5 py-1.5 text-xs';
      case 'lg':
        return 'px-4 py-3 text-base';
      default:
        return 'px-3 py-2 text-sm';
    }
  };

  const getVariantClasses = () => {
    if (error || variant === 'error') {
      return 'border-danger-300 focus:ring-danger-500 focus:border-danger-500';
    }
    if (variant === 'success') {
      return 'border-success-300 focus:ring-success-500 focus:border-success-500';
    }
    return 'border-neutral-300 focus:ring-primary-500 focus:border-primary-500';
  };

  const baseClasses = 'block rounded-md bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 transition-colors duration-200 disabled:bg-neutral-50 disabled:text-neutral-500 disabled:cursor-not-allowed';
  const sizeClasses = getSizeClasses();
  const variantClasses = getVariantClasses();
  const widthClasses = fullWidth ? 'w-full' : '';
  const iconPaddingLeft = leftIcon ? 'pl-10' : '';
  const iconPaddingRight = rightIcon ? 'pr-10' : '';

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-neutral-700 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`${baseClasses} ${sizeClasses} ${variantClasses} ${widthClasses} ${iconPaddingLeft} ${iconPaddingRight} border ${className}`}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-neutral-400">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-danger-600">{error}</p>
      )}
      {hint && !error && (
        <p className="mt-1.5 text-sm text-neutral-500">{hint}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
