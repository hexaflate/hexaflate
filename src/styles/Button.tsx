import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost' | 'outline' | 'link' | 'glass' | 'accent';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  type = 'button',
  className = '',
  icon,
  iconPosition = 'left',
  fullWidth = false
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 shadow-lg hover:shadow-xl hover:-translate-y-0.5 focus:ring-primary-400/50';
      case 'secondary':
        return 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 hover:text-neutral-900 focus:ring-neutral-300';
      case 'success':
        return 'bg-gradient-to-r from-success-500 to-success-600 text-white hover:from-success-600 hover:to-success-700 shadow-lg hover:shadow-xl hover:-translate-y-0.5 focus:ring-success-400/50';
      case 'danger':
        return 'bg-gradient-to-r from-danger-500 to-danger-600 text-white hover:from-danger-600 hover:to-danger-700 shadow-lg hover:shadow-xl hover:-translate-y-0.5 focus:ring-danger-400/50';
      case 'warning':
        return 'bg-gradient-to-r from-warning-500 to-warning-600 text-white hover:from-warning-600 hover:to-warning-700 shadow-lg hover:shadow-xl hover:-translate-y-0.5 focus:ring-warning-400/50';
      case 'ghost':
        return 'bg-transparent text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800 focus:ring-neutral-300 border border-neutral-200 hover:border-neutral-300';
      case 'outline':
        return 'bg-transparent text-primary-600 hover:bg-primary-50 focus:ring-primary-300 border-2 border-primary-300 hover:border-primary-400';
      case 'link':
        return 'bg-transparent text-primary-600 hover:text-primary-700 hover:underline focus:ring-primary-400/50 p-0';
      case 'glass':
        return 'bg-white/70 backdrop-blur-md text-neutral-800 border border-white/30 hover:bg-white/80 hover:border-white/50 focus:ring-neutral-300 shadow-glass';
      case 'accent':
        return 'bg-gradient-to-r from-accent-500 to-primary-500 text-white hover:from-accent-600 hover:to-primary-600 shadow-lg hover:shadow-xl hover:-translate-y-0.5 focus:ring-accent-400/50';
      default:
        return 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 shadow-lg hover:shadow-xl hover:-translate-y-0.5 focus:ring-primary-400/50';
    }
  };

  const getSizeClasses = () => {
    if (variant === 'link') {
      switch (size) {
        case 'xs':
          return 'text-xs';
        case 'sm':
          return 'text-sm';
        case 'lg':
          return 'text-base';
        default:
          return 'text-sm';
      }
    }
    switch (size) {
      case 'xs':
        return 'px-2.5 py-1 text-xs gap-1';
      case 'sm':
        return 'px-3.5 py-1.5 text-sm gap-1.5';
      case 'lg':
        return 'px-7 py-3.5 text-base gap-2.5';
      default:
        return 'px-5 py-2.5 text-sm gap-2';
    }
  };

  const baseClasses = variant === 'link' 
    ? 'inline-flex items-center font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-300'
    : 'inline-flex items-center justify-center font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-300 transform active:scale-[0.98]';
  const variantClasses = getVariantClasses();
  const sizeClasses = getSizeClasses();
  const disabledClasses = disabled || loading ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer';
  const widthClasses = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${disabledClasses} ${widthClasses} ${className}`}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {!loading && icon && iconPosition === 'left' && (
        <span className="flex-shrink-0">{icon}</span>
      )}
      {children}
      {!loading && icon && iconPosition === 'right' && (
        <span className="flex-shrink-0">{icon}</span>
      )}
    </button>
  );
};

export default Button;
