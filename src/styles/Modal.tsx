import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  variant?: 'default' | 'danger' | 'success';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  glass?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  size = 'md',
  showCloseButton = true,
  variant = 'default',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  glass = false
}) => {
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, closeOnEscape]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'w-11/12 max-w-md',
    md: 'w-11/12 max-w-2xl',
    lg: 'w-11/12 max-w-4xl',
    xl: 'w-11/12 max-w-7xl',
    full: 'w-11/12 max-w-full'
  };

  const getTitleClasses = () => {
    switch (variant) {
      case 'danger':
        return 'text-xl font-bold text-danger-700';
      case 'success':
        return 'text-xl font-bold text-success-700';
      default:
        return 'text-xl font-bold text-neutral-900';
    }
  };

  const getIconBg = () => {
    switch (variant) {
      case 'danger':
        return 'bg-danger-100 text-danger-600';
      case 'success':
        return 'bg-success-100 text-success-600';
      default:
        return 'bg-primary-100 text-primary-600';
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  const containerClasses = glass
    ? 'bg-white/80 backdrop-blur-2xl border border-white/30'
    : 'bg-white/95 backdrop-blur-xl border border-neutral-100';

  return (
    <div 
      className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-start justify-center pt-10 animate-fade-in"
      onClick={handleOverlayClick}
    >
      <div className={`${sizeClasses[size]} p-6 shadow-2xl rounded-2xl max-h-[90vh] overflow-y-auto animate-scale-in ${containerClasses}`}>
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-100">
            {title && (
              <div className="flex items-center gap-3">
                {variant !== 'default' && (
                  <div className={`p-2 rounded-xl ${getIconBg()}`}>
                    {variant === 'danger' ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    ) : variant === 'success' ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : null}
                  </div>
                )}
                <h3 className={getTitleClasses()}>{title}</h3>
              </div>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-neutral-400 hover:text-neutral-600 focus:outline-none p-2 hover:bg-neutral-100 rounded-xl transition-all duration-200"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

export default Modal;
