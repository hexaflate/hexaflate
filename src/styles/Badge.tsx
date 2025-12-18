import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'neutral' | 'default';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  dot?: boolean;
  icon?: React.ReactNode;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  dot = false,
  icon
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-primary-100 text-primary-800';
      case 'success':
        return 'bg-success-100 text-success-800';
      case 'danger':
        return 'bg-danger-100 text-danger-800';
      case 'warning':
        return 'bg-warning-100 text-warning-800';
      case 'info':
        return 'bg-info-100 text-info-800';
      case 'neutral':
        return 'bg-neutral-100 text-neutral-800';
      default:
        return 'bg-neutral-100 text-neutral-800';
    }
  };

  const getDotColor = () => {
    switch (variant) {
      case 'primary':
        return 'bg-primary-500';
      case 'success':
        return 'bg-success-500';
      case 'danger':
        return 'bg-danger-500';
      case 'warning':
        return 'bg-warning-500';
      case 'info':
        return 'bg-info-500';
      case 'neutral':
        return 'bg-neutral-500';
      default:
        return 'bg-neutral-500';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-0.5 text-xs';
      case 'lg':
        return 'px-3 py-1 text-sm';
      default:
        return 'px-2.5 py-0.5 text-xs';
    }
  };

  const baseClasses = 'inline-flex items-center font-medium rounded-full';
  const variantClasses = getVariantClasses();
  const sizeClasses = getSizeClasses();

  return (
    <span className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`}>
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${getDotColor()}`} />
      )}
      {icon && (
        <span className="mr-1">{icon}</span>
      )}
      {children}
    </span>
  );
};

export default Badge;
