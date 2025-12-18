import React from 'react';

interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'white' | 'neutral' | 'accent';
  className?: string;
  gradient?: boolean;
}

const Spinner: React.FC<SpinnerProps> = ({ 
  size = 'md', 
  color = 'primary',
  className = '',
  gradient = false
}) => {
  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  const borderWidths = {
    xs: 'border',
    sm: 'border-2',
    md: 'border-2',
    lg: 'border-[3px]',
    xl: 'border-4'
  };

  const colorClasses = {
    primary: 'border-t-primary-500 border-r-primary-300 border-b-primary-100',
    secondary: 'border-t-neutral-600 border-r-neutral-400 border-b-neutral-200',
    success: 'border-t-success-500 border-r-success-300 border-b-success-100',
    danger: 'border-t-danger-500 border-r-danger-300 border-b-danger-100',
    warning: 'border-t-warning-500 border-r-warning-300 border-b-warning-100',
    white: 'border-t-white border-r-white/60 border-b-white/30',
    neutral: 'border-t-neutral-400 border-r-neutral-300 border-b-neutral-200',
    accent: 'border-t-accent-500 border-r-accent-300 border-b-accent-100'
  };

  if (gradient) {
    return (
      <div 
        className={`animate-spin rounded-full ${sizeClasses[size]} ${className}`}
        role="status"
        aria-label="Loading"
        style={{
          background: 'conic-gradient(from 0deg, transparent, #a855f7)',
          WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), #000 0)',
          mask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), #000 0)'
        }}
      >
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  return (
    <div 
      className={`animate-spin rounded-full border-l-transparent ${colorClasses[color]} ${borderWidths[size]} ${sizeClasses[size]} ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default Spinner;
