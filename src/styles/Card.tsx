import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'glow';
  border?: boolean;
  hoverable?: boolean;
  glass?: boolean;
  gradient?: boolean;
  onClick?: () => void;
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
  gradient?: boolean;
}

interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right' | 'between';
}

const Card: React.FC<CardProps> & {
  Header: React.FC<CardHeaderProps>;
  Body: React.FC<CardBodyProps>;
  Footer: React.FC<CardFooterProps>;
} = ({
  children,
  className = '',
  padding = 'none',
  shadow = 'sm',
  border = true,
  hoverable = false,
  glass = false,
  gradient = false,
  onClick
}) => {
  const getPaddingClasses = () => {
    switch (padding) {
      case 'sm':
        return 'p-4';
      case 'md':
        return 'p-5';
      case 'lg':
        return 'p-6';
      default:
        return '';
    }
  };

  const getShadowClasses = () => {
    switch (shadow) {
      case 'none':
        return '';
      case 'md':
        return 'shadow-md';
      case 'lg':
        return 'shadow-lg';
      case 'glow':
        return 'shadow-glow';
      default:
        return 'shadow-card';
    }
  };

  const baseClasses = glass 
    ? 'bg-white/70 backdrop-blur-xl rounded-2xl' 
    : gradient
    ? 'bg-gradient-to-br from-white to-neutral-50 rounded-2xl'
    : 'bg-white/90 backdrop-blur-sm rounded-2xl';
  const paddingClasses = getPaddingClasses();
  const shadowClasses = getShadowClasses();
  const borderClasses = border ? 'border border-neutral-100/80' : '';
  const hoverClasses = hoverable ? 'hover:shadow-card-hover hover:-translate-y-1 hover:border-neutral-200 transition-all duration-300 cursor-pointer' : 'transition-all duration-300';
  const clickableClasses = onClick ? 'cursor-pointer' : '';

  return (
    <div 
      className={`${baseClasses} ${paddingClasses} ${shadowClasses} ${borderClasses} ${hoverClasses} ${clickableClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '', action, gradient = false }) => {
  const bgClass = gradient 
    ? 'bg-gradient-to-r from-neutral-50 to-neutral-100/50' 
    : 'bg-neutral-50/50';
  
  return (
    <div className={`px-6 py-4 border-b border-neutral-100 flex items-center justify-between rounded-t-2xl ${bgClass} ${className}`}>
      <div className="font-semibold text-neutral-900">{children}</div>
      {action && <div>{action}</div>}
    </div>
  );
};

const CardBody: React.FC<CardBodyProps> = ({ children, className = '' }) => {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  );
};

const CardFooter: React.FC<CardFooterProps> = ({ children, className = '', align = 'right' }) => {
  const getAlignClasses = () => {
    switch (align) {
      case 'left':
        return 'justify-start';
      case 'center':
        return 'justify-center';
      case 'between':
        return 'justify-between';
      default:
        return 'justify-end';
    }
  };

  return (
    <div className={`px-6 py-4 border-t border-neutral-100 bg-neutral-50/50 rounded-b-2xl flex items-center gap-3 ${getAlignClasses()} ${className}`}>
      {children}
    </div>
  );
};

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;
