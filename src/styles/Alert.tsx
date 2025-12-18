import React from 'react';

interface AlertProps {
  children: React.ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
  icon?: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

const Alert: React.FC<AlertProps> = ({
  children,
  variant = 'info',
  title,
  icon,
  dismissible = false,
  onDismiss,
  className = ''
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'success':
        return 'bg-success-50 border-success-200 text-success-800';
      case 'warning':
        return 'bg-warning-50 border-warning-200 text-warning-800';
      case 'danger':
        return 'bg-danger-50 border-danger-200 text-danger-800';
      default:
        return 'bg-info-50 border-info-200 text-info-800';
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case 'success':
        return 'text-success-500';
      case 'warning':
        return 'text-warning-500';
      case 'danger':
        return 'text-danger-500';
      default:
        return 'text-info-500';
    }
  };

  const getDefaultIcon = () => {
    switch (variant) {
      case 'success':
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'danger':
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className={`p-4 rounded-lg border ${getVariantClasses()} ${className}`} role="alert">
      <div className="flex">
        <div className={`flex-shrink-0 ${getIconColor()}`}>
          {icon || getDefaultIcon()}
        </div>
        <div className="ml-3 flex-1">
          {title && <h3 className="text-sm font-medium mb-1">{title}</h3>}
          <div className="text-sm">{children}</div>
        </div>
        {dismissible && onDismiss && (
          <button
            onClick={onDismiss}
            className={`ml-auto pl-3 ${getIconColor()} hover:opacity-75`}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;
